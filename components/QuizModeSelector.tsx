import { Spacing } from '@/constants/ModernColors';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { ThemedText } from './ThemedText';
import ModernCard from './layout/ModernCard';
import ModernButton from './modern/ModernButton';

interface Props {
  selectedMode: 'random' | 'review' | 'bookmarked' | 'weak';
  onModeSelect: (mode: 'random' | 'review' | 'bookmarked' | 'weak') => void;
  onStartQuiz: () => void;
}

export default function QuizModeSelector({ selectedMode, onModeSelect, onStartQuiz }: Props) {
  const modes = [
    {
      id: 'random' as const,
      title: 'Random Quiz',
      subtitle: 'Mixed difficulty words',
      emoji: '🎲',
      variant: 'primary' as const,
      description: 'Practice with a random selection of words based on your CEFR level. Always 10 questions.'
    },
    {
      id: 'review' as const,
      title: 'Review Mode',
      subtitle: 'Words with <50% accuracy',
      emoji: '📚',
      variant: 'warning' as const,
      description: 'Review words with accuracy below 50%. Up to 10 questions based on available words.'
    },
    {
      id: 'bookmarked' as const,
      title: 'Bookmarked',
      subtitle: 'Your saved words',
      emoji: '⭐',
      variant: 'secondary' as const,
      description: 'Practice words you\'ve bookmarked for review. Up to 10 questions based on available words.'
    },
    {
      id: 'weak' as const,
      title: 'Challenge Mode',
      subtitle: 'Words with <30% accuracy',
      emoji: '🔥',
      variant: 'error' as const,
      description: 'Focus on your most challenging words with accuracy below 30%. Up to 10 questions based on available words.'
    }
  ];

  const selectedModeData = modes.find(m => m.id === selectedMode);

  return (
    <View style={styles.container}>
      <View style={styles.modesContainer}>
        {modes.map((mode, index) => (
          <ModernCard
            key={mode.id}
            variant={selectedMode === mode.id ? mode.variant : 'neutral'}
            onPress={() => onModeSelect(mode.id)}
            style={styles.modeCard}
            delay={index * 100}
            glassEffect={selectedMode === mode.id}
          >
            <View style={styles.modeHeader}>
              <View style={styles.modeIcon}>
                <ThemedText style={styles.emoji}>{mode.emoji}</ThemedText>
              </View>
              <View style={styles.modeInfo}>
                <ThemedText style={styles.modeTitle}>
                  {mode.title}
                </ThemedText>
                <ThemedText style={styles.modeSubtitle}>
                  {mode.subtitle}
                </ThemedText>
              </View>
              {selectedMode === mode.id && (
                <Animated.View 
                  entering={FadeInDown.delay(200)}
                  style={styles.selectedIndicator}
                >
                  <ThemedText style={styles.checkmark}>✓</ThemedText>
                </Animated.View>
              )}
            </View>
            <ThemedText style={styles.modeDescription}>
              {mode.description}
            </ThemedText>
          </ModernCard>
        ))}
      </View>

      <Animated.View 
        entering={FadeInDown.delay(500)} 
        style={styles.selectedModeInfo}
      >
        {selectedModeData && (
            <ModernButton
              title="Start Quiz"
              onPress={onStartQuiz}
              variant={selectedModeData.variant}
              size="lg"
              icon="🚀"
              style={styles.startButton}
            />
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  modesContainer: {
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  modeCard: {
    marginVertical: 0,
  },
  modeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  modeIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  emoji: {
    fontSize: 24,
  },
  modeInfo: {
    flex: 1,
  },
  modeTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 4,
  },
  modeSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
  },
  selectedIndicator: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmark: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
  },
  modeDescription: {
    fontSize: 14,
    lineHeight: 20,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '400',
  },
  selectedModeInfo: {
    alignItems: 'center',
    gap: Spacing.md,
    paddingBottom: Spacing.md,
  },
  selectedModeText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    color: '#ffffff',
  },
  startButton: {
    minWidth: 200,
    marginBottom: Spacing.lg,
  },
});