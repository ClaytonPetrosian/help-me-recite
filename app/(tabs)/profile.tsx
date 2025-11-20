import Colors from "@/constants/colors";
import { useAuth } from "@/contexts/AuthContext";
import { useProgress } from "@/contexts/ProgressContext";
import { Stack, router } from "expo-router";
import { Award, LogOut, Target, User as UserIcon } from "lucide-react-native";
import React from "react";
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { currentUser, logout } = useAuth();
  const { progress, updateDailyGoal } = useProgress();

  const handleLogout = () => {
    Alert.alert("退出登录", "确定要退出登录吗？", [
      { text: "取消", style: "cancel" },
      {
        text: "退出",
        style: "destructive",
        onPress: async () => {
          await logout();
          router.replace("/login");
        },
      },
    ]);
  };

  const handleUpdateGoal = () => {
    Alert.alert("设置每日目标", "选择每日学习单词数", [
      { text: "10", onPress: () => updateDailyGoal(10) },
      { text: "20", onPress: () => updateDailyGoal(20) },
      { text: "30", onPress: () => updateDailyGoal(30) },
      { text: "50", onPress: () => updateDailyGoal(50) },
      { text: "取消", style: "cancel" },
    ]);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Stack.Screen options={{ headerShown: false }} />
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>我的</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <UserIcon size={48} color={Colors.background} />
          </View>
          <Text style={styles.username}>{currentUser?.username}</Text>
          <Text style={styles.joinDate}>
            加入于 {new Date(currentUser?.createdAt || "").toLocaleDateString("zh-CN")}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>学习统计</Text>
          
          <View style={styles.statCard}>
            <Award size={24} color={Colors.accent} />
            <View style={styles.statContent}>
              <Text style={styles.statLabel}>今日完成</Text>
              <Text style={styles.statValue}>
                {progress.wordsReviewed} / {progress.dailyGoal}
              </Text>
            </View>
          </View>

          <View style={styles.statCard}>
            <Target size={24} color={Colors.primary} />
            <View style={styles.statContent}>
              <Text style={styles.statLabel}>正确率</Text>
              <Text style={styles.statValue}>
                {progress.wordsReviewed > 0
                  ? Math.round((progress.wordsCorrect / progress.wordsReviewed) * 100)
                  : 0}%
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>设置</Text>
          
          <TouchableOpacity style={styles.settingItem} onPress={handleUpdateGoal}>
            <Target size={20} color={Colors.primary} />
            <Text style={styles.settingText}>每日目标</Text>
            <Text style={styles.settingValue}>{progress.dailyGoal} 词</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <LogOut size={20} color={Colors.error} />
            <Text style={styles.logoutText}>退出登录</Text>
          </TouchableOpacity>
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
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold" as const,
    color: Colors.text,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  profileCard: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    marginBottom: 24,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  username: {
    fontSize: 24,
    fontWeight: "bold" as const,
    color: Colors.text,
    marginBottom: 4,
  },
  joinDate: {
    fontSize: 14,
    color: Colors.textLight,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold" as const,
    color: Colors.text,
    marginBottom: 12,
  },
  statCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statContent: {
    marginLeft: 16,
    flex: 1,
  },
  statLabel: {
    fontSize: 14,
    color: Colors.textLight,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "bold" as const,
    color: Colors.primary,
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  settingText: {
    fontSize: 16,
    color: Colors.text,
    marginLeft: 12,
    flex: 1,
  },
  settingValue: {
    fontSize: 16,
    color: Colors.textLight,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: Colors.error,
  },
  logoutText: {
    fontSize: 16,
    color: Colors.error,
    marginLeft: 12,
    fontWeight: "600" as const,
  },
});
