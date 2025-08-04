import React, { useEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';
import SettingsForm from '@/components/SettingsForm';
import ModernScreenLayout from '@/components/layout/ModernScreenLayout';

export default function SettingsScreen() {
  const { initialize, isLoading } = useAppStore();

  useEffect(() => {
    initialize();
  }, []);

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

