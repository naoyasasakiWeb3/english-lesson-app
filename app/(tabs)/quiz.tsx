import React, { useEffect, useState } from 'react';
import { StyleSheet, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useAppStore } from '@/store/useAppStore';
import QuizComponent from '@/components/QuizComponent';
import QuizModeSelector from '@/components/QuizModeSelector';

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
      <ThemedView style={styles.container}>
        <ThemedText type="title">Loading...</ThemedText>
      </ThemedView>
    );
  }

  if (currentSession) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ThemedView style={styles.container}>
          <QuizComponent />
        </ThemedView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView style={styles.container}>
      <ThemedView style={styles.content}>
        <ThemedView style={styles.header}>
          <ThemedText type="title">Start Learning</ThemedText>
          <ThemedText style={styles.subtitle}>
            Choose your learning mode and begin your vocabulary journey
          </ThemedText>
        </ThemedView>

        <QuizModeSelector
          selectedMode={selectedMode}
          onModeSelect={setSelectedMode}
          onStartQuiz={() => handleStartQuiz(selectedMode)}
        />
        </ThemedView>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  subtitle: {
    textAlign: 'center',
    marginTop: 10,
    opacity: 0.7,
  },
});