import SettingsForm from '@/components/SettingsForm';
import ModernScreenLayout from '@/components/layout/ModernScreenLayout';
import { databaseService } from '@/services/database';
import { useAppStore } from '@/store/useAppStore';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useEffect } from 'react';

export default function SettingsScreen() {
  const { initialize, updateProgress, isLoading } = useAppStore();

  useEffect(() => {
    initialize();
  }, []);

  // タブがアクティブになったときにデータをリフレッシュ
  useFocusEffect(
    useCallback(() => {
      console.log('Settings tab focused - checking database status');
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
        <></>
      </ModernScreenLayout>
    );
  }

  return (
    <ModernScreenLayout 
      title="Settings"
      subtitle="Customize your learning experience"
    >
      <SettingsForm />
    </ModernScreenLayout>
  );
}

