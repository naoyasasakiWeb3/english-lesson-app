import { ModernColors, Spacing } from '@/constants/ModernColors';
import { useAppStore } from '@/store/useAppStore';
import { useRouter } from 'expo-router';
import React from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { ThemedText } from './ThemedText';
import ModernCard from './layout/ModernCard';
import ModernButton from './modern/ModernButton';

export default function QuickActions() {
  const router = useRouter();
  const { startQuiz } = useAppStore();

  const handleQuickQuiz = async (mode: 'random' | 'review') => {
    try {
      await startQuiz(mode, 10); // Quick 10-question quiz
      router.push('/quiz');
    } catch (error) {
      Alert.alert('Error', 'Failed to start quiz. Please try again.');
    }
  };

  return (
    <View style={styles.container}>
      <Animated.View entering={FadeInDown.delay(600)}>
        <ThemedText type="subtitle" style={styles.title}>Quick Actions</ThemedText>
      </Animated.View>
      
      <View style={styles.actionsGrid}>
        <Animated.View entering={FadeInDown.delay(700)} style={styles.actionRow}>
          <ModernButton
            title="Quick Quiz"
            onPress={() => handleQuickQuiz('random')}
            variant="primary"
            size="lg"
            icon="⚡"
            style={styles.primaryButton}
          />
        </Animated.View>

        <View style={styles.secondaryActions}>
          <Animated.View entering={FadeInDown.delay(800)} style={styles.secondaryButton}>
            <ModernButton
              title="Review"
              onPress={() => handleQuickQuiz('review')}
              variant="warning"
              size="md"
              icon="📚"
            />
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(900)} style={styles.secondaryButton}>
            <ModernButton
              title="Settings"
              onPress={() => router.push('/settings')}
              variant="secondary"
              size="md"
              icon="⚙️"
            />
          </Animated.View>
        </View>

        <Animated.View entering={FadeInDown.delay(1000)}>
          <ModernCard 
            variant="neutral"
            onPress={() => router.push('/quiz')}
            style={styles.fullQuizCard}
            glassEffect={true}
          >
            <View style={styles.fullQuizContent}>
              <Text style={styles.fullQuizEmoji}>🎯</Text>
              <ThemedText style={styles.fullQuizTitle}>Full Learning Session</ThemedText>
              <ThemedText style={styles.fullQuizSubtitle}>Complete vocabulary practice</ThemedText>
            </View>
          </ModernCard>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.lg,
  },
  title: {
    textAlign: 'center',
    marginBottom: Spacing.lg,
    fontSize: 24,
    fontWeight: '700',
    color: ModernColors.gray[800],
  },
  actionsGrid: {
    gap: Spacing.md,
  },
  actionRow: {
    width: '100%',
  },
  primaryButton: {
    width: '100%',
  },
  secondaryActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  secondaryButton: {
    flex: 1,
  },
  fullQuizCard: {
    marginTop: Spacing.sm,
  },
  fullQuizContent: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  fullQuizEmoji: {
    fontSize: 48,
    marginBottom: Spacing.sm,
  },
  fullQuizTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: Spacing.xs,
    textAlign: 'center',
  },
  fullQuizSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
});

