import { useEffect, useState } from 'react';
import { wordsApiService, WordDetails } from '../services/wordsApi';

export interface ApiStatus {
  configured: boolean;
  valid: boolean | null;
  loading: boolean;
  error?: string;
}

export function useWordsApiKey() {
  const [apiKey, setApiKeyState] = useState<string | null>(null);
  const [status, setStatus] = useState<ApiStatus>({
    configured: false,
    valid: null,
    loading: true
  });

  const loadApiStatus = async () => {
    try {
      setStatus(prev => ({ ...prev, loading: true }));
      
      const currentKey = await wordsApiService.getApiKey();
      setApiKeyState(currentKey);
      
      const apiStatus = await wordsApiService.getApiStatus();
      setStatus({
        configured: apiStatus.configured,
        valid: apiStatus.valid,
        loading: false,
        error: apiStatus.error
      });
    } catch (error) {
      setStatus({
        configured: false,
        valid: false,
        loading: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  const setApiKey = async (key: string): Promise<boolean> => {
    try {
      setStatus(prev => ({ ...prev, loading: true }));
      
      // Validate the key first
      const isValid = await wordsApiService.validateApiKey(key);
      
      if (isValid) {
        await wordsApiService.setApiKey(key);
        setApiKeyState(key);
        setStatus({
          configured: true,
          valid: true,
          loading: false
        });
        return true;
      } else {
        setStatus(prev => ({
          ...prev,
          loading: false,
          error: 'Invalid API key'
        }));
        return false;
      }
    } catch (error) {
      setStatus({
        configured: apiKey !== null,
        valid: false,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to set API key'
      });
      return false;
    }
  };

  const removeApiKey = async (): Promise<void> => {
    try {
      await wordsApiService.removeApiKey();
      setApiKeyState(null);
      setStatus({
        configured: false,
        valid: null,
        loading: false
      });
    } catch (error) {
      setStatus(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to remove API key'
      }));
    }
  };

  const validateApiKey = async (): Promise<boolean> => {
    try {
      setStatus(prev => ({ ...prev, loading: true }));
      const isValid = await wordsApiService.validateApiKey();
      setStatus(prev => ({
        ...prev,
        valid: isValid,
        loading: false,
        error: isValid ? undefined : 'API key validation failed'
      }));
      return isValid;
    } catch (error) {
      setStatus(prev => ({
        ...prev,
        valid: false,
        loading: false,
        error: error instanceof Error ? error.message : 'Validation error'
      }));
      return false;
    }
  };

  useEffect(() => {
    loadApiStatus();
  }, []);

  return {
    apiKey,
    status,
    setApiKey,
    removeApiKey,
    validateApiKey,
    refreshStatus: loadApiStatus
  };
}

export function useWordDetails(word: string | null) {
  const [wordDetails, setWordDetails] = useState<WordDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchWordDetails = async (targetWord: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const details = await wordsApiService.getWordDetails(targetWord);
      setWordDetails(details);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch word details');
      setWordDetails(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (word) {
      fetchWordDetails(word);
    } else {
      setWordDetails(null);
      setError(null);
    }
  }, [word]);

  return {
    wordDetails,
    loading,
    error,
    refetch: word ? () => fetchWordDetails(word) : undefined
  };
}

export function useWordEnrichment() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const enrichWord = async (word: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const enrichedData = await wordsApiService.enrichWordData(word);
      return enrichedData;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to enrich word data';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const enrichWords = async (words: string[]): Promise<{[word: string]: any}> => {
    try {
      setLoading(true);
      setError(null);
      
      const results: {[word: string]: any} = {};
      
      // Process words in batches to avoid rate limiting
      const batchSize = 5;
      for (let i = 0; i < words.length; i += batchSize) {
        const batch = words.slice(i, i + batchSize);
        
        const batchPromises = batch.map(async (word) => {
          try {
            const data = await wordsApiService.enrichWordData(word);
            return { word, data };
          } catch (error) {
            console.warn(`Failed to enrich word "${word}":`, error);
            return { word, data: {} };
          }
        });
        
        const batchResults = await Promise.all(batchPromises);
        
        batchResults.forEach(({ word, data }) => {
          results[word] = data;
        });
        
        // Add delay between batches to respect API limits
        if (i + batchSize < words.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      
      return results;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to enrich words';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return {
    enrichWord,
    enrichWords,
    loading,
    error
  };
}