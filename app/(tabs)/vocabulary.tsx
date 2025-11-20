import Colors from "@/constants/colors";
import { useVocabulary } from "@/contexts/VocabularyContext";
import { Word } from "@/types";
import * as DocumentPicker from "expo-document-picker";
import { Stack } from "expo-router";
import {
    FileText,
    Plus,
    Trash2,
    Upload,
} from "lucide-react-native";
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

export default function VocabularyScreen() {
  const insets = useSafeAreaInsets();
  const { words, deleteWord, addWords } = useVocabulary();

  const handleImportCSV = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "text/comma-separated-values",
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        return;
      }

      const file = result.assets[0];
      const response = await fetch(file.uri);
      const text = await response.text();
      
      const lines = text.split("\n").filter((line) => line.trim());
      const newWords: Word[] = [];

      for (let i = 1; i < lines.length; i++) {
        const parts = lines[i].split(",");
        if (parts.length >= 2) {
          const word = parts[0].trim();
          const definitions = parts.slice(1).map((def) => def.trim()).filter(Boolean);
          
          if (word && definitions.length > 0) {
            newWords.push({
              id: Date.now().toString() + i,
              word,
              definitions,
              category: "导入",
              addedAt: new Date().toISOString(),
            });
          }
        }
      }

      if (newWords.length > 0) {
        await addWords(newWords);
        Alert.alert("成功", `已导入 ${newWords.length} 个单词`);
      } else {
        Alert.alert("错误", "CSV 文件格式不正确");
      }
    } catch (error) {
      console.error("Import CSV error:", error);
      Alert.alert("错误", "导入失败，请检查文件格式");
    }
  };

  const handleDeleteWord = (wordId: string) => {
    Alert.alert("删除单词", "确定要删除这个单词吗？", [
      { text: "取消", style: "cancel" },
      {
        text: "删除",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteWord(wordId);
          } catch (error) {
            console.error("Delete word error:", error);
            Alert.alert("错误", "删除失败");
          }
        },
      },
    ]);
  };

  const categories = Array.from(new Set(words.map((w: Word) => w.category)));

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Stack.Screen options={{ headerShown: false }} />
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>词库管理</Text>
        <TouchableOpacity style={styles.importButton} onPress={handleImportCSV}>
          <Upload size={20} color={Colors.background} />
          <Text style={styles.importButtonText}>导入CSV</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statBox}>
          <FileText size={24} color={Colors.primary} />
          <Text style={styles.statValue}>{words.length}</Text>
          <Text style={styles.statLabel}>总单词</Text>
        </View>
        <View style={styles.statBox}>
          <Plus size={24} color={Colors.accent} />
          <Text style={styles.statValue}>{categories.length}</Text>
          <Text style={styles.statLabel}>分类</Text>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {categories.map((category) => {
          const categoryWords = words.filter((w: Word) => w.category === category);
          
          return (
            <View key={category} style={styles.categorySection}>
              <Text style={styles.categoryTitle}>{category}</Text>
              {categoryWords.map((word: Word) => (
                <View key={word.id} style={styles.wordCard}>
                  <View style={styles.wordContent}>
                    <Text style={styles.wordText}>{word.word}</Text>
                    <Text style={styles.definitionsText}>
                      {word.definitions.slice(0, 3).join("；")}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => handleDeleteWord(word.id)}
                  >
                    <Trash2 size={20} color={Colors.error} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          );
        })}
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
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold" as const,
    color: Colors.text,
  },
  importButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 8,
  },
  importButtonText: {
    color: Colors.background,
    fontSize: 14,
    fontWeight: "600" as const,
  },
  statsContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    marginBottom: 20,
    gap: 12,
  },
  statBox: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
  },
  statValue: {
    fontSize: 28,
    fontWeight: "bold" as const,
    color: Colors.primary,
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: Colors.textLight,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  categorySection: {
    marginBottom: 24,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: "bold" as const,
    color: Colors.text,
    marginBottom: 12,
  },
  wordCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  wordContent: {
    flex: 1,
  },
  wordText: {
    fontSize: 18,
    fontWeight: "600" as const,
    color: Colors.primary,
    marginBottom: 4,
  },
  definitionsText: {
    fontSize: 14,
    color: Colors.textLight,
  },
  deleteButton: {
    padding: 8,
  },
});
