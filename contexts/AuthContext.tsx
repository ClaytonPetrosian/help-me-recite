import { User } from "@/types";
import createContextHook from "@nkzw/create-context-hook";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";

const STORAGE_KEY = "vocab_users";
const CURRENT_USER_KEY = "vocab_current_user";

export const [AuthProvider, useAuth] = createContextHook(() => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);

  const usersQuery = useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    },
  });

  useEffect(() => {
    const loadCurrentUser = async () => {
      const storedUserId = await AsyncStorage.getItem(CURRENT_USER_KEY);
      if (storedUserId && usersQuery.data) {
        const user = usersQuery.data.find((u: User) => u.id === storedUserId);
        if (user) {
          setCurrentUser(user);
        }
      }
      setIsInitialized(true);
    };

    if (usersQuery.data) {
      loadCurrentUser();
    }
  }, [usersQuery.data]);

  const registerMutation = useMutation({
    mutationFn: async ({ username, password }: { username: string; password: string }) => {
      const users = usersQuery.data || [];
      
      const existingUser = users.find((u: User) => u.username === username);
      if (existingUser) {
        throw new Error("用户名已存在");
      }

      const newUser: User = {
        id: Date.now().toString(),
        username,
        password,
        createdAt: new Date().toISOString(),
      };

      const updatedUsers = [...users, newUser];
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedUsers));
      return newUser;
    },
    onSuccess: () => {
      usersQuery.refetch();
    },
  });

  const loginMutation = useMutation({
    mutationFn: async ({ username, password }: { username: string; password: string }) => {
      const users = usersQuery.data || [];
      const user = users.find((u: User) => u.username === username && u.password === password);
      
      if (!user) {
        throw new Error("用户名或密码错误");
      }

      await AsyncStorage.setItem(CURRENT_USER_KEY, user.id);
      return user;
    },
    onSuccess: (user) => {
      setCurrentUser(user);
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await AsyncStorage.removeItem(CURRENT_USER_KEY);
    },
    onSuccess: () => {
      setCurrentUser(null);
    },
  });

  return {
    currentUser,
    isInitialized,
    isLoading: usersQuery.isLoading || !isInitialized,
    register: registerMutation.mutateAsync,
    login: loginMutation.mutateAsync,
    logout: logoutMutation.mutateAsync,
    isRegistering: registerMutation.isPending,
    isLoggingIn: loginMutation.isPending,
    registerError: registerMutation.error,
    loginError: loginMutation.error,
  };
});
