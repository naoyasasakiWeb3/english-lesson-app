import QuizComponent from '@/components/QuizComponent';
import QuizModeSelector from '@/components/QuizModeSelector';
import ModernScreenLayout from '@/components/layout/ModernScreenLayout';
import { databaseService } from '@/services/database';
import { useAppStore } from '@/store/useAppStore';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useEffect, useState } from 'react';
import { Alert } from 'react-native';

export default function QuizScreen() {
  const { currentSession, isLoading, startQuiz, initialize, updateProgress, cancelQuiz } = useAppStore();
  const [selectedMode, setSelectedMode] = useState<'random' | 'review' | 'bookmarked' | 'weak'>('random');

  useEffect(() => {
    initialize();
  }, []);

  // タブがアクティブになったときにデータをリフレッシュのみ実行
  useFocusEffect(
    useCallback(() => {
      console.log('Quiz tab focused - checking database status');
      if (databaseService.isInitialized()) {
        console.log('Database initialized - refreshing data');
        updateProgress();
      } else {
        console.log('Database not yet initialized - skipping refresh');
      }
    }, [updateProgress])
  );

  const handleStartQuiz = async (mode: 'random' | 'review' | 'bookmarked' | 'weak') => {
    try {
      await startQuiz(mode);
    } catch (error) {
      Alert.alert('Error', 'Failed to start quiz. Please try again.');
    }
  };

  if (isLoading) {
    return (
      <ModernScreenLayout title="Loading...">
        <></>
      </ModernScreenLayout>
    );
  }

  if (currentSession) {
    return <QuizComponent />;
  }

  return (
    <ModernScreenLayout 
      title="Start Learning"
      subtitle="Choose your learning mode and begin your vocabulary journey"
    >
      <QuizModeSelector
        selectedMode={selectedMode}
        onModeSelect={setSelectedMode}
        onStartQuiz={() => handleStartQuiz(selectedMode)}
      />
    </ModernScreenLayout>
  );
}

