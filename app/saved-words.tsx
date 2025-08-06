import React from 'react';
import { useRouter } from 'expo-router';
import ModernScreenLayout from '@/components/layout/ModernScreenLayout';
import SavedWordsScreen from '@/components/SavedWordsScreen';
import ModernButton from '@/components/modern/ModernButton';

export default function SavedWordsPage() {
  const router = useRouter();

  return (
    <ModernScreenLayout 
      title="Saved Words"
      subtitle="Words enriched with API data"
      headerActions={
        <ModernButton
          title="Back"
          onPress={() => router.back()}
          variant="neutral"
          size="sm"
          icon="←"
        />
      }
    >
      <SavedWordsScreen />
    </ModernScreenLayout>
  );
}