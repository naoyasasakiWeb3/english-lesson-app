import DashboardStats from '@/components/DashboardStats';
import LevelProgress from '@/components/LevelProgress';
import QuickActions from '@/components/QuickActions';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import WeeklyProgress from '@/components/WeeklyProgress';
import { ModernColors } from '@/constants/ModernColors';
import { useAppStore } from '@/store/useAppStore';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function DashboardScreen() {
  const { initialize, isLoading, progress, userSettings } = useAppStore();

  useEffect(() => {
    initialize();
  }, []);

  if (isLoading) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText type="title">Loading...</ThemedText>
      </ThemedView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <LinearGradient
        colors={ModernColors.gradients.light as [string, string, ...string[]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientBackground}
      >
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
          <Animated.View entering={FadeIn} style={styles.content}>
            <ThemedView style={styles.header}>
              <ThemedText type="title" style={styles.mainTitle}>Dashboard</ThemedText>
              <ThemedText style={styles.subtitle}>
                Track your vocabulary learning progress
              </ThemedText>
            </ThemedView>

            <DashboardStats stats={progress.todayStats} goals={userSettings} />
            
            <WeeklyProgress data={progress.weeklyData} />
            
            <LevelProgress level={progress.level} xp={progress.xp} />
            
            <QuickActions />
          </Animated.View>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  gradientBackground: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  mainTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  subtitle: {
    textAlign: 'center',
    marginTop: 10,
    opacity: 0.7,
    color: '#ffffff',
  },
});
