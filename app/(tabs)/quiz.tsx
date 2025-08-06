import React, { useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { useAppStore } from '@/store/useAppStore';
import { useWordsApiKey } from '@/hooks/useWordsApi';
import QuizComponent from '@/components/QuizComponent';
import QuizModeSelector from '@/components/QuizModeSelector';
import ModernScreenLayout from '@/components/layout/ModernScreenLayout';
import ApiKeyModal from '@/components/ApiKeyModal';

export default function QuizScreen() {
  const { currentSession, isLoading, startQuiz, initialize } = useAppStore();
  const { status } = useWordsApiKey();
  const [selectedMode, setSelectedMode] = useState<'random' | 'review' | 'bookmarked' | 'weak'>('random');
  const [showApiModal, setShowApiModal] = useState(false);

  useEffect(() => {
    initialize();
  }, []);

  const handleStartQuiz = async (mode: 'random' | 'review' | 'bookmarked' | 'weak') => {
    try {
      // Check if API key is configured for enhanced quiz experience
      if (!status.configured && mode === 'random') {
        Alert.alert(
          'API Key Recommended',
          'For the best quiz experience with detailed word information, we recommend setting up your Words API key. Would you like to configure it now?',
          [
            {
              text: 'Later',
              onPress: () => startQuiz(mode),
              style: 'cancel'
            },
            {
              text: 'Setup Now',
              onPress: () => setShowApiModal(true)
            }
          ]
        );
        return;
      }
      
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
    <>
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

      <ApiKeyModal
        visible={showApiModal}
        onClose={() => setShowApiModal(false)}
        onSuccess={() => {
          setShowApiModal(false);
          startQuiz(selectedMode);
        }}
        title="Setup API for Better Quiz Experience"
        skipable={true}
      />
    </>
  );
}

