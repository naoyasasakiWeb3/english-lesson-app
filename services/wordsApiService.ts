import { WordData } from '@/types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

// WordsAPI response interfaces based on API documentation
interface WordsApiDefinition {
  definition: string;
  partOfSpeech: string;
  synonyms?: string[];
  antonyms?: string[];
  derivation?: string[];
  examples?: string[];
}

interface WordsApiPronunciation {
  all?: string;
}

interface WordsApiResponse {
  word: string;
  pronunciation?: WordsApiPronunciation;
  definitions?: WordsApiDefinition[];
  synonyms?: string[];
  antonyms?: string[];
  examples?: string[];
  frequency?: number;
}

interface ApiUsageRecord {
  date: string; // YYYY-MM-DD format
  requestCount: number;
}

export enum ApiErrorType {
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  AUTH_ERROR = 'AUTH_ERROR',
  RATE_LIMIT_ERROR = 'RATE_LIMIT_ERROR',
  SERVER_ERROR = 'SERVER_ERROR',
  NOT_FOUND_ERROR = 'NOT_FOUND_ERROR',
  QUOTA_EXCEEDED = 'QUOTA_EXCEEDED',
  INVALID_REQUEST = 'INVALID_REQUEST',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

export interface ApiError extends Error {
  type: ApiErrorType;
  statusCode?: number;
  retryable: boolean;
  retryAfter?: number;
  originalError?: Error;
}

export class WordsApiError extends Error implements ApiError {
  constructor(
    public type: ApiErrorType,
    message: string,
    public statusCode?: number,
    public retryable: boolean = false,
    public retryAfter?: number,
    public originalError?: Error
  ) {
    super(message);
    this.name = 'WordsApiError';
  }
}

export class WordsApiService {
  private readonly API_BASE_URL = 'https://wordsapiv1.p.rapidapi.com/words';
  private readonly CACHE_PREFIX = 'wordsapi_cache_';
  private readonly USAGE_PREFIX = 'wordsapi_usage_';
  private readonly API_KEY_STORAGE = 'WORDS_API_KEY';
  private readonly CACHE_EXPIRY = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds
  private readonly DEFAULT_TIMEOUT = 3000; // 3 seconds
  private readonly MAX_RETRIES = 2;
  private readonly DAILY_QUOTA_BUFFER = 0.9; // Use only 90% of quota (10% buffer)
  private readonly RETRY_DELAYS = [1000, 2000, 4000]; // Exponential backoff: 1s, 2s, 4s
  private readonly RETRYABLE_STATUS_CODES = [429, 500, 502, 503, 504, 520, 522, 524];

  // API key management
  async setApiKey(key: string): Promise<boolean> {
    try {
      if (!key || key.trim().length === 0) {
        throw new Error('API key cannot be empty');
      }
      
      // Validate API key by making a test request
      const isValid = await this.validateApiKey(key);
      if (!isValid) {
        throw new Error('Invalid API key');
      }
      
      await SecureStore.setItemAsync(this.API_KEY_STORAGE, key.trim());
      console.log('WordsAPI key stored successfully');
      return true;
    } catch (error) {
      console.error('Error storing WordsAPI key:', error);
      return false;
    }
  }

  async getApiKey(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(this.API_KEY_STORAGE);
    } catch (error) {
      console.error('Error retrieving WordsAPI key:', error);
      return null;
    }
  }

