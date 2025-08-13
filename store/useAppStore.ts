import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { cefrQuizService } from '../services/cefrQuizService';
import { databaseService } from '../services/database';
import { enrichedQuizService } from '../services/enrichedQuizService'; // Added import
import { enrichedVocabularyService } from '../services/enrichedVocabularyService'; // Added import
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
  cancelQuiz: () => void; // クイズキャンセル機能を追加
  bookmarkWord: (wordId: number) => Promise<void>;
  bookmarkEnrichedWord: (word: string, cefrLevel: string) => Promise<void>;
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

// Helper functions
const mapCefrToLegacyDifficulty = (cefrLevel: string): number => {
  switch (cefrLevel) {
    case 'A1':
    case 'A2':
      return 1;
    case 'B1':
    case 'B2':
      return 2;
    case 'C1':
    case 'C2':
      return 3;
    default:
      return 2;
  }
};

const mapDifficultyToCefr = (difficulty: number): string => {
  switch (difficulty) {
    case 1:
      return 'A1';
    case 2:
      return 'A2';
    case 3:
      return 'B1';
    case 4:
      return 'B2';
    case 5:
      return 'C1';
    case 6:
      return 'C2';
    default:
      return 'A2'; // Default for unknown difficulty
  }
};

const shuffleArray = <T>(array: T[]): T[] => {
  const shuffledArray = [...array];
  for (let i = shuffledArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffledArray[i], shuffledArray[j]] = [shuffledArray[j], shuffledArray[i]];
  }
  return shuffledArray;
};

const generateQuestionsFromLegacyWords = async (words: Word[], count: number): Promise<QuizQuestion[]> => {
  const questions: QuizQuestion[] = [];
  const wordsToUse = words.slice(0, count);
  
  for (let i = 0; i < wordsToUse.length; i++) {
    const word = wordsToUse[i];
    const otherWords = await databaseService.getRandomWords(10);
    const wrongAnswers = otherWords
      .filter(w => w.id !== word.id)
      .slice(0, 3)
      .map(w => w.definition);

    const options = [word.definition, ...wrongAnswers].sort(() => Math.random() - 0.5);

    questions.push({
      id: `${word.id}-${i}`,
      word: word.word,
      correctAnswer: word.definition,
      options,
      pronunciation: word.pronunciation,
      difficulty: word.difficulty,
      category: word.category,
      definition: word.definition,
      questionType: 'definition'
    });
  }
  
  return questions;
};

