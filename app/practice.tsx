import Colors from "@/constants/colors";
import { useProgress } from "@/contexts/ProgressContext";
import { useVocabulary } from "@/contexts/VocabularyContext";
import { Audio } from "expo-av";
import { router } from "expo-router";
import * as Speech from "expo-speech";
import { Check, ChevronRight, Mic, Volume2, X } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
    Alert,
    Animated,
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
  
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [userInput, setUserInput] = useState<string>("");
  const [isListening, setIsListening] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<"correct" | "incorrect" | null>(null);
  const [scaleAnim] = useState(new Animated.Value(1));
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);

  const currentWord = words[currentIndex];

  useEffect(() => {
    if (currentWord) {
      speakDefinitions();
    }
  }, [currentIndex]);

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
    try {
      const formData = new FormData();
      
      if (Platform.OS === "web") {
        const response = await fetch(audioUri);
        const blob = await response.blob();
        formData.append("audio", blob, "recording.webm");
      } else {
        const uriParts = audioUri.split(".");
        const fileType = uriParts[uriParts.length - 1];
        
        const audioFile = {
          uri: audioUri,
          name: "recording." + fileType,
          type: "audio/" + fileType,
        } as any;
        
        formData.append("audio", audioFile);
      }
      
      const response = await fetch("https://toolkit.rork.com/stt/transcribe/", {
        method: "POST",
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error("转录失败");
      }
      
      const data = await response.json();
      return data.text.toLowerCase().trim();
    } catch (error) {
      console.error("转录错误:", error);
      throw error;
    }
  };

  const handleStartListening = async () => {
    if (!currentWord) return;
    
    try {
      if (Platform.OS === "web") {
        await startWebRecording();
      } else {
        await startNativeRecording();
      }
    } catch (error) {
      console.error("开始录音失败:", error);
      Alert.alert("错误", "无法开始录音，请检查麦克风权限");
      setIsListening(false);
    }
  };

  const startNativeRecording = async () => {
    try {
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording: newRecording } = await Audio.Recording.createAsync({
        android: {
          extension: ".m4a",
          outputFormat: Audio.AndroidOutputFormat.MPEG_4,
          audioEncoder: Audio.AndroidAudioEncoder.AAC,
          sampleRate: 44100,
          numberOfChannels: 2,
          bitRate: 128000,
        },
        ios: {
          extension: ".wav",
          outputFormat: Audio.IOSOutputFormat.LINEARPCM,
          audioQuality: Audio.IOSAudioQuality.HIGH,
          sampleRate: 44100,
          numberOfChannels: 2,
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

      setRecording(newRecording);
      setIsListening(true);
      setUserInput("");

      setTimeout(async () => {
        await stopNativeRecording(newRecording);
      }, 3000);
    } catch (error) {
      console.error("Native录音失败:", error);
      throw error;
    }
  };

  const stopNativeRecording = async (recordingInstance: Audio.Recording) => {
    try {
      await recordingInstance.stopAndUnloadAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
      });

      const uri = recordingInstance.getURI();
      if (!uri) {
        throw new Error("录音URI为空");
      }

      const recognized = await transcribeAudio(uri);
      setUserInput(recognized);
      setIsListening(false);
      checkAnswer(recognized);
    } catch (error) {
      console.error("停止录音失败:", error);
      Alert.alert("错误", "语音识别失败，请重试");
      setIsListening(false);
    } finally {
      setRecording(null);
    }
  };

  const startWebRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : "audio/mp4";
      const recorder = new MediaRecorder(stream, { mimeType });
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        
        const blob = new Blob(chunks, { type: mimeType });
        const url = URL.createObjectURL(blob);
        
        try {
          const recognized = await transcribeAudio(url);
          setUserInput(recognized);
          setIsListening(false);
          checkAnswer(recognized);
        } catch (error) {
          console.error("Web转录失败:", error);
          Alert.alert("错误", "语音识别失败，请重试");
          setIsListening(false);
        } finally {
          URL.revokeObjectURL(url);
        }
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsListening(true);
      setUserInput("");

      setTimeout(() => {
        if (recorder.state === "recording") {
          recorder.stop();
        }
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

    await updateProgress({
      correct: isCorrect,
      wordId: currentWord.id,
    });

    if (!isCorrect) {
      await addToReview(currentWord.id);
      Speech.speak(currentWord.word, {
        language: "en-US",
        pitch: 1,
        rate: 0.8,
      });
    } else {
      await removeFromReview(currentWord.id);
    }

    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 1.2,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleNext = () => {
    setFeedback(null);
    setUserInput("");
    
    if (currentIndex < words.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      router.back();
    }
  };

  const handleNextManually = () => {
    if (feedback === null) return;
    setFeedback(null);
    setUserInput("");
    handleNext();
  };

  if (!currentWord) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>没有可练习的单词</Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>返回</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.progress}>
          {currentIndex + 1} / {words.length}
        </Text>
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
                Speech.speak(currentWord.word, {
                  language: "en-US",
                  pitch: 1,
                  rate: 0.8,
                });
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
            <Text key={index} style={styles.definition}>
              • {def}
            </Text>
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
            onPress={handleStartListening}
            disabled={isListening || feedback !== null}
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
              ? "正在识别..."
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
