import { BorderRadius, ModernColors, Spacing } from '@/constants/ModernColors';
import { DashboardData, LearningGoals } from '@/types';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { ThemedText } from './ThemedText';
import ModernCard from './layout/ModernCard';

interface Props {
  stats: DashboardData['todayStats'];
  goals: LearningGoals;
}

export default function DashboardStats({ stats, goals }: Props) {
  const studyProgress = Math.min((stats.studyTime / goals.dailyStudyTimeMinutes) * 100, 100);
  const wordsProgress = Math.min((stats.wordsStudied / goals.dailyWordCount) * 100, 100);

  return (
    <View style={styles.container}>
      <Animated.View entering={FadeInUp.delay(100)}>
        <ThemedText type="subtitle" style={styles.title}>Today&apos;s Progress</ThemedText>
      </Animated.View>
      
      <View style={styles.statsGrid}>
        <Animated.View entering={FadeInDown.delay(200)} style={styles.statCardWrapper}>
          <ModernCard variant="primary" glassEffect={true}>
            <View style={styles.modernStatCard}>
              <View style={styles.progressContainer}>
                <View style={styles.progressRing}>
                  <Animated.View 
                    style={[styles.progressFill, { width: `${studyProgress}%` }]} 
                    entering={FadeInDown.delay(300)}
                  />
                </View>
                <ThemedText style={styles.progressText}>{Math.round(studyProgress)}%</ThemedText>
              </View>
              <ThemedText style={styles.statValue}>{stats.studyTime}min</ThemedText>
              <ThemedText style={styles.statLabel}>of {goals.dailyStudyTimeMinutes}min goal</ThemedText>
            </View>
          </ModernCard>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(300)} style={styles.statCardWrapper}>
          <ModernCard variant="success">
            <View style={styles.modernStatCard}>
              <View style={styles.progressContainer}>
                <View style={styles.progressRing}>
                  <Animated.View 
                    style={[styles.progressFill, { width: `${wordsProgress}%` }]} 
                    entering={FadeInDown.delay(400)}
                  />
                </View>
                <ThemedText style={styles.progressText}>{Math.round(wordsProgress)}%</ThemedText>
              </View>
              <ThemedText style={styles.statValue}>{stats.wordsStudied}</ThemedText>
              <ThemedText style={styles.statLabel}>of {goals.dailyWordCount} words</ThemedText>
            </View>
          </ModernCard>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(400)} style={styles.statCardWrapper}>
          <ModernCard variant="warning">
            <View style={styles.modernStatCard}>
              <ThemedText style={styles.statValue}>{stats.streak}</ThemedText>
              <ThemedText style={styles.statLabel}>Day Streak</ThemedText>
            </View>
          </ModernCard>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(500)} style={styles.statCardWrapper}>
          <ModernCard variant="secondary">
            <View style={styles.modernStatCard}>
              <ThemedText style={styles.statValue}>{stats.accuracy}%</ThemedText>
              <ThemedText style={styles.statLabel}>Accuracy</ThemedText>
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
    marginBottom: Spacing.md,
    fontSize: 24,
    fontWeight: '700',
    color: ModernColors.gray[800],
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  statCardWrapper: {
    width: '48%',
    marginBottom: Spacing.sm,
  },
  modernStatCard: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120,
  },
  progressContainer: {
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  progressRing: {
    width: 80,
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: BorderRadius.full,
    marginBottom: Spacing.xs,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#ffffff',
    borderRadius: BorderRadius.full,
  },
  progressText: {
    fontSize: 12,
    color: '#ffffff',
    fontWeight: '600',
  },
  iconContainer: {
    marginBottom: Spacing.sm,
  },
  statIcon: {
    fontSize: 32,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: Spacing.xs,
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});