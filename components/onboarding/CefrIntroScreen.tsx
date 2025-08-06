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

interface CefrIntroScreenProps {
  onNext: () => void;
  onBack: () => void;
  onSkip: () => void;
}

const CEFR_LEVELS = [
  {
    level: 'A1',
    name: 'Beginner',
    description: 'Basic everyday expressions and simple phrases',
    color: 'success',
    emoji: '🌱',
    examples: ['I am', 'Hello', 'My name is', 'How are you?']
  },
  {
    level: 'A2',
    name: 'Elementary',
    description: 'Simple sentences about familiar topics',
    color: 'primary',
    emoji: '🌿',
    examples: ['I like coffee', 'Where is the station?', 'I work in Tokyo']
  },
  {
    level: 'B1',
    name: 'Intermediate',
    description: 'Main points of clear standard input on familiar matters',
    color: 'secondary',
    emoji: '🌳',
    examples: ['I think that...', 'In my opinion', 'I would like to...']
  },
  {
    level: 'B2',
    name: 'Upper-Intermediate',
    description: 'Complex texts and abstract topics with some fluency',
    color: 'warning',
    emoji: '🌲',
    examples: ['Nevertheless', 'Furthermore', 'Consequently']
  },
  {
    level: 'C1',
    name: 'Advanced',
    description: 'Wide range of demanding texts and implicit meaning',
    color: 'error',
    emoji: '🏔️',
    examples: ['Notwithstanding', 'Albeit', 'Hitherto']
  },
  {
    level: 'C2',
    name: 'Proficient',
    description: 'Effortless understanding of virtually everything',
    color: 'neutral',
    emoji: '⭐',
    examples: ['Quintessential', 'Perspicacious', 'Idiosyncratic']
  }
];

export default function CefrIntroScreen({ onNext, onBack, onSkip }: CefrIntroScreenProps) {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Title Section */}
      <Animated.View 
        style={styles.titleSection}
        entering={FadeInUp.delay(200)}
      >
        <ThemedText style={styles.titleEmoji}>🎓</ThemedText>
        <ThemedText style={styles.title}>Understanding CEFR-J Levels</ThemedText>
        <ThemedText style={styles.subtitle}>
          The Common European Framework adapted for Japanese learners
        </ThemedText>
      </Animated.View>

      {/* CEFR Levels Grid */}
      <View style={styles.levelsContainer}>
        {CEFR_LEVELS.map((levelData, index) => (
          <Animated.View
            key={levelData.level}
            entering={FadeInLeft.delay(400 + index * 100)}
          >
            <ModernCard 
              variant={levelData.color as any} 
              pressable={false} 
              delay={0}
              style={styles.levelCard}
            >
              <View style={styles.levelHeader}>
                <View style={styles.levelTitleContainer}>
                  <ThemedText style={styles.levelEmoji}>{levelData.emoji}</ThemedText>
                  <View>
                    <ThemedText style={styles.levelCode}>{levelData.level}</ThemedText>
                    <ThemedText style={styles.levelName}>{levelData.name}</ThemedText>
                  </View>
                </View>
              </View>
              
              <ThemedText style={styles.levelDescription}>
                {levelData.description}
              </ThemedText>
              
              <View style={styles.examplesContainer}>
                <ThemedText style={styles.examplesTitle}>Example words:</ThemedText>
                <View style={styles.examplesRow}>
                  {levelData.examples.map((example, idx) => (
                    <View key={idx} style={styles.exampleTag}>
                      <ThemedText style={styles.exampleText}>{example}</ThemedText>
                    </View>
                  ))}
                </View>
              </View>
            </ModernCard>
          </Animated.View>
        ))}
      </View>

      {/* Information Card */}
      <Animated.View entering={FadeInUp.delay(1000)}>
        <ModernCard variant="glass" pressable={false} glassEffect delay={0}>
          <ThemedText style={styles.infoTitle}>📋 How it works:</ThemedText>
          <View style={styles.infoContent}>
            <ThemedText style={styles.infoItem}>
              🎯 <ThemedText style={styles.infoText}>Choose your current level based on your abilities</ThemedText>
            </ThemedText>
            <ThemedText style={styles.infoItem}>
              🚀 <ThemedText style={styles.infoText}>Set a target level for your learning goals</ThemedText>
            </ThemedText>
            <ThemedText style={styles.infoItem}>
              📚 <ThemedText style={styles.infoText}>Practice vocabulary appropriate for your level</ThemedText>
            </ThemedText>
            <ThemedText style={styles.infoItem}>
              📈 <ThemedText style={styles.infoText}>Progress naturally through increasing difficulty</ThemedText>
            </ThemedText>
          </View>
        </ModernCard>
      </Animated.View>

      {/* Action Buttons */}
      <Animated.View 
        style={styles.actionsContainer}
        entering={FadeInDown.delay(1100)}
      >
        <ModernButton
          title="Choose My Level"
          onPress={onNext}
          variant="primary"
          size="lg"
          icon="🎯"
          style={styles.primaryButton}
        />
        
        <View style={styles.secondaryActions}>
          <ModernButton
            title="Back"
            onPress={onBack}
            variant="neutral"
            size="md"
            style={styles.backButton}
          />
          
          <ModernButton
            title="Skip"
            onPress={onSkip}
            variant="secondary"
            size="md"
            style={styles.skipButton}
          />
        </View>
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
  titleSection: {
    alignItems: 'center',
    paddingVertical: Spacing.lg,
  },
  titleEmoji: {
    fontSize: 48,
    marginBottom: Spacing.md,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    lineHeight: 22,
    fontWeight: '500',
  },
  levelsContainer: {
    gap: Spacing.md,
    marginVertical: Spacing.lg,
  },
  levelCard: {
    marginVertical: 0,
  },
  levelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  levelTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  levelEmoji: {
    fontSize: 24,
    marginRight: Spacing.sm,
  },
  levelCode: {
    fontSize: 20,
    fontWeight: '800',
    color: '#ffffff',
  },
  levelName: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '600',
  },
  levelDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 20,
    marginBottom: Spacing.md,
    fontWeight: '400',
  },
  examplesContainer: {
    marginTop: Spacing.xs,
  },
  examplesTitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: Spacing.xs,
    fontWeight: '600',
  },
  examplesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  exampleTag: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    borderRadius: 8,
  },
  exampleText: {
    fontSize: 11,
    color: '#ffffff',
    fontWeight: '500',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: Spacing.md,
  },
  infoContent: {
    gap: Spacing.sm,
  },
  infoItem: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 20,
    fontWeight: '600',
  },
  infoText: {
    fontWeight: '400',
  },
  actionsContainer: {
    marginTop: Spacing.xl,
    gap: Spacing.md,
  },
  primaryButton: {
    marginBottom: Spacing.sm,
  },
  secondaryActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  backButton: {
    flex: 1,
  },
  skipButton: {
    flex: 1,
  },
});