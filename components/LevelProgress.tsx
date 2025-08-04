import { BorderRadius, ShadowStyles, Spacing } from '@/constants/ModernColors';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInDown, FadeInLeft, FadeInRight, FadeInUp } from 'react-native-reanimated';
import { ThemedText } from './ThemedText';
import ModernCard from './layout/ModernCard';

interface Props {
  level: number;
  xp: number;
}

export default function LevelProgress({ level, xp }: Props) {
  const currentLevelXP = (level - 1) * 100;
  const nextLevelXP = level * 100;
  const progressXP = xp - currentLevelXP;
  const requiredXP = nextLevelXP - currentLevelXP;
  const progressPercentage = (progressXP / requiredXP) * 100;

  return (
    <Animated.View entering={FadeInUp.delay(500)}>
      <ModernCard 
        variant="warning"
        pressable={false}
        style={styles.modernContainer}
      >
        <ThemedText type="subtitle" style={styles.modernTitle}>Level Progress</ThemedText>
        
        <View style={styles.modernLevelInfo}>
          <Animated.View entering={FadeInLeft.delay(600)} style={styles.modernLevelBadge}>
            <ModernCard 
              variant="primary"
              pressable={false}
              style={styles.levelBadgeCard}
            >
              <ThemedText type="title" style={styles.modernLevelNumber}>{level}</ThemedText>
              <ThemedText style={styles.modernLevelLabel}>Level</ThemedText>
            </ModernCard>
          </Animated.View>
          
          <Animated.View entering={FadeInRight.delay(700)} style={styles.modernProgressInfo}>
            <ThemedText style={styles.modernXpText}>{progressXP} / {requiredXP} XP</ThemedText>
            <View style={styles.modernProgressBar}>
              <Animated.View 
                style={[
                  styles.modernProgressFill, 
                  { width: `${Math.min(progressPercentage, 100)}%` }
                ]} 
                entering={FadeInDown.delay(800)}
              />
            </View>
            <ThemedText style={styles.modernNextLevelText}>
              {requiredXP - progressXP} XP to Level {level + 1}
            </ThemedText>
          </Animated.View>
        </View>

        <Animated.View entering={FadeInUp.delay(900)} style={styles.modernAchievements}>
          <ThemedText style={styles.modernAchievementsTitle}>Recent Achievements</ThemedText>
          <View style={styles.modernBadgeContainer}>
            {level >= 2 && (
              <Animated.View entering={FadeInDown.delay(1000)}>
                <ModernCard 
                  variant="success"
                  pressable={false}
                  style={styles.modernAchievementBadge}
                  glassEffect={true}
                >
                  <ThemedText style={styles.modernBadgeEmoji}>🎯</ThemedText>
                  <ThemedText style={styles.modernBadgeText}>First Steps</ThemedText>
                </ModernCard>
              </Animated.View>
            )}
            {level >= 5 && (
              <Animated.View entering={FadeInDown.delay(1100)}>
                <ModernCard 
                  variant="error"
                  pressable={false}
                  style={styles.modernAchievementBadge}
                  glassEffect={true}
                >
                  <ThemedText style={styles.modernBadgeEmoji}>🔥</ThemedText>
                  <ThemedText style={styles.modernBadgeText}>Getting Hot</ThemedText>
                </ModernCard>
              </Animated.View>
            )}
            {level >= 10 && (
              <Animated.View entering={FadeInDown.delay(1200)}>
                <ModernCard 
                  variant="secondary"
                  pressable={false}
                  style={styles.modernAchievementBadge}
                  glassEffect={true}
                >
                  <ThemedText style={styles.modernBadgeEmoji}>⭐</ThemedText>
                  <ThemedText style={styles.modernBadgeText}>Star Learner</ThemedText>
                </ModernCard>
              </Animated.View>
            )}
          </View>
        </Animated.View>
      </ModernCard>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  modernContainer: {
    marginBottom: Spacing.lg,
  },
  modernTitle: {
    textAlign: 'center',
    marginBottom: Spacing.lg,
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
  },
  modernLevelInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  modernLevelBadge: {
    marginRight: Spacing.lg,
  },
  levelBadgeCard: {
    width: 90,
    height: 90,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 0,
  },
  modernLevelNumber: {
    color: '#ffffff',
    fontSize: 26,
    fontWeight: '800',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
    lineHeight: 30,
  },
  modernLevelLabel: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    lineHeight: 14,
  },
  modernProgressInfo: {
    flex: 1,
  },
  modernXpText: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: Spacing.xs,
    color: '#ffffff',
  },
  modernProgressBar: {
    height: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
    marginBottom: Spacing.xs,
    ...ShadowStyles.small,
  },
  modernProgressFill: {
    height: '100%',
    backgroundColor: '#ffffff',
    borderRadius: BorderRadius.full,
    ...ShadowStyles.small,
  },
  modernNextLevelText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
  },
  modernAchievements: {
    marginTop: Spacing.md,
  },
  modernAchievementsTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: Spacing.sm,
    color: '#ffffff',
  },
  modernBadgeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  modernAchievementBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    marginVertical: 0,
    minHeight: 36,
  },
  modernBadgeEmoji: {
    fontSize: 18,
    marginRight: Spacing.xs,
  },
  modernBadgeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
});