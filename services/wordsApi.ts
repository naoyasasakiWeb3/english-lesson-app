import AsyncStorage from '@react-native-async-storage/async-storage';

const WORDS_API_BASE_URL = 'https://wordsapiv1.p.rapidapi.com/words';
const API_KEY_STORAGE_KEY = 'words_api_key';

export interface WordDefinition {
  definition: string;
  partOfSpeech: string;
  synonyms?: string[];
  antonyms?: string[];
  examples?: string[];
}

export interface WordPronunciation {
  all?: string;
}

export interface WordDetails {
  word: string;
  results?: WordDefinition[];
  pronunciation?: WordPronunciation;
  frequency?: number;
  syllables?: {
    count: number;
    list: string[];
  };
}

export interface WordsApiResponse {
  word: string;
  results: Array<{
    definition: string;
    partOfSpeech: string;
    synonyms?: string[];
    antonyms?: string[];
    examples?: string[];
  }>;
  pronunciation?: {
    all?: string;
  };
  frequency?: number;
  syllables?: {
    count: number;
    list: string[];
  };
}

class WordsApiService {
  private apiKey: string | null = null;

  // API Key Management
  async setApiKey(key: string): Promise<void> {
    try {
      await AsyncStorage.setItem(API_KEY_STORAGE_KEY, key);
      this.apiKey = key;
    } catch (error) {
      console.error('Error storing API key:', error);
      throw new Error('Failed to store API key');
    }
  }

  async getApiKey(): Promise<string | null> {
    if (this.apiKey) {
      return this.apiKey;
    }

    try {
      const key = await AsyncStorage.getItem(API_KEY_STORAGE_KEY);
      this.apiKey = key;
      return key;
    } catch (error) {
      console.error('Error retrieving API key:', error);
      return null;
    }
  }

  async removeApiKey(): Promise<void> {
    try {
      await AsyncStorage.removeItem(API_KEY_STORAGE_KEY);
      this.apiKey = null;
    } catch (error) {
      console.error('Error removing API key:', error);
      throw new Error('Failed to remove API key');
    }
  }

  async validateApiKey(key?: string): Promise<boolean> {
    const testKey = key || await this.getApiKey();
    
    if (!testKey) {
      return false;
    }

    try {
      const response = await fetch(`${WORDS_API_BASE_URL}/test`, {
        method: 'GET',
        headers: {
          'X-RapidAPI-Key': testKey,
          'X-RapidAPI-Host': 'wordsapiv1.p.rapidapi.com',
          'Content-Type': 'application/json',
        },
      });

      return response.ok;
    } catch (error) {
      console.error('API key validation failed:', error);
      return false;
    }
  }

