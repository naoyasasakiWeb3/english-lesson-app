import { BorderRadius, ModernColors, ShadowStyles, Spacing } from '@/constants/ModernColors';
import { useAudio } from '@/hooks/useAudio';
import { useAppStore } from '@/store/useAppStore';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  View
} from 'react-native';
import Animated, {
  FadeInDown,
  FadeInUp,
  SlideInLeft,
  SlideInRight
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';
import ModernButton from './modern/ModernButton';

export default function QuizComponent() {
  const router = useRouter();
  const { 
    currentSession, 
    submitAnswer, 
    nextQuestion, 
    previousQuestion,
    finishSession, 
    bookmarkWord 
  } = useAppStore();

  const { playWord, isPlaying, settings } = useAudio();

  const [selectedAnswer, setSelectedAnswer] = useState<string>('');
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  // Auto-play pronunciation when question changes and auto-play is enabled
  useEffect(() => {
    if (currentSession && settings.autoPlay) {
      const currentQuestion = currentSession.questions[currentSession.currentIndex];
      if (currentQuestion) {
        playWord(currentQuestion.word, currentQuestion.pronunciation);
      }
    }
  }, [currentSession?.currentIndex, settings.autoPlay, playWord, currentSession]);

  // デバッグ用: クイズデータの確認
  useEffect(() => {
    if (currentSession) {
      console.log('Current Session Debug:', {
        totalQuestions: currentSession.questions.length,
        currentIndex: currentSession.currentIndex,
        currentQuestion: currentSession.questions[currentSession.currentIndex]
      });
    }
  }, [currentSession]);

  if (!currentSession) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <LinearGradient
          colors={ModernColors.gradients.background as [string, string, ...string[]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradientBackground}
        >
          <ThemedView style={styles.container}>
            <ThemedText type="title">No active quiz session</ThemedText>
          </ThemedView>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  const currentQuestion = currentSession.questions[currentSession.currentIndex];
  const progress = ((currentSession.currentIndex + 1) / currentSession.questions.length) * 100;
  const isLastQuestion = currentSession.currentIndex === currentSession.questions.length - 1;

  const handleAnswerSelect = async (answer: string) => {
    if (showResult) return;
    
    setSelectedAnswer(answer);
    
    // Automatically submit the answer when selected
    const correct = answer === currentQuestion.correctAnswer;
    setIsCorrect(correct);
    setShowResult(true);

    await submitAnswer(currentQuestion.id, answer);
  };

  const handleNext = () => {
    if (isLastQuestion) {
      handleFinish();
    } else {
      // Reset state for next question
      setSelectedAnswer('');
      setShowResult(false);
      setIsCorrect(false);
      
      // 状態の更新が完了した後で次の問題に移行
      Promise.resolve().then(() => {
        nextQuestion();
      });
    }
  };

  const handleBack = () => {
    if (currentSession.currentIndex > 0) {
      // Reset state for previous question
      setSelectedAnswer('');
      setShowResult(false);
      setIsCorrect(false);
      
      // Go to previous question
      Promise.resolve().then(() => {
        previousQuestion();
      });
    }
  };

  const handleFinish = async () => {
    await finishSession();
    
    // Show results summary
    const correctCount = currentSession.answers.filter(Boolean).length;
    const totalCount = currentSession.questions.length;
    const accuracy = Math.round((correctCount / totalCount) * 100);

    Alert.alert(
      'Quiz Complete!',
      `You got ${correctCount} out of ${totalCount} questions correct (${accuracy}%)`,
      [{ text: 'OK', onPress: () => router.push('/') }]
    );
  };

  const handleBookmark = async () => {
    const wordId = parseInt(currentQuestion.id.split('-')[0]);
    await bookmarkWord(wordId);
    Alert.alert('Success', 'Word bookmarked for review!');
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <LinearGradient
        colors={ModernColors.gradients.background as [string, string, ...string[]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientBackground}
      >
        <View style={styles.container}>
          <ScrollView 
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Modern Progress Bar */}
            <Animated.View entering={FadeInUp.delay(100)} style={styles.progressContainer}>
              <View style={styles.modernProgressBar}>
                <Animated.View 
                  style={[styles.modernProgressFill, { width: `${progress}%` }]} 
                  entering={FadeInDown.delay(200)}
                />
              </View>
              <ThemedText style={styles.progressText}>
                Question {currentSession.currentIndex + 1} of {currentSession.questions.length}
              </ThemedText>
            </Animated.View>

            {/* Modern Question Card */}
            <Animated.View entering={FadeInDown.delay(300)} style={styles.questionCardWrapper}>
              <View style={styles.questionCard}>
                <LinearGradient
                  colors={ModernColors.gradients.primaryBlue as [string, string, ...string[]]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.questionCardGradient}
                >
                  <Animated.View entering={SlideInLeft.delay(400)}>
                    <ThemedText type="title" style={styles.modernWord}>
                      {currentQuestion.word}
                    </ThemedText>
                  </Animated.View>
                  
                  <Animated.View entering={SlideInRight.delay(500)}>
                    <ModernButton
                      title={isPlaying ? 'Playing...' : 'Play Pronunciation'}
                      onPress={() => playWord(currentQuestion.word, currentQuestion.pronunciation)}
                      variant={isPlaying ? 'warning' : 'success'}
                      size="md"
                      icon={isPlaying ? '⏸️' : '🔊'}
                      disabled={isPlaying}
                      style={styles.modernAudioButton}
                    />
                  </Animated.View>

                  <Animated.View entering={FadeInDown.delay(600)}>
                    <ThemedText style={styles.modernInstruction}>
                      {showResult ? 'Answer selected!' : 'Select the correct definition:'}
                    </ThemedText>
                  </Animated.View>

                  <View style={styles.optionsContainer}>
                    {currentQuestion.options.map((option, index) => {
                      const isSelected = selectedAnswer === option;
                      const isCorrectOption = option === currentQuestion.correctAnswer;
                      
                      let gradientColors: [string, string, ...string[]] = ModernColors.gradients.neutral as [string, string, ...string[]];
                      
                      if (showResult) {
                        if (isCorrectOption) {
                          gradientColors = ModernColors.gradients.success as [string, string, ...string[]];
                        } else if (isSelected && !isCorrectOption) {
                          gradientColors = ModernColors.gradients.error as [string, string, ...string[]];
                        } else {
                          gradientColors = ModernColors.gradients.neutral as [string, string, ...string[]];
                        }
                      } else if (isSelected) {
                        gradientColors = ModernColors.gradients.warning as [string, string, ...string[]];
                      } else {
                        gradientColors = ModernColors.gradients.neutral as [string, string, ...string[]];
                      }

                      return (
                        <Animated.View key={index} entering={FadeInDown.delay(700 + index * 100)}>
                          <Pressable
                            onPress={() => handleAnswerSelect(option)}
                            disabled={showResult}
                            style={styles.modernOptionCard}
                          >
                            <LinearGradient
                              colors={gradientColors}
                              start={{ x: 0, y: 0 }}
                              end={{ x: 1, y: 1 }}
                              style={styles.optionCardGradient}
                            >
                              <View style={styles.optionContent}>
                                <ThemedText style={styles.modernOptionLabel}>
                                  {String.fromCharCode(65 + index)})
                                </ThemedText>
                                <ThemedText style={styles.modernOptionText}>
                                  {option || `Option ${index + 1} (No definition)`}
                                </ThemedText>
                              </View>
                            </LinearGradient>
                          </Pressable>
                        </Animated.View>
                      );
                    })}
                  </View>

                  {showResult && (
                    <Animated.View entering={FadeInUp.delay(1000)} style={styles.resultContainer}>
                      <View style={styles.resultCard}>
                        <LinearGradient
                          colors={isCorrect ? ModernColors.gradients.success as [string, string, ...string[]] : ModernColors.gradients.error as [string, string, ...string[]]}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                          style={styles.resultCardGradient}
                        >
                          <ThemedText style={styles.modernResultText}>
                            {isCorrect ? '✅ Correct!' : '❌ Incorrect'}
                          </ThemedText>
                          {!isCorrect && (
                            <ThemedText style={styles.modernCorrectAnswerText}>
                              Correct answer: {currentQuestion.correctAnswer}
                            </ThemedText>
                          )}
                        </LinearGradient>
                      </View>
                      
                      {/* Modern Navigation Buttons */}
                      <View style={styles.navigationContainer}>
                        {currentSession.currentIndex > 0 && (
                          <ModernButton
                            title="← Back"
                            onPress={handleBack}
                            variant="secondary"
                            size="md"
                            style={styles.navButton}
                          />
                        )}
                        
                        {!isLastQuestion && (
                          <ModernButton
                            title="Next →"
                            onPress={handleNext}
                            variant="primary"
                            size="md"
                            style={styles.navButton}
                          />
                        )}
                      </View>
                    </Animated.View>
                  )}
                </LinearGradient>
              </View>
            </Animated.View>

            {/* Modern Action Buttons */}
            <Animated.View entering={FadeInUp.delay(1100)} style={styles.buttonContainer}>
              <ModernButton
                title="Bookmark"
                onPress={handleBookmark}
                variant="warning"
                size="md"
                icon="📖"
                style={styles.modernBookmarkButton}
              />

              {showResult && isLastQuestion && (
                <ModernButton
                  title="Finish Quiz"
                  onPress={handleFinish}
                  variant="primary"
                  size="lg"
                  icon="🎯"
                  style={styles.modernFinishButton}
                />
              )}
            </Animated.View>
          </ScrollView>
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  gradientBackground: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: Spacing.lg,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: Spacing.xl,
  },
  progressContainer: {
    marginBottom: Spacing.xl,
  },
  modernProgressBar: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
    marginBottom: Spacing.sm,
    ...ShadowStyles.small,
  },
  modernProgressFill: {
    height: '100%',
    backgroundColor: '#ffffff',
    borderRadius: BorderRadius.full,
    ...ShadowStyles.small,
  },
  progressText: {
    textAlign: 'center',
    fontSize: 14,
    color: '#ffffff',
    fontWeight: '600',
  },
  questionCardWrapper: {
    flex: 1,
    marginBottom: Spacing.lg,
  },
  questionCard: {
    width: '100%',
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    ...ShadowStyles.medium,
  },
  questionCardGradient: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 300,
  },
  modernWord: {
    fontSize: 32,
    fontWeight: '800',
    marginBottom: Spacing.md,
    textAlign: 'center',
    color: '#ffffff',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  modernAudioButton: {
    marginBottom: Spacing.md,
  },
  modernInstruction: {
    fontSize: 18,
    marginBottom: Spacing.md,
    textAlign: 'center',
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
  },
  optionsContainer: {
    width: '100%',
    gap: Spacing.md,
  },
  modernOptionCard: {
    marginVertical: 0,
    marginHorizontal: 0,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    ...ShadowStyles.small,
  },
  optionCardGradient: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.xs,
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.md,
    minHeight: 70,
  },
  modernOptionLabel: {
    fontSize: 18,
    fontWeight: '800',
    marginRight: Spacing.md,
    minWidth: 24,
    color: '#ffffff',
  },
  modernOptionText: {
    fontSize: 16,
    flex: 1,
    color: '#ffffff',
    fontWeight: '600',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
    lineHeight: 22,
    textAlign: 'left',
  },
  resultContainer: {
    marginTop: Spacing.lg,
    alignItems: 'center',
  },
  resultCard: {
    marginVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    ...ShadowStyles.medium,
  },
  resultCardGradient: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    alignItems: 'center',
  },
  modernResultText: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: Spacing.sm,
    color: '#ffffff',
    textAlign: 'center',
  },
  modernCorrectAnswerText: {
    fontSize: 16,
    textAlign: 'center',
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.lg,
    gap: Spacing.md,
  },
  modernBookmarkButton: {
    flex: 1,
  },
  modernFinishButton: {
    flex: 2,
  },
  navigationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: Spacing.lg,
    gap: Spacing.md,
  },
  navButton: {
    flex: 1,
  },
});