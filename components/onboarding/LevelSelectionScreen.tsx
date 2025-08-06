import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import Animated, { 
  FadeInDown, 
  FadeInLeft, 
  FadeInUp 
} from 'react-native-reanimated';
import { ThemedText } from '../ThemedText';
import ModernCard from '../layout/ModernCard';
import ModernButton from '../modern/ModernButton';
import { Spacing, BorderRadius } from '../../constants/ModernColors';

interface LevelSelectionScreenProps {
  onNext: () => void;
  onBack: () => void;
  currentLevel?: string;
  targetLevel?: string;
  onLevelsSelected: (currentLevel: string, targetLevel: string) => void;
}

const CEFR_LEVELS = [
  { 
    code: 'A1', 
    name: 'Beginner', 
    description: 'Basic words and simple phrases',
    color: 'success',
    emoji: '🌱'
  },
  { 
    code: 'A2', 
    name: 'Elementary', 
    description: 'Simple sentences about familiar topics',
    color: 'primary',
    emoji: '🌿'
  },
  { 
    code: 'B1', 
    name: 'Intermediate', 
    description: 'Standard input on familiar matters',
    color: 'secondary',
    emoji: '🌳'
  },
  { 
    code: 'B2', 
    name: 'Upper-Intermediate', 
    description: 'Complex texts and abstract topics',
    color: 'warning',
    emoji: '🌲'
  },
  { 
    code: 'C1', 
    name: 'Advanced', 
    description: 'Wide range of demanding texts',
    color: 'error',
    emoji: '🏔️'
  },
  { 
    code: 'C2', 
    name: 'Proficient', 
    description: 'Effortless understanding of virtually everything',
    color: 'neutral',
    emoji: '⭐'
  }
];

