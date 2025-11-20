import Colors from "@/constants/colors";
import { useAuth } from "@/contexts/AuthContext";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { BookOpen, Lock, User } from "lucide-react-native";
import React, { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function LoginScreen() {
  const [isRegister, setIsRegister] = useState<boolean>(false);
  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [error, setError] = useState<string>("");

  const { login, register, isLoggingIn, isRegistering } = useAuth();

  const handleSubmit = async () => {
    setError("");

    if (!username || !password) {
      setError("请填写所有字段");
      return;
    }

    if (isRegister && password !== confirmPassword) {
      setError("密码不匹配");
      return;
    }

    try {
      if (isRegister) {
        await register({ username, password });
        setIsRegister(false);
        setPassword("");
        setConfirmPassword("");
        setError("注册成功！请登录");
      } else {
        await login({ username, password });
        router.replace("/(tabs)");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "操作失败");
    }
  };

  const isLoading = isLoggingIn || isRegistering;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <LinearGradient
        colors={[Colors.primary, Colors.primary + "DD", Colors.accent + "33"]}
        style={styles.gradient}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.content}>
            <View style={styles.header}>
              <BookOpen size={64} color={Colors.background} />
              <Text style={styles.title}>词汇学习</Text>
              <Text style={styles.subtitle}>语音拼读 · 轻松记忆</Text>
            </View>

            <View style={styles.form}>
              <View style={styles.inputContainer}>
                <User size={20} color={Colors.primary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="用户名"
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="none"
                  placeholderTextColor={Colors.textLight}
                />
              </View>

              <View style={styles.inputContainer}>
                <Lock size={20} color={Colors.primary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="密码"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  placeholderTextColor={Colors.textLight}
                />
              </View>

              {isRegister && (
                <View style={styles.inputContainer}>
                  <Lock size={20} color={Colors.primary} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="确认密码"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry
                    placeholderTextColor={Colors.textLight}
                  />
                </View>
              )}

              {error ? <Text style={styles.error}>{error}</Text> : null}

              <TouchableOpacity
                style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
                onPress={handleSubmit}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color={Colors.background} />
                ) : (
                  <Text style={styles.submitButtonText}>
                    {isRegister ? "注册" : "登录"}
                  </Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.switchButton}
                onPress={() => {
                  setIsRegister(!isRegister);
                  setError("");
                }}
                disabled={isLoading}
              >
                <Text style={styles.switchButtonText}>
                  {isRegister ? "已有账号？去登录" : "没有账号？去注册"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 24,
  },
  content: {
    width: "100%",
    maxWidth: 400,
    alignSelf: "center",
  },
  header: {
    alignItems: "center",
    marginBottom: 48,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold" as const,
    color: Colors.background,
    marginTop: 16,
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.background + "CC",
    marginTop: 8,
  },
  form: {
    backgroundColor: Colors.background,
    borderRadius: 24,
    padding: 24,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.card,
    borderRadius: 12,
    marginBottom: 16,
    paddingHorizontal: 16,
    height: 56,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: Colors.text,
  },
  error: {
    color: Colors.error,
    fontSize: 14,
    marginBottom: 16,
    textAlign: "center",
  },
  submitButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    height: 56,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: Colors.background,
    fontSize: 18,
    fontWeight: "600" as const,
  },
  switchButton: {
    marginTop: 16,
    alignItems: "center",
  },
  switchButtonText: {
    color: Colors.primary,
    fontSize: 14,
  },
});
