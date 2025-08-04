import { useState, useEffect, useCallback } from 'react';
import { audioService, AudioSettings } from '@/services/audioService';

interface UseAudioResult {
  isPlaying: boolean;
  settings: AudioSettings;
  playWord: (word: string, audioUrl?: string) => Promise<void>;
  speakWord: (word: string, options?: { accent?: 'us' | 'uk'; speed?: number }) => Promise<void>;
  stopAudio: () => Promise<void>;
  updateSettings: (newSettings: Partial<AudioSettings>) => Promise<void>;
  loading: boolean;
}

export function useAudio(): UseAudioResult {
  const [isPlaying, setIsPlaying] = useState(false);
  const [settings, setSettings] = useState<AudioSettings>(audioService.getSettings());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Load initial settings
    setSettings(audioService.getSettings());
  }, []);

  const playWord = useCallback(async (word: string, audioUrl?: string) => {
    try {
      setLoading(true);
      setIsPlaying(true);
      
      await audioService.playWordPronunciation(word, audioUrl);
      
      // Set a timeout to reset playing state (approximate duration)
      setTimeout(() => {
        setIsPlaying(false);
      }, word.length * 200 + 1000); // Rough estimate based on word length
      
    } catch (error) {
      console.error('Error playing word:', error);
      setIsPlaying(false);
    } finally {
      setLoading(false);
    }
  }, []);

  const speakWord = useCallback(async (
    word: string, 
    options?: { accent?: 'us' | 'uk'; speed?: number }
  ) => {
    try {
      setLoading(true);
      setIsPlaying(true);
      
      await audioService.speakWord(word, {
        ...options,
        onDone: () => setIsPlaying(false),
      });
      
    } catch (error) {
      console.error('Error speaking word:', error);
      setIsPlaying(false);
    } finally {
      setLoading(false);
    }
  }, []);

  const stopAudio = useCallback(async () => {
    try {
      await audioService.stopAudio();
      await audioService.stopSpeech();
      setIsPlaying(false);
    } catch (error) {
      console.error('Error stopping audio:', error);
    }
  }, []);

  const updateSettings = useCallback(async (newSettings: Partial<AudioSettings>) => {
    try {
      await audioService.saveSettings(newSettings);
      setSettings(audioService.getSettings());
    } catch (error) {
      console.error('Error updating audio settings:', error);
    }
  }, []);

  return {
    isPlaying,
    settings,
    playWord,
    speakWord,
    stopAudio,
    updateSettings,
    loading,
  };
}

interface UseAudioCacheResult {
  cacheStats: { count: number; size: string } | null;
  clearCache: () => Promise<void>;
  refreshStats: () => Promise<void>;
}

export function useAudioCache(): UseAudioCacheResult {
  const [cacheStats, setCacheStats] = useState<{ count: number; size: string } | null>(null);

  const refreshStats = useCallback(async () => {
    try {
      const stats = await audioService.getAudioCacheStats();
      setCacheStats(stats);
    } catch (error) {
      console.error('Error getting audio cache stats:', error);
    }
  }, []);

  const clearCache = useCallback(async () => {
    try {
      await audioService.clearAudioCache();
      await refreshStats();
    } catch (error) {
      console.error('Error clearing audio cache:', error);
    }
  }, [refreshStats]);

  useEffect(() => {
    refreshStats();
  }, [refreshStats]);

  return {
    cacheStats,
    clearCache,
    refreshStats,
  };
}