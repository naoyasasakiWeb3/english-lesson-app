import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { databaseService } from '../services/database';
import { DashboardData, LearningGoals, QuizQuestion, Word } from '../types';

interface CurrentSession {
  questions: QuizQuestion[];
  currentIndex: number;
  answers: boolean[];
  startTime: Date;
  mode: 'random' | 'review' | 'bookmarked' | 'weak';
}

interface AppStore {
  // ユーザー設定
  userSettings: LearningGoals;
  setUserSettings: (settings: LearningGoals) => void;
  
  // 学習データ
  currentSession: CurrentSession | null;
  
  // 進捗データ
  progress: {
    todayStats: DashboardData['todayStats'];
    weeklyData: DashboardData['weeklyProgress'];
    level: number;
    xp: number;
  };
  
  // アクション
  startQuiz: (mode: 'random' | 'review' | 'bookmarked' | 'weak', wordCount?: number) => Promise<void>;
  submitAnswer: (questionId: string, answer: string) => Promise<void>;
  nextQuestion: () => void;
  previousQuestion: () => void;
  finishSession: () => Promise<void>;
  bookmarkWord: (wordId: number) => Promise<void>;
  updateProgress: () => Promise<void>;
  
  // 初期化
  initialize: () => Promise<void>;
  
  // UI状態
  isLoading: boolean;
  setLoading: (loading: boolean) => void;
}

const defaultSettings: LearningGoals = {
  dailyStudyTimeMinutes: 15,
  dailyWordCount: 20,
  difficultyLevel: 'beginner',
  reminderTime: '09:00',
  learningDays: [true, true, true, true, true, true, false] // 月-土
};

