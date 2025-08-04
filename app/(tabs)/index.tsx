import DashboardStats from '@/components/DashboardStats';
import LevelProgress from '@/components/LevelProgress';
import QuickActions from '@/components/QuickActions';
import WeeklyProgress from '@/components/WeeklyProgress';
import ModernScreenLayout from '@/components/layout/ModernScreenLayout';
import { ThemedView } from '@/components/ThemedView';
import { useAppStore } from '@/store/useAppStore';
import React, { useEffect } from 'react';

export default function DashboardScreen() {
  const { initialize, isLoading, progress, userSettings } = useAppStore();

  useEffect(() => {
    initialize();
  }, []);

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