  async removeApiKey(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(this.API_KEY_STORAGE);
      console.log('WordsAPI key removed');
    } catch (error) {
      console.error('Error removing WordsAPI key:', error);
    }
  }

  // Comprehensive error classification
  private classifyError(error: any, response?: Response, retries: number = 0): WordsApiError {
    // Handle network/fetch errors
    if (error.name === 'AbortError' || error.message?.includes('timeout')) {
      return new WordsApiError(
        ApiErrorType.TIMEOUT_ERROR,
        `Request timeout after ${this.DEFAULT_TIMEOUT}ms`,
        undefined,
        retries < this.MAX_RETRIES,
        this.RETRY_DELAYS[retries] || 4000,
        error
      );
    }

    if (error.name === 'TypeError' || error.message?.includes('network') || error.message?.includes('fetch')) {
      return new WordsApiError(
        ApiErrorType.NETWORK_ERROR,
        'Network connection failed',
        undefined,
        retries < this.MAX_RETRIES,
        this.RETRY_DELAYS[retries] || 4000,
        error
      );
    }

    // Handle HTTP response errors
    if (response) {
      const statusCode = response.status;
      const statusText = response.statusText;

      switch (statusCode) {
        case 401:
        case 403:
          return new WordsApiError(
            ApiErrorType.AUTH_ERROR,
            `Authentication failed: Invalid or expired API key (${statusCode})`,
            statusCode,
            false // Not retryable - need new API key
          );

        case 429:
          const retryAfter = response.headers.get('Retry-After');
          const retrySeconds = retryAfter ? parseInt(retryAfter) * 1000 : this.RETRY_DELAYS[retries] || 4000;
          return new WordsApiError(
            ApiErrorType.RATE_LIMIT_ERROR,
            'Rate limit exceeded. Please slow down your requests.',
            statusCode,
            retries < this.MAX_RETRIES,
            retrySeconds
          );

        case 404:
          return new WordsApiError(
            ApiErrorType.NOT_FOUND_ERROR,
            'Word not found in dictionary',
            statusCode,
            false // Not retryable - word simply doesn't exist
          );

        case 400:
        case 422:
          return new WordsApiError(
            ApiErrorType.INVALID_REQUEST,
            `Invalid request: ${statusText}`,
            statusCode,
            false // Not retryable - fix the request
          );

        case 500:
        case 502:
        case 503:
        case 504:
          return new WordsApiError(
            ApiErrorType.SERVER_ERROR,
            `Server error: ${statusText} (${statusCode})`,
            statusCode,
            retries < this.MAX_RETRIES,
            this.RETRY_DELAYS[retries] || 4000
          );

        case 520:
        case 522:
        case 524:
          return new WordsApiError(
            ApiErrorType.SERVICE_UNAVAILABLE,
            `Service temporarily unavailable: ${statusText} (${statusCode})`,
            statusCode,
            retries < this.MAX_RETRIES,
            this.RETRY_DELAYS[retries] || 4000
          );

        default:
          return new WordsApiError(
            ApiErrorType.UNKNOWN_ERROR,
            `Unexpected HTTP error: ${statusCode} ${statusText}`,
            statusCode,
            this.RETRYABLE_STATUS_CODES.includes(statusCode) && retries < this.MAX_RETRIES,
            this.RETRY_DELAYS[retries] || 4000
          );
      }
    }

    // Handle quota-related errors
    if (error.message?.includes('quota') || error.message?.includes('Quota')) {
      return new WordsApiError(
        ApiErrorType.QUOTA_EXCEEDED,
        error.message,
        undefined,
        false // Not retryable until quota resets
      );
    }

    // Default unknown error
    return new WordsApiError(
      ApiErrorType.UNKNOWN_ERROR,
      error.message || 'An unexpected error occurred',
      undefined,
      false,
      undefined,
      error
    );
  }

  async hasApiKey(): Promise<boolean> {
    const key = await this.getApiKey();
    return key !== null && key.length > 0;
  }

  // API key validation
  private async validateApiKey(key: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.API_BASE_URL}/hello`, {
        method: 'GET',
        headers: {
          'X-RapidAPI-Key': key,
          'X-RapidAPI-Host': 'wordsapiv1.p.rapidapi.com',
        },
        timeout: this.DEFAULT_TIMEOUT,
      });
      
      return response.ok;
    } catch (error) {
      console.error('API key validation failed:', error);
      return false;
    }
  }

  // Cache management
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

      console.log(`Retrieved ${word} from WordsAPI cache`);
      return parsed.data;
    } catch (error) {
      console.error('Error reading from WordsAPI cache:', error);
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
      console.log(`Cached WordsAPI result for ${word}`);
    } catch (error) {
      console.error('Error writing to WordsAPI cache:', error);
    }
  }

  // Usage tracking for quota management
  private getUsageKey(): string {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    return `${this.USAGE_PREFIX}${today}`;
  }

  private async getTodaysUsage(): Promise<number> {
    try {
      const usageKey = this.getUsageKey();
      const usageData = await AsyncStorage.getItem(usageKey);
      
      if (!usageData) return 0;
      
      const parsed: ApiUsageRecord = JSON.parse(usageData);
      return parsed.requestCount || 0;
    } catch (error) {
      console.error('Error reading usage data:', error);
      return 0;
    }
  }

  private async incrementUsage(): Promise<void> {
    try {
      const usageKey = this.getUsageKey();
      const currentUsage = await this.getTodaysUsage();
      
      const usageRecord: ApiUsageRecord = {
        date: new Date().toISOString().split('T')[0],
        requestCount: currentUsage + 1,
      };
      
      await AsyncStorage.setItem(usageKey, JSON.stringify(usageRecord));
    } catch (error) {
      console.error('Error incrementing usage:', error);
    }
  }

  async canMakeRequest(dailyQuota: number = 2500): Promise<boolean> {
    const todaysUsage = await this.getTodaysUsage();
    const effectiveQuota = Math.floor(dailyQuota * this.DAILY_QUOTA_BUFFER);
    return todaysUsage < effectiveQuota;
  }

  async shouldWarnUser(dailyQuota: number = 2500): Promise<{
    shouldWarn: boolean;
    warningLevel: 'safe' | 'warning' | 'critical' | 'exceeded';
    message: string;
    requestsRemaining: number;
  }> {
    const stats = await this.getUsageStats(dailyQuota);
    
    const messages = {
      safe: '',
      warning: `You've used ${stats.usagePercentage}% of your daily quota. Consider moderating your searches.`,
      critical: `Critical: Only ${stats.bufferRemaining} API requests remaining in safe buffer. Further searches may hit quota limits.`,
      exceeded: `Daily quota exceeded (${stats.todayUsage}/${stats.dailyQuota}). API searches disabled until tomorrow.`
    };
    
    return {
      shouldWarn: stats.warningLevel !== 'safe',
      warningLevel: stats.warningLevel,
      message: messages[stats.warningLevel],
      requestsRemaining: stats.bufferRemaining,
    };
  }

  async getQuotaResetTime(): Promise<Date> {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    return tomorrow;
  }

  async estimateRequestsForBatch(wordCount: number): Promise<{
    estimatedRequests: number;
    canProcessAll: boolean;
    maxProcessable: number;
    warningMessage?: string;
  }> {
    const stats = await this.getUsageStats();
    const availableRequests = stats.bufferRemaining;
    
    // Estimate: assume cache hit rate of 70% for typical usage
    const estimatedRequests = Math.ceil(wordCount * 0.3);
    const canProcessAll = estimatedRequests <= availableRequests;
    const maxProcessable = Math.floor(availableRequests / 0.3);
    
    let warningMessage: string | undefined;
    if (!canProcessAll) {
      warningMessage = `Batch too large. Can process ~${maxProcessable} words with current quota (${availableRequests} requests remaining).`;
    } else if (estimatedRequests > availableRequests * 0.5) {
      warningMessage = `Large batch will use ~${estimatedRequests} requests. ${availableRequests} requests remaining.`;
    }
    
    return {
      estimatedRequests,
      canProcessAll,
      maxProcessable,
      warningMessage,
    };
  }

  async getUsageStats(dailyQuota: number = 2500): Promise<{
    todayUsage: number;
    dailyQuota: number;
    remainingRequests: number;
    usagePercentage: number;
    warningLevel: 'safe' | 'warning' | 'critical' | 'exceeded';
    effectiveQuota: number;
    bufferRemaining: number;
  }> {
    const todayUsage = await this.getTodaysUsage();
    const effectiveQuota = Math.floor(dailyQuota * this.DAILY_QUOTA_BUFFER);
    const remainingRequests = Math.max(0, dailyQuota - todayUsage);
    const bufferRemaining = Math.max(0, effectiveQuota - todayUsage);
    const usagePercentage = Math.round((todayUsage / dailyQuota) * 100);
    
    // Determine warning level based on usage
    let warningLevel: 'safe' | 'warning' | 'critical' | 'exceeded';
    if (todayUsage >= dailyQuota) {
      warningLevel = 'exceeded';
    } else if (todayUsage >= effectiveQuota) {
      warningLevel = 'critical';
    } else if (todayUsage >= dailyQuota * 0.7) {
      warningLevel = 'warning';
    } else {
      warningLevel = 'safe';
    }
    
    return {
      todayUsage,
      dailyQuota,
      remainingRequests,
      usagePercentage,
      warningLevel,
      effectiveQuota,
      bufferRemaining,
    };
  }

  // Enhanced API request with comprehensive timeout and retry logic
  private async makeApiRequest(endpoint: string, retries: number = 0): Promise<Response> {
    const apiKey = await this.getApiKey();
    if (!apiKey) {
      throw new WordsApiError(
        ApiErrorType.AUTH_ERROR,
        'WordsAPI key not configured',
        undefined,
        false
      );
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.DEFAULT_TIMEOUT);
    let response: Response | undefined;

    try {
      console.log(`Making WordsAPI request to ${endpoint} (attempt ${retries + 1}/${this.MAX_RETRIES + 1})`);
      
      response = await fetch(`${this.API_BASE_URL}${endpoint}`, {
        method: 'GET',
        headers: {
          'X-RapidAPI-Key': apiKey,
          'X-RapidAPI-Host': 'wordsapiv1.p.rapidapi.com',
          'User-Agent': 'VocabMaster/1.0',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Handle successful responses
      if (response.ok) {
        await this.incrementUsage();
        console.log(`WordsAPI request successful (${response.status})`);
        return response;
      }

      // Handle non-OK responses with classification
      const apiError = this.classifyError(null, response, retries);
      
      // Special case: 404 is handled by caller, not an error
      if (response.status === 404) {
        return response;
      }

      // Retry if error is retryable
      if (apiError.retryable && retries < this.MAX_RETRIES) {
        const delayMs = apiError.retryAfter || this.RETRY_DELAYS[retries] || 4000;
        console.log(
          `${apiError.type}: ${apiError.message}. Retrying in ${delayMs}ms... (${retries + 1}/${this.MAX_RETRIES})`
        );
        await new Promise(resolve => setTimeout(resolve, delayMs));
        return this.makeApiRequest(endpoint, retries + 1);
      }

      throw apiError;

    } catch (error) {
      clearTimeout(timeoutId);
      
      // Don't re-classify already classified errors during retries
      if (error instanceof WordsApiError) {
        throw error;
      }

      const apiError = this.classifyError(error, response, retries);
      
      // Retry if error is retryable
      if (apiError.retryable && retries < this.MAX_RETRIES) {
        const delayMs = apiError.retryAfter || this.RETRY_DELAYS[retries] || 4000;
        console.log(
          `${apiError.type}: ${apiError.message}. Retrying in ${delayMs}ms... (${retries + 1}/${this.MAX_RETRIES})`
        );
        await new Promise(resolve => setTimeout(resolve, delayMs));
        return this.makeApiRequest(endpoint, retries + 1);
      }

      console.error(`WordsAPI request failed after ${retries + 1} attempts:`, apiError);
      throw apiError;
    }
  }

  // Transform WordsAPI response to match our WordData interface
  private transformApiResponse(apiData: WordsApiResponse): WordData {
    console.log('WordsAPI Response Data:', JSON.stringify(apiData, null, 2));
    console.log('Available fields:', Object.keys(apiData));
    
    const definitions = apiData.definitions || [];
    console.log('Extracted definitions:', definitions.length, definitions);
    
    // Try alternative fields if definitions is empty
    if (definitions.length === 0) {
      console.log('No definitions found, checking for alternative fields...');
      console.log('results field:', (apiData as any).results);
      console.log('meaning field:', (apiData as any).meaning);
      console.log('definition field:', (apiData as any).definition);
    }
    
    // Group definitions by part of speech
    let meanings: any[] = [];
    
    if (definitions.length > 0) {
      const meaningsByPOS = definitions.reduce((acc, def) => {
        const pos = def.partOfSpeech || 'unknown';
        if (!acc[pos]) {
          acc[pos] = [];
        }
        acc[pos].push({
          partOfSpeech: pos,
          definition: def.definition,
          example: def.examples?.[0], // Take first example if available
        });
        return acc;
      }, {} as { [key: string]: any[] });
      meanings = Object.values(meaningsByPOS).flat().slice(0, 5);
    } else {
      // Try alternative response structures
      const apiDataAny = apiData as any;
      
      // Check for 'results' field (common in WordsAPI)
      if (apiDataAny.results && Array.isArray(apiDataAny.results)) {
        console.log('Processing results field:', apiDataAny.results);
        meanings = apiDataAny.results.map((result: any) => ({
          partOfSpeech: result.partOfSpeech || 'unknown',
          definition: result.definition || result.meaning || 'No definition available',
          example: result.examples?.[0] || undefined,
        })).slice(0, 5);
      }
      // Check for single definition field
      else if (apiDataAny.definition) {
        console.log('Processing single definition field:', apiDataAny.definition);
        meanings = [{
          partOfSpeech: 'unknown',
          definition: apiDataAny.definition,
          example: undefined,
        }];
      }
      // Check for meaning field  
      else if (apiDataAny.meaning) {
        console.log('Processing meaning field:', apiDataAny.meaning);
        meanings = [{
          partOfSpeech: 'unknown',
          definition: apiDataAny.meaning,
          example: undefined,
        }];
      }
    }

    // Extract synonyms and antonyms
    const synonyms = new Set<string>();
    const antonyms = new Set<string>();

    // Extract from definitions if available
    if (definitions.length > 0) {
      console.log('Extracting synonyms/antonyms from definitions:', definitions);
      definitions.forEach((def, index) => {
        console.log(`Definition ${index} synonyms:`, def.synonyms);
        console.log(`Definition ${index} antonyms:`, def.antonyms);
        def.synonyms?.forEach(syn => synonyms.add(syn));
        def.antonyms?.forEach(ant => antonyms.add(ant));
      });
    }

    // Add global synonyms/antonyms from API response
    console.log('Global synonyms from API:', apiData.synonyms);
    console.log('Global antonyms from API:', apiData.antonyms);
    
    apiData.synonyms?.forEach(syn => synonyms.add(syn));
    apiData.antonyms?.forEach(ant => antonyms.add(ant));
    
    // Check alternative fields for synonyms/antonyms
    const apiDataAny = apiData as any;
    if (apiDataAny.results && Array.isArray(apiDataAny.results)) {
      apiDataAny.results.forEach((result: any) => {
        if (result.synonyms) console.log('Result synonyms:', result.synonyms);
        if (result.antonyms) console.log('Result antonyms:', result.antonyms);
        result.synonyms?.forEach((syn: string) => synonyms.add(syn));
        result.antonyms?.forEach((ant: string) => antonyms.add(ant));
      });
    }
    
    console.log('Final extracted synonyms:', Array.from(synonyms));
    console.log('Final extracted antonyms:', Array.from(antonyms));

    const result = {
      word: apiData.word,
      meanings: meanings.length > 0 ? meanings : [{
        partOfSpeech: 'unknown',
        definition: `Definition not available for "${apiData.word}"`,
        example: undefined,
      }],
      pronunciation: {
        phonetic: apiData.pronunciation?.all || '',
        audio: undefined, // WordsAPI doesn't provide audio URLs
      },
      synonyms: Array.from(synonyms).slice(0, 5),
      antonyms: Array.from(antonyms).slice(0, 5),
      etymology: undefined, // Would need separate API call
    };

    console.log('Transformed WordData result:', JSON.stringify(result, null, 2));
    return result;
  }

  // Main method to get word definition
  async getWordDefinition(word: string, options?: {
    respectQuota?: boolean;
    warnUser?: boolean;
  }): Promise<WordData | null> {
    const { respectQuota = true, warnUser = false } = options || {};
    
    try {
      // Input validation
      if (!word || word.trim().length === 0) {
        throw new Error('Word cannot be empty');
      }

      const cleanWord = word.trim().toLowerCase();

      // Check if API key is available
      if (!(await this.hasApiKey())) {
        throw new Error('WordsAPI key not configured');
      }

      // Enhanced quota checking with warnings
      const canMake = await this.canMakeRequest();
      const warning = await this.shouldWarnUser();
      
      if (respectQuota && !canMake) {
        const resetTime = await this.getQuotaResetTime();
        const hoursUntilReset = Math.ceil((resetTime.getTime() - Date.now()) / (1000 * 60 * 60));
        throw new Error(`Daily API quota buffer exceeded. API searches will be available in ${hoursUntilReset} hours.`);
      }
      
      // Log warnings if requested
      if (warnUser && warning.shouldWarn) {
        console.warn('WordsAPI Quota Warning:', warning.message);
      }

      // First, try to get from cache
      const cachedData = await this.getCachedWord(cleanWord);
      if (cachedData) {
        return cachedData;
      }

      // If not in cache, fetch from API
      console.log(`Fetching ${cleanWord} from WordsAPI`);
      const response = await this.makeApiRequest(`/${encodeURIComponent(cleanWord)}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          console.log(`Word "${cleanWord}" not found in WordsAPI`);
          return null;
        }
        throw new Error(`WordsAPI request failed: ${response.status}`);
      }

      const apiData: WordsApiResponse = await response.json();
      console.log('Raw WordsAPI Response:', JSON.stringify(apiData, null, 2));
      
      if (!apiData || !apiData.word) {
        console.log('Invalid API response: missing word or data');
        return null;
      }

      const wordData = this.transformApiResponse(apiData);
      
      // Cache the result
      await this.setCachedWord(cleanWord, wordData);
      
      return wordData;
    } catch (error) {
      console.error('Error fetching word from WordsAPI:', error);
      
      // Record error for monitoring if it's a WordsApiError
      if (error instanceof WordsApiError) {
        await this.recordApiError(error, `/${encodeURIComponent(cleanWord)}`);
      }
      
      // Try to return cached data even if expired as fallback
      try {
        const cacheKey = await this.getCacheKey(word.trim().toLowerCase());
        const cachedData = await AsyncStorage.getItem(cacheKey);
        if (cachedData) {
          const parsed = JSON.parse(cachedData);
          console.log(`Returning expired cache for ${word} as fallback after API error`);
          return parsed.data;
        }
      } catch (cacheError) {
        console.error('Error reading fallback cache:', cacheError);
      }
      
      // For certain error types, return null instead of throwing
      if (error instanceof WordsApiError && 
          [ApiErrorType.NOT_FOUND_ERROR, ApiErrorType.QUOTA_EXCEEDED].includes(error.type)) {
        return null;
      }
      
      // Re-throw other errors for proper handling upstream
      throw error;
    }
  }

  // Batch word lookup with intelligent throttling
  async getMultipleWords(words: string[], options?: {
    respectQuota?: boolean;
    maxWords?: number;
    warnUser?: boolean;
  }): Promise<{
    results: Map<string, WordData>;
    processed: number;
    skipped: number;
    quotaWarning?: string;
  }> {
    const { respectQuota = true, maxWords, warnUser = false } = options || {};
    const results = new Map<string, WordData>();
    let processed = 0;
    let skipped = 0;
    
    // Enhanced quota checking for batch operations
    const batchEstimate = await this.estimateRequestsForBatch(words.length);
    
    if (warnUser && batchEstimate.warningMessage) {
      console.warn('WordsAPI Batch Warning:', batchEstimate.warningMessage);
    }
    
    // Determine how many words to process
    let wordsToProcess = words;
    if (respectQuota && !batchEstimate.canProcessAll) {
      const maxProcessable = Math.min(batchEstimate.maxProcessable, maxWords || words.length);
      wordsToProcess = words.slice(0, maxProcessable);
      skipped = words.length - wordsToProcess.length;
      console.log(`Processing ${wordsToProcess.length}/${words.length} words due to quota constraints`);
    } else if (maxWords && words.length > maxWords) {
      wordsToProcess = words.slice(0, maxWords);
      skipped = words.length - wordsToProcess.length;
    }
    
    if (wordsToProcess.length === 0) {
      return {
        results,
        processed,
        skipped: words.length,
        quotaWarning: 'No words processed due to quota constraints',
      };
    }

    // Process words in small batches to respect rate limits
    const batchSize = 3;
    for (let i = 0; i < wordsToProcess.length; i += batchSize) {
      // Check quota before each batch
      if (respectQuota && !(await this.canMakeRequest())) {
        const remaining = wordsToProcess.length - i;
        console.warn(`Stopping batch lookup at word ${i}: quota exhausted. ${remaining} words skipped.`);
        skipped += remaining;
        break;
      }

      const batch = wordsToProcess.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async (word) => {
        try {
          const data = await this.getWordDefinition(word, { respectQuota, warnUser: false });
          if (data) {
            results.set(word, data);
            processed++;
          }
        } catch (error) {
          console.error(`Failed to fetch word ${word}:`, error);
          if (error.message.includes('quota')) {
            // If quota error, we should stop the batch
            throw error;
          }
        }
        // Rate limiting delay
        await new Promise(resolve => setTimeout(resolve, 200));
      });
      
      try {
        await Promise.all(batchPromises);
      } catch (error) {
        if (error.message.includes('quota')) {
          const remaining = wordsToProcess.length - i - batch.length;
          skipped += remaining;
          console.warn('Batch processing stopped due to quota constraints');
          break;
        }
      }
    }
    
    return {
      results,
      processed,
      skipped,
      quotaWarning: skipped > 0 ? `${skipped} words skipped due to quota constraints` : undefined,
    };
  }

  // Cache management methods
  async clearCache(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith(this.CACHE_PREFIX));
      await AsyncStorage.multiRemove(cacheKeys);
      console.log(`Cleared ${cacheKeys.length} cached WordsAPI entries`);
    } catch (error) {
      console.error('Error clearing WordsAPI cache:', error);
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
      console.error('Error getting WordsAPI cache stats:', error);
      return { count: 0, size: '0 KB' };
    }
  }

  // Service health check
  async healthCheck(): Promise<{
    apiKeyConfigured: boolean;
    canMakeRequests: boolean;
    usageStats: any;
    cacheStats: any;
    quotaWarning: any;
    quotaResetTime: Date;
  }> {
    const apiKeyConfigured = await this.hasApiKey();
    const canMakeRequests = await this.canMakeRequest();
    const usageStats = await this.getUsageStats();
    const cacheStats = await this.getCacheStats();
    const quotaWarning = await this.shouldWarnUser();
    const quotaResetTime = await this.getQuotaResetTime();

    return {
      apiKeyConfigured,
      canMakeRequests,
      usageStats,
      cacheStats,
      quotaWarning,
      quotaResetTime,
    };
  }

  // Clear old usage records (cleanup utility)
  async cleanupOldUsageRecords(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const usageKeys = keys.filter(key => key.startsWith(this.USAGE_PREFIX));
      
      const today = new Date();
      const thirtyDaysAgo = new Date(today.getTime() - (30 * 24 * 60 * 60 * 1000));
      
      const keysToRemove = usageKeys.filter(key => {
        const dateStr = key.replace(this.USAGE_PREFIX, '');
        const recordDate = new Date(dateStr);
        return recordDate < thirtyDaysAgo;
      });
      
      if (keysToRemove.length > 0) {
        await AsyncStorage.multiRemove(keysToRemove);
        console.log(`Cleaned up ${keysToRemove.length} old usage records`);
      }
    } catch (error) {
      console.error('Error cleaning up old usage records:', error);
    }
  }

  // Enhanced error reporting and metrics
  async recordApiError(error: WordsApiError, endpoint: string): Promise<void> {
    try {
      const errorKey = `${this.USAGE_PREFIX}errors_${new Date().toISOString().split('T')[0]}`;
      const existingData = await AsyncStorage.getItem(errorKey);
      const errorLog = existingData ? JSON.parse(existingData) : [];
      
      const errorRecord = {
        timestamp: new Date().toISOString(),
        endpoint,
        type: error.type,
        statusCode: error.statusCode,
        message: error.message,
        retryable: error.retryable,
        retryAfter: error.retryAfter,
      };
      
      errorLog.push(errorRecord);
      
      // Keep only last 50 errors per day
      if (errorLog.length > 50) {
        errorLog.splice(0, errorLog.length - 50);
      }
      
      await AsyncStorage.setItem(errorKey, JSON.stringify(errorLog));
    } catch (storageError) {
      console.error('Failed to record API error:', storageError);
    }
  }

  async getErrorStatistics(days: number = 7): Promise<{
    totalErrors: number;
    errorsByType: Record<ApiErrorType, number>;
    errorsByDay: Array<{ date: string; count: number }>;
    recentErrors: Array<{
      timestamp: string;
      type: ApiErrorType;
      message: string;
      endpoint: string;
    }>;
  }> {
    try {
      const stats = {
        totalErrors: 0,
        errorsByType: {} as Record<ApiErrorType, number>,
        errorsByDay: [] as Array<{ date: string; count: number }>,
        recentErrors: [] as Array<{
          timestamp: string;
          type: ApiErrorType;
          message: string;
          endpoint: string;
        }>,
      };

      // Initialize error type counts
      Object.values(ApiErrorType).forEach(type => {
        stats.errorsByType[type] = 0;
      });

      const keys = await AsyncStorage.getAllKeys();
      const errorKeys = keys.filter(key => key.startsWith(`${this.USAGE_PREFIX}errors_`));
      
      const targetDate = new Date();
      const fromDate = new Date(targetDate.getTime() - (days * 24 * 60 * 60 * 1000));

      for (const key of errorKeys) {
        const dateStr = key.replace(`${this.USAGE_PREFIX}errors_`, '');
        const keyDate = new Date(dateStr);
        
        if (keyDate >= fromDate && keyDate <= targetDate) {
          const errorData = await AsyncStorage.getItem(key);
          if (errorData) {
            const errors = JSON.parse(errorData);
            const dayCount = errors.length;
            
            stats.totalErrors += dayCount;
            stats.errorsByDay.push({ date: dateStr, count: dayCount });
            
            errors.forEach((error: any) => {
              stats.errorsByType[error.type as ApiErrorType]++;
              stats.recentErrors.push({
                timestamp: error.timestamp,
                type: error.type,
                message: error.message,
                endpoint: error.endpoint,
              });
            });
          }
        }
      }

      // Sort recent errors by timestamp (newest first) and limit to 20
      stats.recentErrors.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      ).splice(20);

      // Sort days by date
      stats.errorsByDay.sort((a, b) => 
        new Date(a.date).getTime() - new Date(b.date).getTime()
      );

      return stats;
    } catch (error) {
      console.error('Error getting error statistics:', error);
      return {
        totalErrors: 0,
        errorsByType: {} as Record<ApiErrorType, number>,
        errorsByDay: [],
        recentErrors: [],
      };
    }
  }

  // Test connection and error handling
  async testConnection(): Promise<{
    success: boolean;
    responseTime: number;
    error?: WordsApiError;
  }> {
    const startTime = Date.now();
    
    try {
      const response = await this.makeApiRequest('/hello');
      const responseTime = Date.now() - startTime;
      
      if (response.ok) {
        return { success: true, responseTime };
      } else {
        const error = this.classifyError(null, response, 0);
        return { success: false, responseTime, error };
      }
    } catch (error) {
      const responseTime = Date.now() - startTime;
      const apiError = error instanceof WordsApiError ? error : this.classifyError(error, undefined, 0);
      
      return { success: false, responseTime, error: apiError };
    }
  }
}

// Export singleton instance
export const wordsApiService = new WordsApiService();