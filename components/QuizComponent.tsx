import { useAudio } from '@/hooks/useAudio';
import { useAppStore } from '@/store/useAppStore';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  StyleSheet,
  TouchableOpacity,
  View
} from 'react-native';
import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';

// const { width } = Dimensions.get('window');

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

  if (!currentSession) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText type="title">No active quiz session</ThemedText>
      </ThemedView>
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
    <ThemedView style={styles.container}>
      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>
        <ThemedText style={styles.progressText}>
          Question {currentSession.currentIndex + 1} of {currentSession.questions.length}
        </ThemedText>
      </View>

      {/* Question Card */}
      <ThemedView style={styles.questionCard}>
        <ThemedText type="title" style={styles.word}>
          {currentQuestion.word}
        </ThemedText>
        
        <TouchableOpacity 
          style={[
            styles.audioButton,
            isPlaying && styles.audioButtonPlaying
          ]}
          onPress={() => playWord(currentQuestion.word, currentQuestion.pronunciation)}
          disabled={isPlaying}
        >
          <ThemedText style={[
            styles.audioText,
            isPlaying && styles.audioTextPlaying
          ]}>
            {isPlaying ? '⏸️ Playing...' : '🔊 Play Pronunciation'}
          </ThemedText>
        </TouchableOpacity>

        <ThemedText style={styles.instruction}>
          {showResult ? 'Answer selected!' : 'Select the correct definition:'}
        </ThemedText>

        <View style={styles.optionsContainer}>
          {currentQuestion.options.map((option, index) => {
            const isSelected = selectedAnswer === option;
            const isCorrectOption = option === currentQuestion.correctAnswer;
            
            let buttonStyle = [styles.optionButton];
            let textStyle = [styles.optionText];

            if (showResult) {
              if (isCorrectOption) {
                buttonStyle.push(styles.correctOption);
                textStyle.push(styles.correctOptionText);
              } else if (isSelected && !isCorrectOption) {
                buttonStyle.push(styles.wrongOption);
                textStyle.push(styles.wrongOptionText);
              }
            } else if (isSelected) {
              buttonStyle.push(styles.selectedOption);
              textStyle.push(styles.selectedOptionText);
            }

            return (
              <TouchableOpacity
                key={index}
                style={buttonStyle}
                onPress={() => handleAnswerSelect(option)}
                disabled={showResult}
              >
                <View style={styles.optionContent}>
                  <ThemedText style={styles.optionLabel}>
                    {String.fromCharCode(65 + index)})
                  </ThemedText>
                  <ThemedText style={textStyle}>
                    {option}
                  </ThemedText>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {showResult && (
          <View style={styles.resultContainer}>
            <ThemedText style={[
              styles.resultText,
              { color: isCorrect ? '#4CAF50' : '#F44336' }
            ]}>
              {isCorrect ? '✅ Correct!' : '❌ Incorrect'}
            </ThemedText>
            {!isCorrect && (
              <ThemedText style={styles.correctAnswerText}>
                Correct answer: {currentQuestion.correctAnswer}
              </ThemedText>
            )}
            
            {/* Navigation Buttons */}
            <View style={styles.navigationContainer}>
              {currentSession.currentIndex > 0 && (
                <TouchableOpacity
                  style={styles.navigationButton}
                  onPress={handleBack}
                >
                  <ThemedText style={styles.navigationButtonText}>← Back</ThemedText>
                </TouchableOpacity>
              )}
              
              {!isLastQuestion && (
                <TouchableOpacity
                  style={[styles.navigationButton, styles.nextNavigationButton]}
                  onPress={handleNext}
                >
                  <ThemedText style={styles.navigationButtonText}>Next →</ThemedText>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}
      </ThemedView>

      {/* Action Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.bookmarkButton}
          onPress={handleBookmark}
        >
          <ThemedText style={styles.bookmarkText}>📖 Bookmark</ThemedText>
        </TouchableOpacity>

        {showResult && isLastQuestion && (
          <TouchableOpacity
            style={styles.nextButton}
            onPress={handleFinish}
          >
            <ThemedText style={styles.nextButtonText}>Finish Quiz</ThemedText>
          </TouchableOpacity>
        )}
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  progressContainer: {
    marginBottom: 30,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 10,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 4,
  },
  progressText: {
    textAlign: 'center',
    fontSize: 14,
    opacity: 0.7,
  },
  questionCard: {
    flex: 1,
    padding: 25,
    borderRadius: 12,
    backgroundColor: '#f8f9fa',
    alignItems: 'center',
  },
  word: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  audioButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 20,
  },
  audioButtonPlaying: {
    backgroundColor: '#FF9800',
  },
  audioText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  audioTextPlaying: {
    color: '#ffffff',
  },
  instruction: {
    fontSize: 16,
    marginBottom: 25,
    textAlign: 'center',
    opacity: 0.8,
  },
  optionsContainer: {
    width: '100%',
    gap: 12,
  },
  optionButton: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    padding: 16,
  },
  selectedOption: {
    borderColor: '#2196F3',
    backgroundColor: '#e3f2fd',
  },
  correctOption: {
    borderColor: '#4CAF50',
    backgroundColor: '#e8f5e8',
  },
  wrongOption: {
    borderColor: '#F44336',
    backgroundColor: '#ffebee',
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 12,
    minWidth: 20,
  },
  optionText: {
    fontSize: 16,
    flex: 1,
  },
  selectedOptionText: {
    color: '#2196F3',
    fontWeight: '600',
  },
  correctOptionText: {
    color: '#4CAF50',
    fontWeight: '600',
  },
  wrongOptionText: {
    color: '#F44336',
    fontWeight: '600',
  },
  resultContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
  resultText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  correctAnswerText: {
    fontSize: 14,
    textAlign: 'center',
    opacity: 0.8,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    gap: 12,
  },
  bookmarkButton: {
    flex: 1,
    backgroundColor: '#FF9800',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  bookmarkText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  submitButton: {
    flex: 2,
    backgroundColor: '#4CAF50',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#cccccc',
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
  submitButtonTextDisabled: {
    color: '#999999',
  },
  nextButton: {
    flex: 2,
    backgroundColor: '#2196F3',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  nextButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
  navigationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 20,
  },
  navigationButton: {
    backgroundColor: '#e0e0e0',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  navigationButtonText: {
    color: '#333333',
    fontSize: 16,
    fontWeight: '600',
  },
  nextNavigationButton: {
    backgroundColor: '#2196F3',
  },
});