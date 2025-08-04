import AsyncStorage from '@react-native-async-storage/async-storage';
import { WordData } from '@/types';

interface DictionaryApiResponse {
  word: string;
  phonetics: Array<{
    text: string;
    audio?: string;
  }>;
  meanings: Array<{
    partOfSpeech: string;
    definitions: Array<{
      definition: string;
      example?: string;
      synonyms?: string[];
      antonyms?: string[];
    }>;
  }>;
}

class DictionaryApiService {
  private readonly API_BASE_URL = 'https://api.dictionaryapi.dev/api/v2/entries/en';
  private readonly CACHE_PREFIX = 'dict_cache_';
  private readonly CACHE_EXPIRY = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

  private async getCacheKey(word: string): Promise<string> {
    return `${this.CACHE_PREFIX}${word.toLowerCase()}`;
  }

  private async getCachedWord(word: string): Promise<WordData | null> {
    try {
      const cacheKey = await this.getCacheKey(word);
      const cachedData = await AsyncStorage.getItem(cacheKey);
      
      if (!cachedData) return null;

      const parsed = JSON.parse(cachedData);
      const now = Date.now();
      
      // Check if cache is expired
      if (now - parsed.timestamp > this.CACHE_EXPIRY) {
        await AsyncStorage.removeItem(cacheKey);
        return null;
      }

      return parsed.data;
    } catch (error) {
      console.error('Error reading from cache:', error);
      return null;
    }
  }

  private async setCachedWord(word: string, data: WordData): Promise<void> {
    try {
      const cacheKey = await this.getCacheKey(word);
      const cacheData = {
        data,
        timestamp: Date.now(),
      };
      
      await AsyncStorage.setItem(cacheKey, JSON.stringify(cacheData));
    } catch (error) {
      console.error('Error writing to cache:', error);
    }
  }

  private transformApiResponse(apiData: DictionaryApiResponse[]): WordData {
    const firstEntry = apiData[0];
    
    // Extract pronunciation
    const phonetic = firstEntry.phonetics.find(p => p.text) || { text: '', audio: undefined };
    
    // Extract meanings
    const meanings = firstEntry.meanings.flatMap(meaning => 
      meaning.definitions.slice(0, 3).map(def => ({
        partOfSpeech: meaning.partOfSpeech,
        definition: def.definition,
        example: def.example,
      }))
    );

    // Extract synonyms and antonyms
    const synonyms = new Set<string>();
    const antonyms = new Set<string>();

    firstEntry.meanings.forEach(meaning => {
      meaning.definitions.forEach(def => {
        if (def.synonyms) {
          def.synonyms.forEach(syn => synonyms.add(syn));
        }
        if (def.antonyms) {
          def.antonyms.forEach(ant => antonyms.add(ant));
        }
      });
    });

    return {
      word: firstEntry.word,
      meanings,
      pronunciation: {
        phonetic: phonetic.text,
        audio: phonetic.audio,
      },
      synonyms: Array.from(synonyms).slice(0, 5),
      antonyms: Array.from(antonyms).slice(0, 5),
      etymology: undefined, // Free API doesn't provide etymology
    };
  }

  async getWordDefinition(word: string): Promise<WordData | null> {
    try {
      // First, try to get from cache
      const cachedData = await this.getCachedWord(word);
      if (cachedData) {
        console.log(`Retrieved ${word} from cache`);
        return cachedData;
      }

      // If not in cache, fetch from API
      console.log(`Fetching ${word} from API`);
      const response = await fetch(`${this.API_BASE_URL}/${encodeURIComponent(word)}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          console.log(`Word "${word}" not found in dictionary`);
          return null;
        }
        throw new Error(`API request failed: ${response.status}`);
      }

      const apiData: DictionaryApiResponse[] = await response.json();
      
      if (!apiData || apiData.length === 0) {
        return null;
      }

      const wordData = this.transformApiResponse(apiData);
      
      // Cache the result
      await this.setCachedWord(word, wordData);
      
      return wordData;
    } catch (error) {
      console.error('Error fetching word definition:', error);
      
      // Try to return cached data even if expired as fallback
      try {
        const cacheKey = await this.getCacheKey(word);
        const cachedData = await AsyncStorage.getItem(cacheKey);
        if (cachedData) {
          const parsed = JSON.parse(cachedData);
          console.log(`Returning expired cache for ${word} as fallback`);
          return parsed.data;
        }
      } catch (cacheError) {
        console.error('Error reading fallback cache:', cacheError);
      }
      
      return null;
    }
  }

  async getMultipleWords(words: string[]): Promise<Map<string, WordData>> {
    const results = new Map<string, WordData>();
    
    // Process words in batches to avoid overwhelming the API
    const batchSize = 5;
    for (let i = 0; i < words.length; i += batchSize) {
      const batch = words.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async (word) => {
        const data = await this.getWordDefinition(word);
        if (data) {
          results.set(word, data);
        }
        // Add small delay to respect API rate limits
        await new Promise(resolve => setTimeout(resolve, 100));
      });
      
      await Promise.all(batchPromises);
    }
    
    return results;
  }

  async clearCache(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith(this.CACHE_PREFIX));
      await AsyncStorage.multiRemove(cacheKeys);
      console.log(`Cleared ${cacheKeys.length} cached dictionary entries`);
    } catch (error) {
      console.error('Error clearing dictionary cache:', error);
    }
  }

  async getCacheStats(): Promise<{ count: number; size: string }> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith(this.CACHE_PREFIX));
      
      let totalSize = 0;
      for (const key of cacheKeys) {
        const data = await AsyncStorage.getItem(key);
        if (data) {
          totalSize += data.length;
        }
      }
      
      const sizeInKB = (totalSize / 1024).toFixed(2);
      
      return {
        count: cacheKeys.length,
        size: `${sizeInKB} KB`
      };
    } catch (error) {
      console.error('Error getting cache stats:', error);
      return { count: 0, size: '0 KB' };
    }
  }

  // Offline-first approach: always try cache first, then API
  async getWordDefinitionOfflineFirst(word: string): Promise<WordData | null> {
    // Always try cache first
    const cachedData = await this.getCachedWord(word);
    if (cachedData) {
      return cachedData;
    }

    // Only try API if we're online
    try {
      return await this.getWordDefinition(word);
    } catch (error) {
      console.log('Offline mode: API not available');
      return null;
    }
  }

  // Preload common words for offline use
  async preloadCommonWords(words: string[]): Promise<void> {
    console.log(`Preloading ${words.length} words for offline use...`);
    
    let successCount = 0;
    const batchSize = 3;
    
    for (let i = 0; i < words.length; i += batchSize) {
      const batch = words.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async (word) => {
        try {
          const data = await this.getWordDefinition(word);
          if (data) {
            successCount++;
          }
          // Rate limiting
          await new Promise(resolve => setTimeout(resolve, 200));
        } catch (error) {
          console.error(`Failed to preload word: ${word}`, error);
        }
      });
      
      await Promise.all(batchPromises);
      
      // Progress logging
      console.log(`Preloaded ${Math.min(i + batchSize, words.length)} / ${words.length} words`);
    }
    
    console.log(`Preloading complete: ${successCount} words cached successfully`);
  }
}

export const dictionaryApiService = new DictionaryApiService();