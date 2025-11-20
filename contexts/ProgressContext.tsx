import { PracticeSession, Progress } from "@/types";
import createContextHook from "@nkzw/create-context-hook";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useAuth } from "./AuthContext";

const PROGRESS_KEY = "vocab_progress";
const SESSIONS_KEY = "vocab_sessions";

export const [ProgressProvider, useProgress] = createContextHook(() => {
  const { currentUser } = useAuth();

  const progressQuery = useQuery({
    queryKey: ["progress", currentUser?.id],
    queryFn: async () => {
      if (!currentUser) return null;
      const stored = await AsyncStorage.getItem(`${PROGRESS_KEY}_${currentUser.id}`);
      return stored ? JSON.parse(stored) : getTodayProgress(currentUser.id);
    },
    enabled: !!currentUser,
  });

  const sessionsQuery = useQuery({
    queryKey: ["sessions", currentUser?.id],
    queryFn: async () => {
      if (!currentUser) return [];
      const stored = await AsyncStorage.getItem(`${SESSIONS_KEY}_${currentUser.id}`);
      return stored ? JSON.parse(stored) : [];
    },
    enabled: !!currentUser,
  });

  const updateProgressMutation = useMutation({
    mutationFn: async ({ correct, wordId }: { correct: boolean; wordId: string }) => {
      if (!currentUser) throw new Error("未登录");
      
      const progress = progressQuery.data || getTodayProgress(currentUser.id);
      const today = new Date().toISOString().split("T")[0];
      
      if (progress.date !== today) {
        progress.date = today;
        progress.wordsReviewed = 0;
        progress.wordsCorrect = 0;
      }

      progress.wordsReviewed += 1;
      if (correct) {
        progress.wordsCorrect += 1;
      }

      await AsyncStorage.setItem(`${PROGRESS_KEY}_${currentUser.id}`, JSON.stringify(progress));

      const sessions = sessionsQuery.data || [];
      const newSession: PracticeSession = {
        wordId,
        correct,
        timestamp: new Date().toISOString(),
      };
      const updatedSessions = [...sessions, newSession];
      await AsyncStorage.setItem(`${SESSIONS_KEY}_${currentUser.id}`, JSON.stringify(updatedSessions));

      return progress;
    },
    onSuccess: () => {
      progressQuery.refetch();
      sessionsQuery.refetch();
    },
  });

  const updateDailyGoalMutation = useMutation({
    mutationFn: async (goal: number) => {
      if (!currentUser) throw new Error("未登录");
      const progress = progressQuery.data || getTodayProgress(currentUser.id);
      progress.dailyGoal = goal;
      await AsyncStorage.setItem(`${PROGRESS_KEY}_${currentUser.id}`, JSON.stringify(progress));
      return progress;
    },
    onSuccess: () => {
      progressQuery.refetch();
    },
  });

  return {
    progress: progressQuery.data || getTodayProgress(currentUser?.id || ""),
    sessions: sessionsQuery.data || [],
    isLoading: progressQuery.isLoading || sessionsQuery.isLoading,
    updateProgress: updateProgressMutation.mutateAsync,
    updateDailyGoal: updateDailyGoalMutation.mutateAsync,
  };
});

function getTodayProgress(userId: string): Progress {
  return {
    userId,
    date: new Date().toISOString().split("T")[0],
    wordsReviewed: 0,
    wordsCorrect: 0,
    dailyGoal: 20,
  };
}