export default function LevelSelectionScreen({ 
  onNext, 
  onBack, 
  currentLevel, 
  targetLevel, 
  onLevelsSelected 
}: LevelSelectionScreenProps) {
  const [selectedCurrentLevel, setSelectedCurrentLevel] = useState(currentLevel || '');
  const [selectedTargetLevel, setSelectedTargetLevel] = useState(targetLevel || '');

  const handleCurrentLevelSelect = (level: string) => {
    setSelectedCurrentLevel(level);
    
    // Auto-adjust target level if it's lower than current level
    if (selectedTargetLevel) {
      const currentIndex = CEFR_LEVELS.findIndex(l => l.code === level);
      const targetIndex = CEFR_LEVELS.findIndex(l => l.code === selectedTargetLevel);
      
      if (targetIndex <= currentIndex) {
        const suggestedTarget = currentIndex < CEFR_LEVELS.length - 1 
          ? CEFR_LEVELS[currentIndex + 1].code
          : level;
        setSelectedTargetLevel(suggestedTarget);
      }
    }
  };

  const handleTargetLevelSelect = (level: string) => {
    if (selectedCurrentLevel) {
      const currentIndex = CEFR_LEVELS.findIndex(l => l.code === selectedCurrentLevel);
      const targetIndex = CEFR_LEVELS.findIndex(l => l.code === level);
      
      if (targetIndex < currentIndex) {
        Alert.alert(
          'Invalid Selection',
          'Your target level should be equal to or higher than your current level.'
        );
        return;
      }
    }
    
    setSelectedTargetLevel(level);
  };

  const handleNext = () => {
    if (!selectedCurrentLevel || !selectedTargetLevel) {
      Alert.alert(
        'Incomplete Selection',
        'Please select both your current level and target level to continue.'
      );
      return;
    }
    
    onLevelsSelected(selectedCurrentLevel, selectedTargetLevel);
    onNext();
  };

  const getLevelData = (code: string) => {
    return CEFR_LEVELS.find(l => l.code === code);
  };

  const isValidTargetLevel = (targetCode: string) => {
    if (!selectedCurrentLevel) return true;
    
    const currentIndex = CEFR_LEVELS.findIndex(l => l.code === selectedCurrentLevel);
    const targetIndex = CEFR_LEVELS.findIndex(l => l.code === targetCode);
    
    return targetIndex >= currentIndex;
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Title Section */}
      <Animated.View 
        style={styles.titleSection}
        entering={FadeInUp.delay(200)}
      >
        <ThemedText style={styles.titleEmoji}>🎯</ThemedText>
        <ThemedText style={styles.title}>Choose Your Levels</ThemedText>
        <ThemedText style={styles.subtitle}>
          Select your current ability and learning goal
        </ThemedText>
      </Animated.View>

      {/* Current Level Selection */}
      <Animated.View 
        entering={FadeInLeft.delay(400)}
        style={styles.sectionContainer}
      >
        <ModernCard variant="primary" pressable={false} delay={0}>
          <ThemedText style={styles.sectionTitle}>
            📍 Current Level
          </ThemedText>
          <ThemedText style={styles.sectionDescription}>
            Where are you now? Be honest about your current English ability.
          </ThemedText>
          
          <View style={styles.levelsGrid}>
            {CEFR_LEVELS.map((level, index) => (
              <Animated.View
                key={level.code}
                entering={FadeInDown.delay(600 + index * 50)}
              >
                <ModernCard
                  variant={selectedCurrentLevel === level.code ? level.color as any : 'neutral'}
                  onPress={() => handleCurrentLevelSelect(level.code)}
                  style={[
                    styles.levelCard,
                    selectedCurrentLevel === level.code && styles.selectedLevelCard
                  ]}
                  delay={0}
                >
                  <View style={styles.levelContent}>
                    <ThemedText style={styles.levelEmoji}>{level.emoji}</ThemedText>
                    <View style={styles.levelInfo}>
                      <ThemedText style={styles.levelCode}>{level.code}</ThemedText>
                      <ThemedText style={styles.levelName}>{level.name}</ThemedText>
                      <ThemedText style={styles.levelDescription}>
                        {level.description}
                      </ThemedText>
                    </View>
                    {selectedCurrentLevel === level.code && (
                      <ThemedText style={styles.checkmark}>✓</ThemedText>
                    )}
                  </View>
                </ModernCard>
              </Animated.View>
            ))}
          </View>
        </ModernCard>
      </Animated.View>

      {/* Target Level Selection */}
      <Animated.View 
        entering={FadeInLeft.delay(800)}
        style={styles.sectionContainer}
      >
        <ModernCard variant="secondary" pressable={false} delay={0}>
          <ThemedText style={styles.sectionTitle}>
            🚀 Target Level
          </ThemedText>
          <ThemedText style={styles.sectionDescription}>
            Where do you want to be? Set a challenging but achievable goal.
          </ThemedText>
          
          <View style={styles.levelsGrid}>
            {CEFR_LEVELS.map((level, index) => {
              const isValid = isValidTargetLevel(level.code);
              const isDisabled = !isValid;
              
              return (
                <Animated.View
                  key={level.code}
                  entering={FadeInDown.delay(1000 + index * 50)}
                >
                  <ModernCard
                    variant={selectedTargetLevel === level.code ? level.color as any : 'neutral'}
                    onPress={isDisabled ? undefined : () => handleTargetLevelSelect(level.code)}
                    style={[
                      styles.levelCard,
                      selectedTargetLevel === level.code && styles.selectedLevelCard,
                      isDisabled && styles.disabledLevelCard
                    ]}
                    delay={0}
                    pressable={!isDisabled}
                  >
                    <View style={[styles.levelContent, isDisabled && styles.disabledContent]}>
                      <ThemedText style={[styles.levelEmoji, isDisabled && styles.disabledText]}>
                        {level.emoji}
                      </ThemedText>
                      <View style={styles.levelInfo}>
                        <ThemedText style={[styles.levelCode, isDisabled && styles.disabledText]}>
                          {level.code}
                        </ThemedText>
                        <ThemedText style={[styles.levelName, isDisabled && styles.disabledText]}>
                          {level.name}
                        </ThemedText>
                        <ThemedText style={[styles.levelDescription, isDisabled && styles.disabledText]}>
                          {level.description}
                        </ThemedText>
                      </View>
                      {selectedTargetLevel === level.code && (
                        <ThemedText style={styles.checkmark}>✓</ThemedText>
                      )}
                    </View>
                  </ModernCard>
                </Animated.View>
              );
            })}
          </View>
        </ModernCard>
      </Animated.View>

      {/* Selected Levels Summary */}
      {(selectedCurrentLevel || selectedTargetLevel) && (
        <Animated.View entering={FadeInUp.delay(1400)}>
          <ModernCard variant="glass" pressable={false} glassEffect delay={0}>
            <ThemedText style={styles.summaryTitle}>📋 Your Selection:</ThemedText>
            
            <View style={styles.summaryContent}>
              {selectedCurrentLevel && (
                <View style={styles.summaryItem}>
                  <ThemedText style={styles.summaryLabel}>Current Level:</ThemedText>
                  <View style={styles.summaryBadge}>
                    <ThemedText style={styles.summaryBadgeText}>
                      {selectedCurrentLevel} - {getLevelData(selectedCurrentLevel)?.name}
                    </ThemedText>
                  </View>
                </View>
              )}
              
              {selectedTargetLevel && (
                <View style={styles.summaryItem}>
                  <ThemedText style={styles.summaryLabel}>Target Level:</ThemedText>
                  <View style={styles.summaryBadge}>
                    <ThemedText style={styles.summaryBadgeText}>
                      {selectedTargetLevel} - {getLevelData(selectedTargetLevel)?.name}
                    </ThemedText>
                  </View>
                </View>
              )}
            </View>
          </ModernCard>
        </Animated.View>
      )}

      {/* Action Buttons */}
      <Animated.View 
        style={styles.actionsContainer}
        entering={FadeInDown.delay(1500)}
      >
        <ModernButton
          title="Continue"
          onPress={handleNext}
          variant="primary"
          size="lg"
          icon="✨"
          style={styles.primaryButton}
          disabled={!selectedCurrentLevel || !selectedTargetLevel}
        />
        
        <ModernButton
          title="Back"
          onPress={onBack}
          variant="neutral"
          size="md"
          style={styles.backButton}
        />
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
  sectionContainer: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: Spacing.sm,
  },
  sectionDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 20,
    marginBottom: Spacing.lg,
    fontWeight: '400',
  },
  levelsGrid: {
    gap: Spacing.sm,
  },
  levelCard: {
    marginVertical: 0,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedLevelCard: {
    borderColor: 'rgba(255, 255, 255, 0.5)',
    transform: [{ scale: 1.02 }],
  },
  disabledLevelCard: {
    opacity: 0.4,
  },
  levelContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  disabledContent: {
    opacity: 0.6,
  },
  levelEmoji: {
    fontSize: 24,
    marginRight: Spacing.md,
  },
  levelInfo: {
    flex: 1,
  },
  levelCode: {
    fontSize: 18,
    fontWeight: '800',
    color: '#ffffff',
  },
  levelName: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '600',
  },
  levelDescription: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 2,
    fontWeight: '400',
  },
  disabledText: {
    color: 'rgba(255, 255, 255, 0.3)',
  },
  checkmark: {
    fontSize: 24,
    color: '#2ecc71',
    fontWeight: '700',
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  summaryContent: {
    gap: Spacing.md,
  },
  summaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '600',
  },
  summaryBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  summaryBadgeText: {
    fontSize: 14,
    color: '#ffffff',
    fontWeight: '600',
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
});