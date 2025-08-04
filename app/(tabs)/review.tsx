import React, { useEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';
import ReviewSection from '@/components/ReviewSection';
import ModernScreenLayout from '@/components/layout/ModernScreenLayout';

export default function ReviewScreen() {
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
      title="Review Words"
      subtitle="Review your bookmarked and challenging words"
    >
      <ReviewSection />
    </ModernScreenLayout>
  );
}

