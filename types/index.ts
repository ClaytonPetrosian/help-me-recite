export interface User {
  id: string;
  username: string;
  password: string;
  createdAt: string;
}

export interface Word {
  id: string;
  word: string;
  definitions: string[];
  category: string;
  addedAt: string;
}

export interface Progress {
  userId: string;
  date: string;
  wordsReviewed: number;
  wordsCorrect: number;
  dailyGoal: number;
}

export interface PracticeSession {
  wordId: string;
  correct: boolean;
  timestamp: string;
}

export interface VocabularyList {
  id: string;
  name: string;
  category: string;
  words: Word[];
  createdAt: string;
}
