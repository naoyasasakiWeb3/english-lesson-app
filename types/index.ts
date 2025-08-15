export interface LearningGoals {
  dailyStudyTimeMinutes: number; // 1-120分
  dailyWordCount: number; // 5-100単語
  reminderTime?: string; // 通知時間
  learningDays: boolean[]; // 週7日の学習曜日
}

export interface QuizQuestion {
  id: string;
  word: string;
  correctAnswer: string;
  options: string[]; // 4択
  pronunciation?: string; // 音声URL
  difficulty: number;
  category?: string;
  definition?: string;
  example?: string;
  questionType?: 'definition' | 'synonym' | 'antonym' | 'example';
  cefrLevel?: string; // CEFRレベル情報（A1, A2, B1等）
}

export interface WordData {
  word: string;
  meanings: {
    partOfSpeech: string;
    definition: string;
    example?: string;
  }[];
  pronunciation: {
    phonetic: string;
    audio?: string;
  };
  synonyms: string[];
  antonyms: string[];
  etymology?: string;
}

export interface LearningRecord {
  wordId: string;
  attempts: {
    timestamp: Date;
    isCorrect: boolean;
    responseTime: number;
  }[];
  masteryLevel: number; // 0-100
  isBookmarked: boolean;
  isWeak: boolean; // 不正解が多い単語
  lastReviewDate: Date;
  nextReviewDate: Date;
}

export interface DashboardData {
  todayStats: {
    studyTime: number;
    wordsStudied: number;
    accuracy: number;
    streak: number;
  };
  weeklyProgress: {
    days: Date[];
    studyTimes: number[];
    accuracies: number[];
  };
  overallStats: {
    totalWordsLearned: number;
    masteredWords: number;
    currentStreak: number;
    longestStreak: number;
  };
  levelProgress: {
    currentLevel: number;
    currentXP: number;
    requiredXP: number;
  };
}

export interface AudioFeatures {
  textToSpeech: (text: string, accent: 'us' | 'uk') => Promise<void>;
  playPronunciation: (audioUrl: string) => Promise<void>;
  downloadAudio: (word: string) => Promise<string>; // キャッシュ
}

export interface StudySession {
  id: string;
  date: Date;
  durationMinutes: number;
  wordsStudied: number;
  correctAnswers: number;
  totalQuestions: number;
}

export interface AppStore {
  // ユーザー設定
  userSettings: LearningGoals;
  setUserSettings: (settings: LearningGoals) => void;
  
  // 学習データ
  currentSession: {
    questions: QuizQuestion[];
    currentIndex: number;
    answers: boolean[];
    startTime: Date;
  };
  
  // 進捗データ
  progress: {
    todayStats: DashboardData['todayStats'];
    weeklyData: DashboardData['weeklyProgress'];
    level: number;
    xp: number;
  };
  
  // アクション
  startQuiz: (mode: 'random' | 'review') => void;
  submitAnswer: (questionId: string, answer: string) => void;
  bookmarkWord: (wordId: string) => void;
  updateProgress: () => void;
}

export interface Word {
  id: number;
  word: string;
  definition: string;
  pronunciation: string;
  difficulty: number;
  category: string;
  createdAt: Date;
}

export interface UserProgress {
  id: number;
  wordId: number;
  attempts: number;
  correctAttempts: number;
  lastAttemptDate: Date;
  masteryLevel: number;
  isBookmarked: boolean;
}

export type QuizMode = 'random' | 'review' | 'bookmarked' | 'weak';

export type WordCategory = 'general' | 'business' | 'travel' | 'academic' | 'technology';