import React, { useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { useAppStore } from '@/store/useAppStore';
import QuizComponent from '@/components/QuizComponent';
import QuizModeSelector from '@/components/QuizModeSelector';
import ModernScreenLayout from '@/components/layout/ModernScreenLayout';

export default function QuizScreen() {
  const { currentSession, isLoading, startQuiz, initialize } = useAppStore();
  const [selectedMode, setSelectedMode] = useState<'random' | 'review' | 'bookmarked' | 'weak'>('random');

  useEffect(() => {
    initialize();
  }, []);

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

