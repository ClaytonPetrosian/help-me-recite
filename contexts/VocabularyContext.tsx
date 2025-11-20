import { Word } from "@/types";
import createContextHook from "@nkzw/create-context-hook";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useAuth } from "./AuthContext";

const WORDS_KEY = "vocab_words";
const LISTS_KEY = "vocab_lists";
const REVIEW_WORDS_KEY = "vocab_review_words";

export const [VocabularyProvider, useVocabulary] = createContextHook(() => {
  const { currentUser } = useAuth();

  const wordsQuery = useQuery({
    queryKey: ["words", currentUser?.id],
    queryFn: async () => {
      if (!currentUser) return [];
      const stored = await AsyncStorage.getItem(`${WORDS_KEY}_${currentUser.id}`);
      return stored ? JSON.parse(stored) : getDefaultWords();
    },
    enabled: !!currentUser,
  });

  const listsQuery = useQuery({
    queryKey: ["lists", currentUser?.id],
    queryFn: async () => {
      if (!currentUser) return [];
      const stored = await AsyncStorage.getItem(`${LISTS_KEY}_${currentUser.id}`);
      return stored ? JSON.parse(stored) : [];
    },
    enabled: !!currentUser,
  });

  const reviewWordsQuery = useQuery({
    queryKey: ["reviewWords", currentUser?.id],
    queryFn: async () => {
      if (!currentUser) return [];
      const stored = await AsyncStorage.getItem(`${REVIEW_WORDS_KEY}_${currentUser.id}`);
      return stored ? JSON.parse(stored) : [];
    },
    enabled: !!currentUser,
  });

  const addWordsMutation = useMutation({
    mutationFn: async (words: Word[]) => {
      if (!currentUser) throw new Error("未登录");
      const existing = wordsQuery.data || [];
      const updated = [...existing, ...words];
      await AsyncStorage.setItem(`${WORDS_KEY}_${currentUser.id}`, JSON.stringify(updated));
      return updated;
    },
    onSuccess: () => {
      wordsQuery.refetch();
    },
  });

  const deleteWordMutation = useMutation({
    mutationFn: async (wordId: string) => {
      if (!currentUser) throw new Error("未登录");
      const existing = wordsQuery.data || [];
      const updated = existing.filter((w: Word) => w.id !== wordId);
      await AsyncStorage.setItem(`${WORDS_KEY}_${currentUser.id}`, JSON.stringify(updated));
      return updated;
    },
    onSuccess: () => {
      wordsQuery.refetch();
    },
  });

  const addToReviewMutation = useMutation({
    mutationFn: async (wordId: string) => {
      if (!currentUser) throw new Error("未登录");
      const existing = reviewWordsQuery.data || [];
      if (!existing.includes(wordId)) {
        const updated = [...existing, wordId];
        await AsyncStorage.setItem(`${REVIEW_WORDS_KEY}_${currentUser.id}`, JSON.stringify(updated));
        return updated;
      }
      return existing;
    },
    onSuccess: () => {
      reviewWordsQuery.refetch();
    },
  });

  const removeFromReviewMutation = useMutation({
    mutationFn: async (wordId: string) => {
      if (!currentUser) throw new Error("未登录");
      const existing = reviewWordsQuery.data || [];
      const updated = existing.filter((id: string) => id !== wordId);
      await AsyncStorage.setItem(`${REVIEW_WORDS_KEY}_${currentUser.id}`, JSON.stringify(updated));
      return updated;
    },
    onSuccess: () => {
      reviewWordsQuery.refetch();
    },
  });

  const words = wordsQuery.data || [];
  const reviewWordIds = reviewWordsQuery.data || [];
  const reviewWords = words.filter((w: Word) => reviewWordIds.includes(w.id));

  return {
    words,
    lists: listsQuery.data || [],
    reviewWords,
    isLoading: wordsQuery.isLoading || listsQuery.isLoading || reviewWordsQuery.isLoading,
    addWords: addWordsMutation.mutateAsync,
    deleteWord: deleteWordMutation.mutateAsync,
    addToReview: addToReviewMutation.mutateAsync,
    removeFromReview: removeFromReviewMutation.mutateAsync,
  };
});

function getDefaultWords(): Word[] {
  return [
    {
      id: "1",
      word: "ambiguous",
      definitions: ["模糊的", "不明确的", "有歧义的"],
      category: "默认词库",
      addedAt: new Date().toISOString(),
    },
    {
      id: "2",
      word: "sophisticated",
      definitions: ["复杂的", "精密的", "老练的"],
      category: "默认词库",
      addedAt: new Date().toISOString(),
    },
    {
      id: "3",
      word: "comprehensive",
      definitions: ["全面的", "综合的", "广泛的"],
      category: "默认词库",
      addedAt: new Date().toISOString(),
    },
    {
      id: "4",
      word: "inevitable",
      definitions: ["不可避免的", "必然的"],
      category: "默认词库",
      addedAt: new Date().toISOString(),
    },
    {
      id: "5",
      word: "eloquent",
      definitions: ["雄辩的", "有说服力的", "富于表现力的"],
      category: "默认词库",
      addedAt: new Date().toISOString(),
    },
    {
      id: "6",
      word: "perseverance",
      definitions: ["毅力", "坚持不懈"],
      category: "默认词库",
      addedAt: new Date().toISOString(),
    },
    {
      id: "7",
      word: "profound",
      definitions: ["深刻的", "深奥的", "意义深远的"],
      category: "默认词库",
      addedAt: new Date().toISOString(),
    },
    {
      id: "8",
      word: "resilient",
      definitions: ["有弹性的", "能恢复的", "适应力强的"],
      category: "默认词库",
      addedAt: new Date().toISOString(),
    },
  ];
}
