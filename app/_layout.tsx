import { AuthProvider } from "@/contexts/AuthContext";
import { MusicProvider } from "@/contexts/MusicContext";
import { ProgressProvider } from "@/contexts/ProgressContext";
import { VocabularyProvider } from "@/contexts/VocabularyContext";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerBackTitle: "返回" }}>
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="practice" options={{ title: "语音拼读", presentation: "modal" }} />
      <Stack.Screen name="speed-review" options={{ title: "速背模式", presentation: "modal" }} />
      <Stack.Screen name="+not-found" options={{ title: "未找到" }} />
    </Stack>
  );
}

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <AuthProvider>
          <VocabularyProvider>
            <ProgressProvider>
              <MusicProvider>
                <RootLayoutNav />
              </MusicProvider>
            </ProgressProvider>
          </VocabularyProvider>
        </AuthProvider>
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}
