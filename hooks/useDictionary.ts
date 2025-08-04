import { useState, useEffect } from 'react';
import { dictionaryApiService } from '@/services/dictionaryApi';
import { WordData } from '@/types';

interface UseDictionaryResult {
  wordData: WordData | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useDictionary(word: string): UseDictionaryResult {
  const [wordData, setWordData] = useState<WordData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchWordData = async () => {
    if (!word) return;

    setLoading(true);
    setError(null);

    try {
      const data = await dictionaryApiService.getWordDefinitionOfflineFirst(word);
      setWordData(data);
      
      if (!data) {
        setError('Word not found in dictionary');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setWordData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWordData();
  }, [word]);

  return {
    wordData,
    loading,
    error,
    refetch: fetchWordData,
  };
}

interface UseMultipleDictionaryResult {
  wordsData: Map<string, WordData>;
  loading: boolean;
  error: string | null;
  fetchWords: (words: string[]) => Promise<void>;
}

export function useMultipleDictionary(): UseMultipleDictionaryResult {
  const [wordsData, setWordsData] = useState<Map<string, WordData>>(new Map());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchWords = async (words: string[]) => {
    if (!words.length) return;

    setLoading(true);
    setError(null);

    try {
      const data = await dictionaryApiService.getMultipleWords(words);
      setWordsData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return {
    wordsData,
    loading,
    error,
    fetchWords,
  };
}

interface UseDictionaryCacheResult {
  cacheStats: { count: number; size: string } | null;
  clearCache: () => Promise<void>;
  refreshStats: () => Promise<void>;
}

export function useDictionaryCache(): UseDictionaryCacheResult {
  const [cacheStats, setCacheStats] = useState<{ count: number; size: string } | null>(null);

  const refreshStats = async () => {
    try {
      const stats = await dictionaryApiService.getCacheStats();
      setCacheStats(stats);
    } catch (error) {
      console.error('Error getting cache stats:', error);
    }
  };

  const clearCache = async () => {
    try {
      await dictionaryApiService.clearCache();
      await refreshStats();
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  };

  useEffect(() => {
    refreshStats();
  }, []);

  return {
    cacheStats,
    clearCache,
    refreshStats,
  };
}