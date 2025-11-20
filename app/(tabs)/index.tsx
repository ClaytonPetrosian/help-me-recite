import Colors from "@/constants/colors";
import { useMusic } from "@/contexts/MusicContext";
import { useProgress } from "@/contexts/ProgressContext";
import { useVocabulary } from "@/contexts/VocabularyContext";
import { LinearGradient } from "expo-linear-gradient";
import { router, Stack } from "expo-router";
import {
  BookOpen,
  ChevronRight,
  Mic,
  Music,
  Pause,
  Play,
  TrendingUp,
  Trophy,
  Zap,
} from "lucide-react-native";
import React from "react";
import {
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { progress } = useProgress();
  const { words, reviewWords } = useVocabulary();
  const { isPlaying, currentTrack, play, pause } = useMusic();

  const progressPercentage = progress.dailyGoal > 0
    ? Math.min((progress.wordsReviewed / progress.dailyGoal) * 100, 100)
    : 0;

  const accuracy = progress.wordsReviewed > 0
    ? Math.round((progress.wordsCorrect / progress.wordsReviewed) * 100)
    : 0;

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      
      <LinearGradient
        colors={[Colors.primary, Colors.primary + "EE"]}
        style={[styles.header, { paddingTop: insets.top + 16 }]}
      >
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.greeting}>早上好</Text>
            <Text style={styles.headerTitle}>开始今天的学习</Text>
          </View>
          <TouchableOpacity style={styles.trophyButton}>
            <Trophy size={24} color={Colors.accent} />
          </TouchableOpacity>
        </View>

        <View style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressTitle}>今日目标</Text>
            <Text style={styles.progressCount}>
              {progress.wordsReviewed}/{progress.dailyGoal}
            </Text>
          </View>
          <View style={styles.progressBarContainer}>
            <View
              style={[styles.progressBar, { width: `${progressPercentage}%` }]}
            />
          </View>
          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{progress.wordsCorrect}</Text>
              <Text style={styles.statLabel}>正确</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{accuracy}%</Text>
              <Text style={styles.statLabel}>准确率</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{reviewWords.length}</Text>
              <Text style={styles.statLabel}>生词</Text>
            </View>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionTitle}>学习模式</Text>

        <TouchableOpacity
          style={styles.featureCard}
          onPress={() => router.push("/practice")}
        >
          <LinearGradient
            colors={[Colors.accent, Colors.accent + "DD"]}
            style={styles.featureGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.featureIcon}>
              <Mic size={32} color={Colors.background} />
            </View>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>语音拼读</Text>
              <Text style={styles.featureDescription}>
                听中文说英文，智能识别拼读
              </Text>
            </View>
            <ChevronRight size={24} color={Colors.background} />
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.featureCard}
          onPress={() => router.push("/speed-review")}
        >
          <LinearGradient
            colors={[Colors.primary, Colors.primary + "DD"]}
            style={styles.featureGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.featureIcon}>
              <Zap size={32} color={Colors.background} />
            </View>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>速背模式</Text>
              <Text style={styles.featureDescription}>
                快速浏览单词，自动播放发音
              </Text>
            </View>
            <ChevronRight size={24} color={Colors.background} />
          </LinearGradient>
        </TouchableOpacity>

        <View style={styles.musicCard}>
          <View style={styles.musicHeader}>
            <Music size={24} color={Colors.primary} />
            <View style={styles.musicInfo}>
              <Text style={styles.musicTitle}>背景音乐</Text>
              <Text style={styles.musicTrack}>{currentTrack.name}</Text>
            </View>
            <TouchableOpacity
              style={styles.musicButton}
              onPress={isPlaying ? pause : play}
            >
              {isPlaying ? (
                <Pause size={24} color={Colors.background} />
              ) : (
                <Play size={24} color={Colors.background} />
              )}
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.sectionTitle}>词库统计</Text>

        <View style={styles.statsCard}>
          <View style={styles.statsCardItem}>
            <BookOpen size={24} color={Colors.primary} />
            <Text style={styles.statsCardValue}>{words.length}</Text>
            <Text style={styles.statsCardLabel}>总词汇量</Text>
          </View>
          <View style={styles.statsCardDivider} />
          <View style={styles.statsCardItem}>
            <TrendingUp size={24} color={Colors.accent} />
            <Text style={styles.statsCardValue}>{reviewWords.length}</Text>
            <Text style={styles.statsCardLabel}>待复习</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  greeting: {
    fontSize: 16,
    color: Colors.background + "CC",
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold" as const,
    color: Colors.background,
  },
  trophyButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.background + "22",
    justifyContent: "center",
    alignItems: "center",
  },
  progressCard: {
    backgroundColor: Colors.background,
    borderRadius: 20,
    padding: 20,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: Colors.text,
  },
  progressCount: {
    fontSize: 18,
    fontWeight: "bold" as const,
    color: Colors.primary,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: Colors.card,
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 16,
  },
  progressBar: {
    height: "100%",
    backgroundColor: Colors.accent,
    borderRadius: 4,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  stat: {
    alignItems: "center",
  },
  statValue: {
    fontSize: 24,
    fontWeight: "bold" as const,
    color: Colors.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textLight,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold" as const,
    color: Colors.text,
    marginBottom: 16,
    marginTop: 8,
  },
  featureCard: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  featureGradient: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
  },
  featureIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: "bold" as const,
    color: Colors.background,
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    color: Colors.background + "DD",
  },
  statsCard: {
    flexDirection: "row",
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  statsCardItem: {
    flex: 1,
    alignItems: "center",
  },
  statsCardDivider: {
    width: 1,
    backgroundColor: Colors.border,
    marginHorizontal: 20,
  },
  statsCardValue: {
    fontSize: 28,
    fontWeight: "bold" as const,
    color: Colors.primary,
    marginTop: 12,
    marginBottom: 4,
  },
  statsCardLabel: {
    fontSize: 14,
    color: Colors.textLight,
  },
  musicCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  musicHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  musicInfo: {
    flex: 1,
    marginLeft: 16,
  },
  musicTitle: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: Colors.text,
    marginBottom: 4,
  },
  musicTrack: {
    fontSize: 14,
    color: Colors.textLight,
  },
  musicButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
});
