import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import Animated, { 
  FadeInDown, 
  FadeInLeft, 
  FadeInRight,
  FadeInUp 
} from 'react-native-reanimated';
import { ThemedText } from '../ThemedText';
import ModernCard from '../layout/ModernCard';
import ModernButton from '../modern/ModernButton';
import { Spacing } from '../../constants/ModernColors';

interface WelcomeScreenProps {
  onNext: () => void;
  onSkip: () => void;
}

export default function WelcomeScreen({ onNext, onSkip }: WelcomeScreenProps) {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Welcome Hero */}
      <Animated.View 
        style={styles.heroSection}
        entering={FadeInUp.delay(400)}
      >
        <ThemedText style={styles.welcomeEmoji}>🎉</ThemedText>
        <ThemedText style={styles.welcomeTitle}>
          Welcome to VocabMaster
        </ThemedText>
        <ThemedText style={styles.welcomeSubtitle}>
          Your journey to English mastery begins here!
        </ThemedText>
      </Animated.View>

      {/* Features */}
      <View style={styles.featuresContainer}>
        <Animated.View entering={FadeInLeft.delay(600)}>
          <ModernCard variant="primary" pressable={false} delay={0}>
            <View style={styles.featureContent}>
              <ThemedText style={styles.featureEmoji}>📚</ThemedText>
              <View style={styles.featureText}>
                <ThemedText style={styles.featureTitle}>CEFR-J Vocabulary</ThemedText>
                <ThemedText style={styles.featureDescription}>
                  Learn from 7,799 carefully curated words based on the CEFR-J framework
                </ThemedText>
              </View>
            </View>
          </ModernCard>
        </Animated.View>

        <Animated.View entering={FadeInRight.delay(700)}>
          <ModernCard variant="secondary" pressable={false} delay={0}>
            <View style={styles.featureContent}>
              <ThemedText style={styles.featureEmoji}>🎯</ThemedText>
              <View style={styles.featureText}>
                <ThemedText style={styles.featureTitle}>Personalized Learning</ThemedText>
                <ThemedText style={styles.featureDescription}>
                  Adaptive quizzes that match your current level and target goals
                </ThemedText>
              </View>
            </View>
          </ModernCard>
        </Animated.View>

        <Animated.View entering={FadeInLeft.delay(800)}>
          <ModernCard variant="success" pressable={false} delay={0}>
            <View style={styles.featureContent}>
              <ThemedText style={styles.featureEmoji}>📈</ThemedText>
              <View style={styles.featureText}>
                <ThemedText style={styles.featureTitle}>Track Progress</ThemedText>
                <ThemedText style={styles.featureDescription}>
                  Monitor your learning journey with detailed analytics and achievements
                </ThemedText>
              </View>
            </View>
          </ModernCard>
        </Animated.View>

        <Animated.View entering={FadeInRight.delay(900)}>
          <ModernCard variant="warning" pressable={false} delay={0}>
            <View style={styles.featureContent}>
              <ThemedText style={styles.featureEmoji}>🔍</ThemedText>
              <View style={styles.featureText}>
                <ThemedText style={styles.featureTitle}>Rich Word Data</ThemedText>
                <ThemedText style={styles.featureDescription}>
                  Get definitions, pronunciations, synonyms, and examples for deeper understanding
                </ThemedText>
              </View>
            </View>
          </ModernCard>
        </Animated.View>
      </View>

      {/* Action Buttons */}
      <Animated.View 
        style={styles.actionsContainer}
        entering={FadeInDown.delay(1000)}
      >
        <ModernButton
          title="Get Started"
          onPress={onNext}
          variant="primary"
          size="lg"
          icon="🚀"
          style={styles.primaryButton}
        />
        
        <ModernButton
          title="Skip Setup"
          onPress={onSkip}
          variant="neutral"
          size="md"
          style={styles.skipButton}
        />
      </Animated.View>

      {/* Additional Info */}
      <Animated.View 
        style={styles.infoContainer}
        entering={FadeInUp.delay(1100)}
      >
        <ModernCard variant="glass" pressable={false} glassEffect delay={0}>
          <ThemedText style={styles.infoTitle}>✨ What makes VocabMaster special?</ThemedText>
          <View style={styles.infoList}>
            <ThemedText style={styles.infoItem}>
              • Based on CEFR-J (Common European Framework of Reference for Languages - Japan)
            </ThemedText>
            <ThemedText style={styles.infoItem}>
              • Scientifically curated vocabulary for Japanese English learners
            </ThemedText>
            <ThemedText style={styles.infoItem}>
              • Progressive difficulty from A1 (beginner) to C2 (proficient)
            </ThemedText>
            <ThemedText style={styles.infoItem}>
              • Smart review system for long-term retention
            </ThemedText>
          </View>
        </ModernCard>
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
  heroSection: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  welcomeEmoji: {
    fontSize: 64,
    marginBottom: Spacing.lg,
  },
  welcomeTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  welcomeSubtitle: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    lineHeight: 24,
    fontWeight: '500',
  },
  featuresContainer: {
    marginVertical: Spacing.lg,
    gap: Spacing.md,
  },
  featureContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureEmoji: {
    fontSize: 32,
    marginRight: Spacing.md,
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: Spacing.xs,
  },
  featureDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
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
  skipButton: {
    opacity: 0.8,
  },
  infoContainer: {
    marginTop: Spacing.xl,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  infoList: {
    gap: Spacing.sm,
  },
  infoItem: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 20,
    fontWeight: '400',
  },
});