const generateQuestionsFromEnrichedWords = async (
  enrichedWords: {word: string; cefr_level: string}[], 
  count: number
): Promise<QuizQuestion[]> => {
  const questions: QuizQuestion[] = [];
  
  // enriched vocabulary serviceから詳細データを取得
  for (let i = 0; i < Math.min(count, enrichedWords.length); i++) {
    const enrichedWord = enrichedWords[i];
    
    try {
      // enriched vocabulary dataから詳細情報を取得
      const vocabularyData = await enrichedVocabularyService.getEnrichedVocabulary(enrichedWord.cefr_level);
      const wordData = vocabularyData.vocabulary.find(w => w.word === enrichedWord.word);
      
      if (wordData && wordData.apiData?.definitions && wordData.apiData.definitions.length > 0) {
        const definition = wordData.apiData.definitions[0].definition;
        
        // 他の単語から不正解選択肢を作成
        const otherWords = vocabularyData.vocabulary
          .filter(w => w.word !== enrichedWord.word && w.apiData?.definitions && w.apiData.definitions.length > 0)
          .slice(0, 10);
        
        const wrongAnswers = shuffleArray(otherWords)
          .slice(0, 3)
          .map(w => w.apiData!.definitions![0].definition);
        
        const options = shuffleArray([definition, ...wrongAnswers]);
        
        questions.push({
          id: `enriched-${i}`,
          word: wordData.word,
          correctAnswer: definition,
          options,
          pronunciation: wordData.apiData?.pronunciation?.all,
          difficulty: mapCefrToLegacyDifficulty(wordData.cefr),
          category: wordData.pos,
          definition: definition,
          questionType: 'definition'
        });
      }
    } catch (error) {
      console.error(`Error generating question for enriched word ${enrichedWord.word}:`, error);
    }
  }
  
  return questions;
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
          // randomモードでは固定で10問、他のモードでは設定された値を使用
          const count = mode === 'random' ? 10 : (wordCount || userSettings.dailyWordCount);
          let questions: QuizQuestion[] = [];

          switch (mode) {
            case 'random':
              console.log('Starting quiz with enriched vocabulary system...');
              try {
                const userLevel = await databaseService.getUserCefrLevel();
                const enrichedQuestions = await enrichedQuizService.createEnrichedCefrQuiz(userLevel.current_level, count);
                
                // Convert enriched questions to our QuizQuestion format
                questions = enrichedQuestions.map((cefrQ, index) => ({
                  id: `${cefrQ.word.id}-${index}`,
                  word: cefrQ.word.word,
                  correctAnswer: cefrQ.correctAnswer,
                  options: cefrQ.options,
                  pronunciation: cefrQ.word.pronunciation,
                  difficulty: mapCefrToLegacyDifficulty(cefrQ.word.cefr_level),
                  category: cefrQ.word.pos || 'general',
                  definition: cefrQ.word.definition,
                  example: cefrQ.word.example_sentence,
                  questionType: cefrQ.type,
                  cefrLevel: cefrQ.word.cefr_level // CEFRレベル情報を追加
                }));
                
                console.log(`Successfully created ${questions.length} questions with enriched vocabulary`);
              } catch (enrichedError) {
                console.error('Enriched vocabulary system failed:', enrichedError);
                throw new Error(`Enriched vocabulary system is required but failed: ${enrichedError}`);
              }
              break;
            case 'review':
              // Legacy weak words + enriched weak words
              const legacyWeakWords = await databaseService.getWeakWords();
              const enrichedWeakWords = await databaseService.getEnrichedWeakWords();
              
              let reviewQuestions: QuizQuestion[] = [];
              
              // Legacy weak wordsからクイズを生成
              if (legacyWeakWords.length > 0) {
                const legacyQuestions = await generateQuestionsFromLegacyWords(legacyWeakWords, Math.ceil(count / 2));
                reviewQuestions = [...reviewQuestions, ...legacyQuestions];
              }
              
              // Enriched weak wordsからクイズを生成
              if (enrichedWeakWords.length > 0) {
                const enrichedQuestions = await generateQuestionsFromEnrichedWords(enrichedWeakWords, Math.ceil(count / 2));
                reviewQuestions = [...reviewQuestions, ...enrichedQuestions];
              }
              
              questions = shuffleArray(reviewQuestions).slice(0, count);
              break;
              
            case 'bookmarked':
              // Legacy bookmarked words + enriched bookmarked words
              const legacyBookmarkedWords = await databaseService.getBookmarkedWords();
              const enrichedBookmarkedWords = await databaseService.getEnrichedBookmarkedWords();
              
              let bookmarkedQuestions: QuizQuestion[] = [];
              
              // Legacy bookmarked wordsからクイズを生成
              if (legacyBookmarkedWords.length > 0) {
                const legacyQuestions = await generateQuestionsFromLegacyWords(legacyBookmarkedWords, Math.ceil(count / 2));
                bookmarkedQuestions = [...bookmarkedQuestions, ...legacyQuestions];
              }
              
              // Enriched bookmarked wordsからクイズを生成
              if (enrichedBookmarkedWords.length > 0) {
                const enrichedQuestions = await generateQuestionsFromEnrichedWords(enrichedBookmarkedWords, Math.ceil(count / 2));
                bookmarkedQuestions = [...bookmarkedQuestions, ...enrichedQuestions];
              }
              
              questions = shuffleArray(bookmarkedQuestions).slice(0, count);
              break;
              
            case 'weak':
              // Same as review - challenging words
              const legacyWeakWordsAgain = await databaseService.getWeakWords();
              const enrichedWeakWordsAgain = await databaseService.getEnrichedWeakWords();
              
              let weakQuestions: QuizQuestion[] = [];
              
              // Legacy weak wordsからクイズを生成
              if (legacyWeakWordsAgain.length > 0) {
                const legacyQuestions = await generateQuestionsFromLegacyWords(legacyWeakWordsAgain, Math.ceil(count / 2));
                weakQuestions = [...weakQuestions, ...legacyQuestions];
              }
              
              // Enriched weak wordsからクイズを生成
              if (enrichedWeakWordsAgain.length > 0) {
                const enrichedQuestions = await generateQuestionsFromEnrichedWords(enrichedWeakWordsAgain, Math.ceil(count / 2));
                weakQuestions = [...weakQuestions, ...enrichedQuestions];
              }
              
              questions = shuffleArray(weakQuestions).slice(0, count);
              break;
          }

          if (questions.length === 0) {
            // Fallback to random CEFR words if no questions generated
            console.log('Falling back to default A2 level quiz...');
            const fallbackQuestions = await cefrQuizService.createCefrQuiz('A2', count);
            questions = fallbackQuestions.map((cefrQ, index) => ({
              id: `${cefrQ.word.id}-${index}`,
              word: cefrQ.word.word,
              correctAnswer: cefrQ.correctAnswer,
              options: cefrQ.options,
              pronunciation: cefrQ.word.pronunciation,
              difficulty: mapCefrToLegacyDifficulty(cefrQ.word.cefr_level),
              category: cefrQ.word.pos || 'general',
              definition: cefrQ.word.definition,
              example: cefrQ.word.example_sentence,
              questionType: cefrQ.type
            }));
          }

          console.log(`Quiz started successfully with ${questions.length} questions`);

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
          throw error;
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
        
        // CEFRレベルが設定されている、またはIDがenriched形式の場合はenriched word
        const isEnrichedWord = currentQuestion.cefrLevel || questionId.startsWith('enriched-');
        
        if (isEnrichedWord && currentQuestion.word) {
          // 新しいenriched vocabulary systemの場合
          const word = currentQuestion.word;
          // CEFRレベル情報を直接取得、なければdifficultyから逆算
          const cefrLevel = currentQuestion.cefrLevel || mapDifficultyToCefr(currentQuestion.difficulty);
          
          console.log(`Updating enriched word progress: ${word} (${cefrLevel}) - ${isCorrect ? 'correct' : 'incorrect'}`);
          
          // enriched vocabulary用の進捗更新
          try {
            await databaseService.updateEnrichedWordProgress(word, cefrLevel, isCorrect);
          } catch (error) {
            console.error('Error updating enriched word progress:', error);
          }
        } else {
          // 従来のシステムの場合
          const wordIdStr = questionId.split('-')[0];
          const wordId = parseInt(wordIdStr);
          
          if (isNaN(wordId)) {
            console.error(`Invalid word ID format for progress update: ${questionId}`);
            // エラーでも処理を続行（進捗更新だけ失敗）
          } else {
            await databaseService.updateUserProgress(wordId, isCorrect);
          }
        }

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

      // クイズキャンセル
      cancelQuiz: () => {
        set({ currentSession: null });
      },

      // 単語ブックマーク
      bookmarkWord: async (wordId: number) => {
        try {
          await databaseService.toggleBookmark(wordId);
        } catch (error) {
          console.error('Bookmark word error:', error);
        }
      },

      // Enriched vocabulary用のブックマーク機能
      bookmarkEnrichedWord: async (word: string, cefrLevel: string) => {
        try {
          await databaseService.toggleEnrichedWordBookmark(word, cefrLevel);
        } catch (error) {
          console.error('Bookmark enriched word error:', error);
        }
      },

      // 進捗更新
      updateProgress: async () => {
        try {
          // データベースが初期化されていない場合は早期リターン
          if (!databaseService.isInitialized()) {
            console.log('Database not yet initialized, skipping progress update');
            return;
          }

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