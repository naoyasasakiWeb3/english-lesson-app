import DashboardStats from '@/components/DashboardStats';
import ModernScreenLayout from '@/components/layout/ModernScreenLayout';
import LevelProgress from '@/components/LevelProgress';
import QuickActions from '@/components/QuickActions';
import { ThemedView } from '@/components/ThemedView';
import WeeklyProgress from '@/components/WeeklyProgress';
import { databaseService } from '@/services/database';
import { useAppStore } from '@/store/useAppStore';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useEffect } from 'react';

export default function DashboardScreen() {
  const { initialize, updateProgress, isLoading, progress, userSettings } = useAppStore();

  useEffect(() => {
    initialize();
  }, []);

  // タブがアクティブになったときにデータをリフレッシュ
  useFocusEffect(
    useCallback(() => {
      console.log('Dashboard tab focused - checking database status');
      if (databaseService.isInitialized()) {
        console.log('Database initialized - refreshing data');
        updateProgress();
      } else {
        console.log('Database not yet initialized - skipping refresh');
      }
    }, [updateProgress])
  );

  if (isLoading) {
    return (
      <ModernScreenLayout title="Loading...">
        <ThemedView />
      </ModernScreenLayout>
    );
  }

  return (
    <ModernScreenLayout 
      title="Dashboard"
      subtitle="Track your vocabulary learning progress"
    >
      <DashboardStats stats={progress.todayStats} goals={userSettings} />
      <WeeklyProgress data={progress.weeklyData} />
      <LevelProgress level={progress.level} xp={progress.xp} />
      <QuickActions />
    </ModernScreenLayout>
  );
}