  // Words API Operations
  async getWordDetails(word: string): Promise<WordDetails | null> {
    const apiKey = await this.getApiKey();
    
    if (!apiKey) {
      throw new Error('Words API key not configured');
    }

    try {
      const response = await fetch(`${WORDS_API_BASE_URL}/${encodeURIComponent(word)}`, {
        method: 'GET',
        headers: {
          'X-RapidAPI-Key': apiKey,
          'X-RapidAPI-Host': 'wordsapiv1.p.rapidapi.com',
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          return null; // Word not found
        }
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }

      const data: WordsApiResponse = await response.json();
      return this.transformApiResponse(data);
    } catch (error) {
      console.error('Error fetching word details:', error);
      throw error;
    }
  }

  async getDefinitions(word: string): Promise<WordDefinition[]> {
    const apiKey = await this.getApiKey();
    
    if (!apiKey) {
      throw new Error('Words API key not configured');
    }

    try {
      const response = await fetch(`${WORDS_API_BASE_URL}/${encodeURIComponent(word)}/definitions`, {
        method: 'GET',
        headers: {
          'X-RapidAPI-Key': apiKey,
          'X-RapidAPI-Host': 'wordsapiv1.p.rapidapi.com',
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          return [];
        }
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data.definitions || [];
    } catch (error) {
      console.error('Error fetching definitions:', error);
      throw error;
    }
  }

  async getPronunciation(word: string): Promise<string | null> {
    const apiKey = await this.getApiKey();
    
    if (!apiKey) {
      throw new Error('Words API key not configured');
    }

    try {
      const response = await fetch(`${WORDS_API_BASE_URL}/${encodeURIComponent(word)}/pronunciation`, {
        method: 'GET',
        headers: {
          'X-RapidAPI-Key': apiKey,
          'X-RapidAPI-Host': 'wordsapiv1.p.rapidapi.com',
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data.pronunciation?.all || null;
    } catch (error) {
      console.error('Error fetching pronunciation:', error);
      throw error;
    }
  }

  async getSynonyms(word: string): Promise<string[]> {
    const apiKey = await this.getApiKey();
    
    if (!apiKey) {
      throw new Error('Words API key not configured');
    }

    try {
      const response = await fetch(`${WORDS_API_BASE_URL}/${encodeURIComponent(word)}/synonyms`, {
        method: 'GET',
        headers: {
          'X-RapidAPI-Key': apiKey,
          'X-RapidAPI-Host': 'wordsapiv1.p.rapidapi.com',
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          return [];
        }
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data.synonyms || [];
    } catch (error) {
      console.error('Error fetching synonyms:', error);
      throw error;
    }
  }

  async getAntonyms(word: string): Promise<string[]> {
    const apiKey = await this.getApiKey();
    
    if (!apiKey) {
      throw new Error('Words API key not configured');
    }

    try {
      const response = await fetch(`${WORDS_API_BASE_URL}/${encodeURIComponent(word)}/antonyms`, {
        method: 'GET',
        headers: {
          'X-RapidAPI-Key': apiKey,
          'X-RapidAPI-Host': 'wordsapiv1.p.rapidapi.com',
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          return [];
        }
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data.antonyms || [];
    } catch (error) {
      console.error('Error fetching antonyms:', error);
      throw error;
    }
  }

  // Utility Methods
  private transformApiResponse(data: WordsApiResponse): WordDetails {
    return {
      word: data.word,
      results: data.results,
      pronunciation: data.pronunciation,
      frequency: data.frequency,
      syllables: data.syllables,
    };
  }

  async enrichWordData(word: string): Promise<{
    definition?: string;
    pronunciation?: string;
    example_sentence?: string;
    synonyms?: string;
    antonyms?: string;
    difficulty_score?: number;
    frequency_score?: number;
  }> {
    try {
      const [details, synonyms, antonyms] = await Promise.all([
        this.getWordDetails(word),
        this.getSynonyms(word),
        this.getAntonyms(word)
      ]);

      const primaryDefinition = details?.results?.[0]?.definition;
      const exampleSentence = details?.results?.[0]?.examples?.[0];
      
      return {
        definition: primaryDefinition,
        pronunciation: details?.pronunciation?.all,
        example_sentence: exampleSentence,
        synonyms: synonyms.length > 0 ? JSON.stringify(synonyms.slice(0, 5)) : undefined,
        antonyms: antonyms.length > 0 ? JSON.stringify(antonyms.slice(0, 5)) : undefined,
        frequency_score: details?.frequency,
        difficulty_score: this.calculateDifficultyScore(details)
      };
    } catch (error) {
      console.error(`Error enriching word data for "${word}":`, error);
      return {};
    }
  }

  private calculateDifficultyScore(details: WordDetails | null): number | undefined {
    if (!details) return undefined;
    
    // Simple difficulty scoring based on:
    // - Frequency (lower frequency = higher difficulty)
    // - Syllable count (more syllables = higher difficulty)
    // - Number of definitions (fewer definitions = higher difficulty)
    
    let score = 5; // Base score
    
    if (details.frequency) {
      // Lower frequency increases difficulty
      score += Math.max(0, (10 - details.frequency) / 2);
    }
    
    if (details.syllables?.count) {
      // More syllables increases difficulty
      score += Math.min(3, details.syllables.count - 1);
    }
    
    if (details.results?.length) {
      // Fewer definitions increases difficulty
      score += Math.max(0, (5 - details.results.length) * 0.5);
    }
    
    return Math.min(10, Math.max(1, score));
  }

  async isApiKeyConfigured(): Promise<boolean> {
    const key = await this.getApiKey();
    return key !== null && key.length > 0;
  }

  async getApiStatus(): Promise<{
    configured: boolean;
    valid: boolean | null;
    error?: string;
  }> {
    try {
      const configured = await this.isApiKeyConfigured();
      
      if (!configured) {
        return { configured: false, valid: null };
      }
      
      const valid = await this.validateApiKey();
      return { configured: true, valid };
    } catch (error) {
      return {
        configured: await this.isApiKeyConfigured(),
        valid: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

export const wordsApiService = new WordsApiService();