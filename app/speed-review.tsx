import Colors from "@/constants/colors";
import { useVocabulary } from "@/contexts/VocabularyContext";
import { Word } from "@/types";
import { router } from "expo-router";
import * as Speech from "expo-speech";
import { Eye, EyeOff, Pause, Play, SkipForward, Volume2 } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
    Animated,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function SpeedReviewScreen() {
  const insets = useSafeAreaInsets();
  const { words } = useVocabulary();
  
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [showDefinitions, setShowDefinitions] = useState<boolean>(false);
  const [fadeAnim] = useState(new Animated.Value(0));

  const currentWord = words[currentIndex];

  useEffect(() => {
    if (currentWord) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [currentIndex]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isPlaying && currentWord) {
      speakWord(currentWord);
      
      interval = setInterval(() => {
        if (currentIndex < words.length - 1) {
          setCurrentIndex((prev) => prev + 1);
          setShowDefinitions(false);
        } else {
          setIsPlaying(false);
          setCurrentIndex(0);
        }
      }, 4000);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isPlaying, currentIndex, words.length]);

  const speakWord = (word: Word) => {
    Speech.speak(word.word, {
      language: "en-US",
      pitch: 1,
      rate: 0.8,
    });
  };

  const handlePlayPause = () => {
    if (isPlaying) {
      Speech.stop();
    }
    setIsPlaying(!isPlaying);
  };

  const handleNext = () => {
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();

    if (currentIndex < words.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setShowDefinitions(false);
      if (words[currentIndex + 1]) {
        speakWord(words[currentIndex + 1]);
      }
    } else {
      setCurrentIndex(0);
      setShowDefinitions(false);
      setIsPlaying(false);
    }
  };

  const handleSpeak = () => {
    if (currentWord) {
      speakWord(currentWord);
    }
  };

  const toggleDefinitions = () => {
    setShowDefinitions(!showDefinitions);
  };

  if (!currentWord) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>没有可复习的单词</Text>
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
        <View style={styles.headerButtons}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={handlePlayPause}
          >
            {isPlaying ? (
              <Pause size={24} color={Colors.primary} />
            ) : (
              <Play size={24} color={Colors.primary} />
            )}
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={[styles.wordCard, { opacity: fadeAnim }]}>
          <View style={styles.wordHeader}>
            <TouchableOpacity
              style={styles.speakButton}
              onPress={handleSpeak}
            >
              <Volume2 size={32} color={Colors.primary} />
            </TouchableOpacity>
          </View>

          <Text style={styles.wordText}>{currentWord.word}</Text>
          
          <TouchableOpacity
            style={styles.toggleButton}
            onPress={toggleDefinitions}
          >
            {showDefinitions ? (
              <EyeOff size={20} color={Colors.textLight} />
            ) : (
              <Eye size={20} color={Colors.textLight} />
            )}
            <Text style={styles.toggleText}>
              {showDefinitions ? "隐藏" : "显示"}释义
            </Text>
          </TouchableOpacity>

          {showDefinitions && (
            <View style={styles.definitionsContainer}>
              {currentWord.definitions.map((def, index) => (
                <Text key={index} style={styles.definition}>
                  • {def}
                </Text>
              ))}
              <Text style={styles.category}>分类：{currentWord.category}</Text>
            </View>
          )}
        </Animated.View>

        <TouchableOpacity
          style={styles.nextButton}
          onPress={handleNext}
        >
          <SkipForward size={24} color={Colors.background} />
          <Text style={styles.nextButtonText}>下一个</Text>
        </TouchableOpacity>

        <View style={styles.tips}>
          <Text style={styles.tipsTitle}>提示</Text>
          <Text style={styles.tipsText}>
            • 点击播放按钮开启自动播放模式
          </Text>
          <Text style={styles.tipsText}>
            • 点击喇叭图标重新播放发音
          </Text>
          <Text style={styles.tipsText}>
            • 点击眼睛图标显示/隐藏释义
          </Text>
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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  progress: {
    fontSize: 18,
    fontWeight: "600" as const,
    color: Colors.primary,
  },
  headerButtons: {
    flexDirection: "row",
    gap: 12,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.card,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  wordCard: {
    backgroundColor: Colors.card,
    borderRadius: 24,
    padding: 32,
    marginBottom: 24,
    alignItems: "center",
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  wordHeader: {
    width: "100%",
    alignItems: "center",
    marginBottom: 24,
  },
  speakButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.background,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  wordText: {
    fontSize: 48,
    fontWeight: "bold" as const,
    color: Colors.primary,
    marginBottom: 24,
    textAlign: "center",
  },
  toggleButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: Colors.background,
    gap: 8,
  },
  toggleText: {
    fontSize: 14,
    color: Colors.textLight,
    fontWeight: "600" as const,
  },
  definitionsContainer: {
    marginTop: 24,
    width: "100%",
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  definition: {
    fontSize: 18,
    color: Colors.text,
    marginBottom: 12,
    lineHeight: 26,
  },
  category: {
    fontSize: 14,
    color: Colors.textLight,
    marginTop: 12,
    fontStyle: "italic" as const,
  },
  nextButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.primary,
    paddingVertical: 18,
    borderRadius: 16,
    marginBottom: 24,
    gap: 12,
  },
  nextButtonText: {
    color: Colors.background,
    fontSize: 18,
    fontWeight: "600" as const,
  },
  tips: {
    backgroundColor: Colors.card,
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: "bold" as const,
    color: Colors.primary,
    marginBottom: 12,
  },
  tipsText: {
    fontSize: 14,
    color: Colors.textLight,
    marginBottom: 8,
    lineHeight: 20,
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
