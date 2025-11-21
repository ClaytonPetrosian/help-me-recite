import Colors from "@/constants/colors";
import { useProgress } from "@/contexts/ProgressContext";
import { useVocabulary } from "@/contexts/VocabularyContext";
import { Audio, InterruptionModeAndroid } from "expo-av";
import { router } from "expo-router";
import * as Speech from "expo-speech";
import { Check, ChevronRight, Mic, Volume2, X } from "lucide-react-native";
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Linking,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function PracticeScreen() {
  const insets = useSafeAreaInsets();
  const { words, addToReview, removeFromReview } = useVocabulary();
  const { updateProgress } = useProgress();
  
  // 使用你代码中的 Key
  const SILICONFLOW_API_KEY = "sk-yyydqxkptalspyqyjfzdmhqqcecbdrbapjydsdpgrbxppbkr"; 

  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [userInput, setUserInput] = useState<string>("");
  const [isListening, setIsListening] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<"correct" | "incorrect" | null>(null);
  const [scaleAnim] = useState(new Animated.Value(1));
  
  // 录音相关状态
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  
  // Refs 用于清理和防止闭包陷阱
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const recordingRef = useRef<Audio.Recording | null>(null);

  const currentWord = words[currentIndex];

  useEffect(() => {
    if (currentWord) {
      speakDefinitions();
    }
    // 页面卸载时强制清理
    return () => {
      cleanupRecording();
    };
  }, [currentIndex]);

  // 独立的清理函数
  const cleanupRecording = async () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    
    // 无论 react state 如何，优先清理 ref 中的实例
    const recordingToUnload = recordingRef.current;
    if (recordingToUnload) {
      try {
        const status = await recordingToUnload.getStatusAsync();
        if (status.isLoaded) {
          await recordingToUnload.stopAndUnloadAsync();
        }
      } catch (error) {
        // 忽略清理时的错误，通常是因为已经卸载了
        console.log("Cleanup log:", error);
      }
      recordingRef.current = null;
    }
    
    setIsListening(false);
    setRecording(null);
  };

  const speakDefinitions = () => {
    if (!currentWord) return;
    
    const definitions = currentWord.definitions.slice(0, 3).join("，");
    const textToSpeak = `请拼读单词：${definitions}`;
    
    Speech.speak(textToSpeak, {
      language: "zh-CN",
      pitch: 1,
      rate: 0.9,
    });
  };

  const transcribeAudio = async (audioUri: string): Promise<string> => {
    const url = 'https://api.siliconflow.cn/v1/audio/transcriptions';
    
    try {
      const form = new FormData();
      form.append('model', 'FunAudioLLM/SenseVoiceSmall');

      if (Platform.OS === "web") {
        const response = await fetch(audioUri);
        const blob = await response.blob();
        form.append("file", blob, "recording.webm");
      } else {
        const uriParts = audioUri.split(".");
        const fileType = uriParts[uriParts.length - 1];
        
        let finalUri = audioUri;
        if (Platform.OS === 'android' && !finalUri.startsWith('file://')) {
            finalUri = 'file://' + finalUri;
        }

        // 简单的 MIME 类型映射
        let mimeType = "audio/webm"; // 默认 webm
        if (fileType === "wav") mimeType = "audio/wav";
        else if (fileType === "m4a") mimeType = "audio/mp4";

        const audioFile = {
          uri: finalUri,
          name: "recording." + fileType,
          type: mimeType,
        } as any;
        
        form.append("file", audioFile);
      }

      console.log("发送转录请求...");
      const response = await fetch(url, {
        method: 'POST', 
        headers: { Authorization: `Bearer ${SILICONFLOW_API_KEY}` },
        body: form
      });
      
      const responseText = await response.text();
      if (!response.ok) throw new Error(`API Error: ${responseText}`);

      const data = JSON.parse(responseText);
      if (!data.text) return "";
      return data.text.toLowerCase().trim();

    } catch (error) {
      console.error("Transcribe Error:", error);
      if (error instanceof Error) Alert.alert("识别失败", error.message);
      throw error;
    }
  };

  const handleToggleListening = async () => {
    if (!currentWord) return;

    if (isListening) {
      await handleStopListening();
    } else {
      await startRecording();
    }
  };

  const startRecording = async () => {
    try {
      if (Platform.OS === "web") {
        await startWebRecording();
      } else {
        await startNativeRecording();
      }
    } catch (error) {
      console.error("Start Error:", error);
      await cleanupRecording();
      
      // 只有非权限错误才弹窗，权限错误在 startNativeRecording 里处理了
      if (!(error as any)?.message?.includes("permissions")) {
         Alert.alert("录音启动失败", "请重试或重启 App");
      }
    }
  };

  const startNativeRecording = async () => {
    // 1. 权限检查
    let permResponse = await Audio.getPermissionsAsync();
    if (permResponse.status !== 'granted' && permResponse.canAskAgain) {
      permResponse = await Audio.requestPermissionsAsync();
    }

    if (permResponse.status !== 'granted') {
      Alert.alert(
        "无法访问麦克风",
        "请在设置中允许应用访问麦克风。",
        [
          { text: "取消", style: "cancel" },
          { text: "去设置", onPress: () => Linking.openSettings() }
        ]
      );
      return;
    }

    // 2. 彻底清理旧资源
    await cleanupRecording();

    try {
      // 3. 设置音频模式
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });

      // 4. 实例化新的 Recording 对象
      const newRecording = new Audio.Recording();

      // 5. 准备录音参数
      // 【关键修复】移除 Android 的 sampleRate 和 bitRate，让系统自动选择最佳参数
      // 这解决了 "recording not started" 的核心兼容性问题
      await newRecording.prepareToRecordAsync({
        android: {
          extension: ".webm",
          outputFormat: Audio.AndroidOutputFormat.WEBM,
          audioEncoder: Audio.AndroidAudioEncoder.VORBIS,
          // 不要手动指定 sampleRate/bitRate/numberOfChannels
          // 让 Android 底层自己决定
        },
        ios: {
          extension: ".wav",
          outputFormat: Audio.IOSOutputFormat.LINEARPCM,
          audioQuality: Audio.IOSAudioQuality.HIGH,
          sampleRate: 44100,
          numberOfChannels: 1,
          bitRate: 128000,
          linearPCMBitDepth: 16,
          linearPCMIsBigEndian: false,
          linearPCMIsFloat: false,
        },
        web: {
          mimeType: "audio/webm",
          bitsPerSecond: 128000,
        },
      });

      // 6. 启动录音
      await newRecording.startAsync();

      // 7. 更新状态
      setRecording(newRecording);
      recordingRef.current = newRecording;
      setIsListening(true);
      setUserInput("");

      // 8. 启动自动停止计时器
      timerRef.current = setTimeout(async () => {
        await stopNativeRecording(newRecording);
      }, 3000);

    } catch (err) {
      console.error("Native Start Failed:", err);
      throw err;
    }
  };

  const stopNativeRecording = async (recordingInstance: Audio.Recording) => {
    // 清除定时器
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    try {
      // 停止并卸载
      await recordingInstance.stopAndUnloadAsync();
      const uri = recordingInstance.getURI();
      
      // 状态重置
      setIsListening(false);
      setRecording(null);
      recordingRef.current = null;

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
      });

      if (uri) {
        const recognized = await transcribeAudio(uri);
        setUserInput(recognized);
        checkAnswer(recognized);
      }
    } catch (error) {
      console.error("Stop Error:", error);
      setIsListening(false);
    }
  };

  const handleStopListening = async () => {
    if (Platform.OS === "web") {
      if (mediaRecorder && mediaRecorder.state === "recording") {
        mediaRecorder.stop();
      }
    } else {
      const target = recordingRef.current || recording;
      if (target) {
        await stopNativeRecording(target);
      }
    }
  };

  // ... Web 录音保持不变 ...
  const startWebRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : "audio/mp4";
      const recorder = new MediaRecorder(stream, { mimeType });
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        const blob = new Blob(chunks, { type: mimeType });
        const url = URL.createObjectURL(blob);
        try {
          setIsListening(false);
          const recognized = await transcribeAudio(url);
          setUserInput(recognized);
          checkAnswer(recognized);
        } catch (error) {
          console.error("Web转录失败:", error);
          Alert.alert("错误", "语音识别失败");
        } finally {
          URL.revokeObjectURL(url);
        }
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsListening(true);
      setUserInput("");

      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        if (recorder.state === "recording") recorder.stop();
      }, 3000);

    } catch (error) {
      console.error("Web录音失败:", error);
      throw error;
    }
  };

  const checkAnswer = async (input: string) => {
    if (!currentWord) return;
    const normalizedInput = input.toLowerCase().trim().replace(/[^a-z]/g, "");
    const normalizedWord = currentWord.word.toLowerCase().trim().replace(/[^a-z]/g, "");
    
    const isCorrect = normalizedInput === normalizedWord;
    setFeedback(isCorrect ? "correct" : "incorrect");
    await updateProgress({ correct: isCorrect, wordId: currentWord.id });

    if (!isCorrect) {
      await addToReview(currentWord.id);
      Speech.speak(currentWord.word, { language: "en-US", pitch: 1, rate: 0.8 });
    } else {
      await removeFromReview(currentWord.id);
    }

    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 1.2, duration: 200, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();
  };

  const handleNextManually = () => {
    if (feedback === null) return;
    setFeedback(null);
    setUserInput("");
    if (currentIndex < words.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      router.back();
    }
  };

  if (!currentWord) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>没有可练习的单词</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>返回</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.progress}>{currentIndex + 1} / {words.length}</Text>
        <TouchableOpacity 
          onPress={handleNextManually}
          disabled={feedback === null}
          style={{ opacity: feedback === null ? 0.3 : 1 }}
        >
          <ChevronRight size={28} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {feedback === "incorrect" && (
          <View style={styles.correctWordContainer}>
            <Text style={styles.correctWordLabel}>正确单词：</Text>
            <Text style={styles.correctWordText}>{currentWord.word}</Text>
            <TouchableOpacity
              style={styles.pronunciationButton}
              onPress={() => {
                Speech.speak(currentWord.word, { language: "en-US", pitch: 1, rate: 0.8 });
              }}
            >
              <Volume2 size={20} color={Colors.accent} />
              <Text style={styles.pronunciationText}>播放发音</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.definitionsContainer}>
          <Text style={styles.definitionsLabel}>释义：</Text>
          {currentWord.definitions.slice(0, 3).map((def, index) => (
            <Text key={index} style={styles.definition}>• {def}</Text>
          ))}
        </View>

        <Animated.View
          style={[
            styles.micContainer,
            feedback && styles[`${feedback}Container`],
            { transform: [{ scale: scaleAnim }] },
          ]}
        >
          <TouchableOpacity
            style={[
              styles.micButton,
              isListening && styles.micButtonActive,
              feedback === "correct" && styles.correctButton,
              feedback === "incorrect" && styles.incorrectButton,
            ]}
            onPress={handleToggleListening}
            disabled={feedback !== null}
          >
            {feedback === "correct" ? (
              <Check size={48} color={Colors.background} />
            ) : feedback === "incorrect" ? (
              <X size={48} color={Colors.background} />
            ) : (
              <Mic size={48} color={Colors.background} />
            )}
          </TouchableOpacity>
          <Text style={styles.micText}>
            {isListening
              ? "正在录音 (点击停止)..." 
              : feedback === "correct"
              ? "正确！"
              : feedback === "incorrect"
              ? "答案错误"
              : "开始拼读"}
          </Text>
        </Animated.View>

        {userInput ? (
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>您的拼读：</Text>
            <Text style={styles.inputText}>{userInput}</Text>
            {feedback === "incorrect" && (
              <>
                <Text style={styles.correctLabel}>正确答案：</Text>
                <Text style={styles.correctText}>{currentWord.word}</Text>
              </>
            )}
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  progress: {
    fontSize: 18,
    fontWeight: "600" as const,
    color: Colors.primary,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  correctWordContainer: {
    backgroundColor: Colors.card,
    padding: 24,
    borderRadius: 20,
    alignItems: "center",
    marginBottom: 32,
    width: "100%",
    borderWidth: 2,
    borderColor: Colors.error,
  },
  correctWordLabel: {
    fontSize: 14,
    color: Colors.textLight,
    marginBottom: 8,
  },
  correctWordText: {
    fontSize: 32,
    fontWeight: "bold" as const,
    color: Colors.error,
    marginBottom: 16,
    letterSpacing: 2,
  },
  pronunciationButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.accent + "22",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 8,
  },
  pronunciationText: {
    fontSize: 14,
    color: Colors.accent,
    fontWeight: "600" as const,
  },
  definitionsContainer: {
    backgroundColor: Colors.card,
    padding: 24,
    borderRadius: 20,
    width: "100%",
    marginBottom: 48,
  },
  definitionsLabel: {
    fontSize: 16,
    fontWeight: "bold" as const,
    color: Colors.text,
    marginBottom: 12,
  },
  definition: {
    fontSize: 18,
    color: Colors.text,
    marginBottom: 8,
    lineHeight: 26,
  },
  micContainer: {
    alignItems: "center",
    marginBottom: 32,
  },
  correctContainer: {
    backgroundColor: Colors.success + "11",
    borderRadius: 100,
    padding: 20,
  },
  incorrectContainer: {
    backgroundColor: Colors.error + "11",
    borderRadius: 100,
    padding: 20,
  },
  micButton: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  micButtonActive: {
    backgroundColor: Colors.accent,
  },
  correctButton: {
    backgroundColor: Colors.success,
  },
  incorrectButton: {
    backgroundColor: Colors.error,
  },
  micText: {
    fontSize: 18,
    fontWeight: "600" as const,
    color: Colors.primary,
    marginTop: 16,
  },
  inputContainer: {
    backgroundColor: Colors.card,
    padding: 20,
    borderRadius: 16,
    width: "100%",
  },
  inputLabel: {
    fontSize: 14,
    color: Colors.textLight,
    marginBottom: 8,
  },
  inputText: {
    fontSize: 24,
    fontWeight: "bold" as const,
    color: Colors.primary,
    marginBottom: 16,
  },
  correctLabel: {
    fontSize: 14,
    color: Colors.textLight,
    marginBottom: 8,
  },
  correctText: {
    fontSize: 24,
    fontWeight: "bold" as const,
    color: Colors.success,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    fontSize: 18,
    color: Colors.textLight,
    marginBottom: 24,
  },
  backButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
  },
  backButtonText: {
    color: Colors.background,
    fontSize: 16,
    fontWeight: "600" as const,
  },
});