const defaultProgress = {
  todayStats: {
    studyTime: 0,
    wordsStudied: 0,
    accuracy: 0,
    streak: 0
  },
  weeklyData: {
    days: Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      return date;
    }),
    studyTimes: Array(7).fill(0),
    accuracies: Array(7).fill(0)
  },
  level: 1,
  xp: 0
};

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      // 初期状態
      userSettings: defaultSettings,
      currentSession: null,
      progress: defaultProgress,
      isLoading: false,

      // ユーザー設定の更新
      setUserSettings: (settings: LearningGoals) => {
        set({ userSettings: settings });
      },

      // ローディング状態の設定
      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },

      // 初期化
      initialize: async () => {
        set({ isLoading: true });
        try {
          await databaseService.init();
          const updateProgress = get().updateProgress;
          await updateProgress();
        } catch (error) {
          console.error('App initialization error:', error);
        } finally {
          set({ isLoading: false });
        }
      },

      // クイズ開始
      startQuiz: async (mode: 'random' | 'review' | 'bookmarked' | 'weak', wordCount?: number) => {
        set({ isLoading: true });
        try {
          const { userSettings } = get();
          const count = wordCount || userSettings.dailyWordCount;
          let words: Word[] = [];

          switch (mode) {
            case 'random':
              const difficultyMap = { beginner: 1, intermediate: 2, advanced: 3 };
              words = await databaseService.getWordsByDifficulty(difficultyMap[userSettings.difficultyLevel]);
              break;
            case 'review':
              words = await databaseService.getWeakWords();
              break;
            case 'bookmarked':
              words = await databaseService.getBookmarkedWords();
              break;
            case 'weak':
              words = await databaseService.getWeakWords();
              break;
          }

          if (words.length === 0) {
            words = await databaseService.getRandomWords(count);
          }

          // クイズ問題を生成
          const questions: QuizQuestion[] = await Promise.all(
            words.slice(0, count).map(async (word, index) => {
              const otherWords = await databaseService.getRandomWords(10);
              const wrongAnswers = otherWords
                .filter(w => w.id !== word.id)
                .slice(0, 3)
                .map(w => w.definition);

              const options = [word.definition, ...wrongAnswers].sort(() => Math.random() - 0.5);

              return {
                id: `${word.id}-${index}`,
                word: word.word,
                correctAnswer: word.definition,
                options,
                pronunciation: word.pronunciation,
                difficulty: word.difficulty,
                category: word.category
              };
            })
          );

          set({
            currentSession: {
              questions,
              currentIndex: 0,
              answers: [],
              startTime: new Date(),
              mode
            }
          });
        } catch (error) {
          console.error('Start quiz error:', error);
        } finally {
          set({ isLoading: false });
        }
      },

      // 回答送信
      submitAnswer: async (questionId: string, answer: string) => {
        const { currentSession } = get();
        if (!currentSession) return;

        const currentQuestion = currentSession.questions[currentSession.currentIndex];
        const isCorrect = answer === currentQuestion.correctAnswer;
        
        // データベースに進捗を保存
        const wordId = parseInt(questionId.split('-')[0]);
        await databaseService.updateUserProgress(wordId, isCorrect);

        // セッションの回答を更新
        const newAnswers = [...currentSession.answers];
        newAnswers[currentSession.currentIndex] = isCorrect;

        set({
          currentSession: {
            ...currentSession,
            answers: newAnswers
          }
        });
      },

      // 次の問題へ
      nextQuestion: () => {
        const { currentSession } = get();
        if (!currentSession) return;

        if (currentSession.currentIndex < currentSession.questions.length - 1) {
          set({
            currentSession: {
              ...currentSession,
              currentIndex: currentSession.currentIndex + 1
            }
          });
        }
      },

      // 前の問題に戻る
      previousQuestion: () => {
        const { currentSession } = get();
        if (!currentSession) return;

        if (currentSession.currentIndex > 0) {
          set({
            currentSession: {
              ...currentSession,
              currentIndex: currentSession.currentIndex - 1
            }
          });
        }
      },

      // セッション終了
      finishSession: async () => {
        const { currentSession } = get();
        if (!currentSession) return;

        const endTime = new Date();
        const durationMinutes = Math.round((endTime.getTime() - currentSession.startTime.getTime()) / 60000);
        const correctAnswers = currentSession.answers.filter(Boolean).length;
        const totalQuestions = currentSession.questions.length;
        const wordsStudied = currentSession.questions.length;

        // セッションをデータベースに保存
        await databaseService.saveStudySession({
          date: new Date(),
          durationMinutes,
          wordsStudied,
          correctAnswers,
          totalQuestions
        });

        // XP計算とレベルアップ
        const { progress } = get();
        const earnedXP = correctAnswers * 10 + (totalQuestions - correctAnswers) * 5;
        const newXP = progress.xp + earnedXP;
        const newLevel = Math.floor(newXP / 100) + 1;

        set({
          currentSession: null,
          progress: {
            ...progress,
            xp: newXP,
            level: newLevel
          }
        });

        // 進捗を更新
        await get().updateProgress();
      },

      // 単語ブックマーク
      bookmarkWord: async (wordId: number) => {
        try {
          await databaseService.toggleBookmark(wordId);
        } catch (error) {
          console.error('Bookmark word error:', error);
        }
      },

      // 進捗更新
      updateProgress: async () => {
        try {
          const todayStats = await databaseService.getTodayStats();
          
          // 週間データの取得
          const endDate = new Date();
          const startDate = new Date();
          startDate.setDate(endDate.getDate() - 6);
          
          const sessions = await databaseService.getStudySessionsByDate(startDate, endDate);
          
          const weeklyData = {
            days: Array.from({ length: 7 }, (_, i) => {
              const date = new Date();
              date.setDate(endDate.getDate() - (6 - i));
              return date;
            }),
            studyTimes: Array(7).fill(0),
            accuracies: Array(7).fill(0)
          };

          sessions.forEach(session => {
            const dayIndex = Math.floor((session.date.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000));
            if (dayIndex >= 0 && dayIndex < 7) {
              weeklyData.studyTimes[dayIndex] += session.durationMinutes;
              weeklyData.accuracies[dayIndex] = session.totalQuestions > 0 
                ? Math.round((session.correctAnswers / session.totalQuestions) * 100)
                : 0;
            }
          });

          // ストリーク計算（簡単な実装）
          const streak = todayStats.wordsStudied > 0 ? 1 : 0; // 実際はより複雑な計算が必要

          set({
            progress: {
              ...get().progress,
              todayStats: {
                ...todayStats,
                streak
              },
              weeklyData
            }
          });
        } catch (error) {
          console.error('Update progress error:', error);
        }
      }
    }),
    {
      name: 'vocabmaster-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        userSettings: state.userSettings,
        progress: state.progress
      })
    }
  )
);