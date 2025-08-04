import { BorderRadius, ShadowStyles, Spacing } from '@/constants/ModernColors';
import { DashboardData } from '@/types';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { ThemedText } from './ThemedText';
import ModernCard from './layout/ModernCard';

interface Props {
  data: DashboardData['weeklyProgress'];
}

export default function WeeklyProgress({ data }: Props) {
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const maxStudyTime = Math.max(...data.studyTimes, 1);

  // Safety check for data
  if (!data.days || data.days.length === 0) {
    return (
      <Animated.View entering={FadeInUp.delay(400)}>
        <ModernCard 
          variant="secondary"
          pressable={false}
          style={styles.modernContainer}
        >
          <ThemedText type="subtitle" style={styles.modernTitle}>Weekly Progress</ThemedText>
          <ThemedText style={styles.modernNoDataText}>
            No data available yet. Start learning to see your progress!
          </ThemedText>
        </ModernCard>
      </Animated.View>
    );
  }

  return (
    <Animated.View entering={FadeInUp.delay(400)}>
      <ModernCard 
        variant="secondary"
        pressable={false}
        style={styles.modernContainer}
      >
        <ThemedText type="subtitle" style={styles.modernTitle}>Weekly Progress</ThemedText>
        
        <View style={styles.modernChart}>
          {data.days.map((day, index) => {
            // Safety check for each day
            if (!day || typeof day.getDay !== 'function') {
              return null;
            }
            
            const height = (data.studyTimes[index] / maxStudyTime) * 80;
            const dayName = dayNames[day.getDay()];
            
            return (
              <Animated.View key={index} entering={FadeInDown.delay(500 + index * 100)} style={styles.modernDayColumn}>
                <View style={styles.modernBarContainer}>
                  <Animated.View 
                    style={[
                      styles.modernBar, 
                      { 
                        height: height || 4,
                        backgroundColor: data.studyTimes[index] > 0 ? '#ffffff' : 'rgba(255, 255, 255, 0.3)'
                      }
                    ]} 
                    entering={FadeInUp.delay(600 + index * 100)}
                  />
                </View>
                <ThemedText style={styles.modernDayLabel}>{dayName}</ThemedText>
                <ThemedText style={styles.modernTimeLabel}>{data.studyTimes[index]}m</ThemedText>
              </Animated.View>
            );
          })}
        </View>

        <Animated.View entering={FadeInUp.delay(800)} style={styles.modernAccuracySection}>
          <ThemedText style={styles.modernAccuracyTitle}>Weekly Accuracy</ThemedText>
          <View style={styles.modernAccuracyBars}>
            {data.accuracies.map((accuracy, index) => (
              <Animated.View key={index} entering={FadeInDown.delay(900 + index * 50)} style={styles.modernAccuracyBar}>
                <Animated.View 
                  style={[
                    styles.modernAccuracyFill,
                    { 
                      width: `${accuracy}%`,
                      backgroundColor: accuracy >= 80 ? '#ffffff' : accuracy >= 60 ? 'rgba(255, 255, 255, 0.8)' : 'rgba(255, 255, 255, 0.6)'
                    }
                  ]}
                  entering={FadeInDown.delay(1000 + index * 50)}
                />
              </Animated.View>
            ))}
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
  modernChart: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 120,
    marginBottom: Spacing.lg,
  },
  modernDayColumn: {
    flex: 1,
    alignItems: 'center',
  },
  modernBarContainer: {
    height: 80,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  modernBar: {
    width: 24,
    borderRadius: BorderRadius.sm,
    minHeight: 4,
    ...ShadowStyles.small,
  },
  modernDayLabel: {
    fontSize: 14,
    marginTop: Spacing.xs,
    fontWeight: '700',
    color: '#ffffff',
  },
  modernTimeLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
    fontWeight: '500',
  },
  modernAccuracySection: {
    marginTop: Spacing.md,
  },
  modernAccuracyTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: Spacing.sm,
    color: '#ffffff',
  },
  modernAccuracyBars: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.xs,
  },
  modernAccuracyBar: {
    flex: 1,
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: BorderRadius.sm,
    overflow: 'hidden',
    ...ShadowStyles.small,
  },
  modernAccuracyFill: {
    height: '100%',
    borderRadius: BorderRadius.sm,
    ...ShadowStyles.small,
  },
  modernNoDataText: {
    textAlign: 'center',
    padding: Spacing.lg,
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
  },
});