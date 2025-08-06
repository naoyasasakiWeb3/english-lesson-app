import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import Animated, { 
  FadeInDown, 
  FadeInUp,
  FadeInLeft,
  FadeInRight,
  BounceIn
} from 'react-native-reanimated';
import { ThemedText } from '../ThemedText';
import ModernCard from '../layout/ModernCard';
import ModernButton from '../modern/ModernButton';
import { Spacing, BorderRadius } from '../../constants/ModernColors';
import { OnboardingData } from './OnboardingFlow';

interface OnboardingCompleteScreenProps {
  onComplete: () => void;
  onBack: () => void;
  onboardingData: OnboardingData;
}

const CEFR_LEVEL_INFO = {
  'A1': { name: 'Beginner', emoji: '🌱', color: 'success' },
  'A2': { name: 'Elementary', emoji: '🌿', color: 'primary' },
  'B1': { name: 'Intermediate', emoji: '🌳', color: 'secondary' },
  'B2': { name: 'Upper-Intermediate', emoji: '🌲', color: 'warning' },
  'C1': { name: 'Advanced', emoji: '🏔️', color: 'error' },
  'C2': { name: 'Proficient', emoji: '⭐', color: 'neutral' }
};

export default function OnboardingCompleteScreen({ 
  onComplete, 
  onBack, 
  onboardingData 
}: OnboardingCompleteScreenProps) {
  const currentLevelInfo = CEFR_LEVEL_INFO[onboardingData.currentLevel as keyof typeof CEFR_LEVEL_INFO];
  const targetLevelInfo = CEFR_LEVEL_INFO[onboardingData.targetLevel as keyof typeof CEFR_LEVEL_INFO];

  const getNextSteps = () => {
    const steps = [
      '🎯 Take quizzes matched to your level',
      '📚 Build vocabulary progressively',
      '📊 Track your learning progress',
      '⭐ Earn achievements as you improve'
    ];

    if (onboardingData.apiKeyConfigured) {
      steps.push('🔊 Access rich word details and pronunciations');
    } else {
      steps.push('🔑 Consider adding API key in Settings for enhanced features');
    }

    return steps;
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Celebration Section */}
      <Animated.View 
        style={styles.celebrationSection}
        entering={BounceIn.delay(200)}
      >
        <ThemedText style={styles.celebrationEmoji}>🎉</ThemedText>
        <ThemedText style={styles.celebrationTitle}>
          You're All Set!
        </ThemedText>
        <ThemedText style={styles.celebrationSubtitle}>
          Welcome to your personalized English learning journey
        </ThemedText>
      </Animated.View>

      {/* Setup Summary */}
      <Animated.View entering={FadeInUp.delay(400)}>
        <ModernCard variant="primary" pressable={false} delay={0}>
          <ThemedText style={styles.summaryTitle}>📋 Your Learning Profile</ThemedText>
          
          <View style={styles.profileGrid}>
            {/* Current Level */}
            <Animated.View entering={FadeInLeft.delay(600)}>
              <ModernCard 
                variant={currentLevelInfo?.color as any || 'neutral'} 
                pressable={false} 
                delay={0}
                style={styles.profileCard}
              >
                <View style={styles.profileContent}>
                  <ThemedText style={styles.profileEmoji}>
                    {currentLevelInfo?.emoji || '📍'}
                  </ThemedText>
                  <View style={styles.profileInfo}>
                    <ThemedText style={styles.profileLabel}>Current Level</ThemedText>
                    <ThemedText style={styles.profileValue}>
                      {onboardingData.currentLevel} - {currentLevelInfo?.name}
                    </ThemedText>
                  </View>
                </View>
              </ModernCard>
            </Animated.View>

            {/* Target Level */}
            <Animated.View entering={FadeInRight.delay(700)}>
              <ModernCard 
                variant={targetLevelInfo?.color as any || 'neutral'} 
                pressable={false} 
                delay={0}
                style={styles.profileCard}
              >
                <View style={styles.profileContent}>
                  <ThemedText style={styles.profileEmoji}>
                    {targetLevelInfo?.emoji || '🚀'}
                  </ThemedText>
                  <View style={styles.profileInfo}>
                    <ThemedText style={styles.profileLabel}>Target Level</ThemedText>
                    <ThemedText style={styles.profileValue}>
                      {onboardingData.targetLevel} - {targetLevelInfo?.name}
                    </ThemedText>
                  </View>
                </View>
              </ModernCard>
            </Animated.View>

            {/* API Status */}
            <Animated.View entering={FadeInLeft.delay(800)}>
              <ModernCard 
                variant={onboardingData.apiKeyConfigured ? 'success' : 'warning'} 
                pressable={false} 
                delay={0}
                style={styles.profileCard}
              >
                <View style={styles.profileContent}>
                  <ThemedText style={styles.profileEmoji}>
                    {onboardingData.apiKeyConfigured ? '🔑' : '⚠️'}
                  </ThemedText>
                  <View style={styles.profileInfo}>
                    <ThemedText style={styles.profileLabel}>API Access</ThemedText>
                    <ThemedText style={styles.profileValue}>
                      {onboardingData.apiKeyConfigured ? 'Configured' : 'Not Set'}
                    </ThemedText>
                  </View>
                </View>
              </ModernCard>
            </Animated.View>
          </View>
        </ModernCard>
      </Animated.View>

      {/* What's Next */}
      <Animated.View entering={FadeInDown.delay(900)}>
        <ModernCard variant="secondary" pressable={false} delay={0}>
          <ThemedText style={styles.sectionTitle}>🚀 What's Next?</ThemedText>
          
          <View style={styles.stepsList}>
            {getNextSteps().map((step, index) => (
              <Animated.View
                key={index}
                entering={FadeInLeft.delay(1000 + index * 100)}
                style={styles.stepItem}
              >
                <View style={styles.stepNumber}>
                  <ThemedText style={styles.stepNumberText}>{index + 1}</ThemedText>
                </View>
                <ThemedText style={styles.stepText}>{step}</ThemedText>
              </Animated.View>
            ))}
          </View>
        </ModernCard>
      </Animated.View>

      {/* Motivational Card */}
      <Animated.View entering={FadeInUp.delay(1300)}>
        <ModernCard variant="glass" pressable={false} glassEffect delay={0}>
          <View style={styles.motivationContent}>
            <ThemedText style={styles.motivationEmoji}>💪</ThemedText>
            <View style={styles.motivationText}>
              <ThemedText style={styles.motivationTitle}>
                Ready to Master English?
              </ThemedText>
              <ThemedText style={styles.motivationDescription}>
                Consistent practice is key to language learning. Even 10 minutes a day can make a significant difference. Let's begin your journey to fluency!
              </ThemedText>
            </View>
          </View>
        </ModernCard>
      </Animated.View>

      {/* Action Buttons */}
      <Animated.View 
        style={styles.actionsContainer}
        entering={FadeInDown.delay(1400)}
      >
        <ModernButton
          title="Start Learning!"
          onPress={onComplete}
          variant="primary"
          size="lg"
          icon="✨"
          style={styles.primaryButton}
        />
        
        <ModernButton
          title="Review Settings"
          onPress={onBack}
          variant="neutral"
          size="md"
          style={styles.backButton}
        />
      </Animated.View>

      {/* Footer */}
      <Animated.View 
        style={styles.footer}
        entering={FadeInUp.delay(1500)}
      >
        <ThemedText style={styles.footerText}>
          You can always change these settings later in the Settings tab
        </ThemedText>
      </Animated.View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    flexGrow: 1,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  celebrationSection: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  celebrationEmoji: {
    fontSize: 64,
    marginBottom: Spacing.lg,
  },
  celebrationTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  celebrationSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    lineHeight: 22,
    fontWeight: '500',
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: Spacing.lg,
    textAlign: 'center',
  },
  profileGrid: {
    gap: Spacing.md,
  },
  profileCard: {
    marginVertical: 0,
  },
  profileContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileEmoji: {
    fontSize: 24,
    marginRight: Spacing.md,
  },
  profileInfo: {
    flex: 1,
  },
  profileLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  profileValue: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '700',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: Spacing.lg,
    textAlign: 'center',
  },
  stepsList: {
    gap: Spacing.md,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
    marginTop: 2,
  },
  stepNumberText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
  stepText: {
    flex: 1,
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 20,
    marginTop: 4,
    fontWeight: '500',
  },
  motivationContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  motivationEmoji: {
    fontSize: 32,
    marginRight: Spacing.md,
  },
  motivationText: {
    flex: 1,
  },
  motivationTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: Spacing.xs,
  },
  motivationDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 20,
    fontWeight: '400',
  },
  actionsContainer: {
    marginTop: Spacing.xl,
    gap: Spacing.md,
  },
  primaryButton: {
    marginBottom: Spacing.sm,
  },
  backButton: {
    opacity: 0.8,
  },
  footer: {
    marginTop: Spacing.xl,
    paddingTop: Spacing.lg,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
    lineHeight: 16,
    fontWeight: '400',
  },
});