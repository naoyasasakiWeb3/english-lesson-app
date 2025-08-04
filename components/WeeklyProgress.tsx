import React from 'react';
import { StyleSheet, View } from 'react-native';
import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';
import { DashboardData } from '@/types';

interface Props {
  data: DashboardData['weeklyProgress'];
}

export default function WeeklyProgress({ data }: Props) {
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const maxStudyTime = Math.max(...data.studyTimes, 1);

  // Safety check for data
  if (!data.days || data.days.length === 0) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText type="subtitle" style={styles.title} lightColor="#000000" darkColor="#FFFFFF">Weekly Progress</ThemedText>
        <ThemedText style={styles.noDataText} lightColor="#666666" darkColor="#CCCCCC">
          No data available yet. Start learning to see your progress!
        </ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="subtitle" style={styles.title} lightColor="#000000" darkColor="#FFFFFF">Weekly Progress</ThemedText>
      
      <View style={styles.chart}>
        {data.days.map((day, index) => {
          // Safety check for each day
          if (!day || typeof day.getDay !== 'function') {
            return null;
          }
          
          const height = (data.studyTimes[index] / maxStudyTime) * 80;
          const dayName = dayNames[day.getDay()];
          
          return (
            <View key={index} style={styles.dayColumn}>
              <View style={styles.barContainer}>
                <View 
                  style={[
                    styles.bar, 
                    { 
                      height: height || 4,
                      backgroundColor: data.studyTimes[index] > 0 ? '#4CAF50' : '#e0e0e0'
                    }
                  ]} 
                />
              </View>
              <ThemedText style={styles.dayLabel} lightColor="#000000" darkColor="#FFFFFF">{dayName}</ThemedText>
              <ThemedText style={styles.timeLabel} lightColor="#666666" darkColor="#CCCCCC">{data.studyTimes[index]}m</ThemedText>
            </View>
          );
        })}
      </View>

      <View style={styles.accuracySection}>
        <ThemedText style={styles.accuracyTitle} lightColor="#000000" darkColor="#FFFFFF">Weekly Accuracy</ThemedText>
        <View style={styles.accuracyBars}>
          {data.accuracies.map((accuracy, index) => (
            <View key={index} style={styles.accuracyBar}>
              <View 
                style={[
                  styles.accuracyFill,
                  { 
                    width: `${accuracy}%`,
                    backgroundColor: accuracy >= 80 ? '#4CAF50' : accuracy >= 60 ? '#FF9800' : '#F44336'
                  }
                ]}
              />
            </View>
          ))}
        </View>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 25,
    padding: 20,
    borderRadius: 12,
    backgroundColor: '#f8f9fa',
  },
  title: {
    textAlign: 'center',
    marginBottom: 20,
  },
  chart: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 120,
    marginBottom: 20,
  },
  dayColumn: {
    flex: 1,
    alignItems: 'center',
  },
  barContainer: {
    height: 80,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  bar: {
    width: 20,
    backgroundColor: '#4CAF50',
    borderRadius: 2,
    minHeight: 4,
  },
  dayLabel: {
    fontSize: 12,
    marginTop: 8,
    fontWeight: '600',
  },
  timeLabel: {
    fontSize: 10,
    opacity: 0.7,
    marginTop: 2,
  },
  accuracySection: {
    marginTop: 15,
  },
  accuracyTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 10,
  },
  accuracyBars: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  accuracyBar: {
    flex: 1,
    height: 6,
    backgroundColor: '#e0e0e0',
    borderRadius: 3,
    marginHorizontal: 2,
    overflow: 'hidden',
  },
  accuracyFill: {
    height: '100%',
    borderRadius: 3,
  },
  noDataText: {
    textAlign: 'center',
    padding: 20,
    fontSize: 16,
    fontStyle: 'italic',
  },
});