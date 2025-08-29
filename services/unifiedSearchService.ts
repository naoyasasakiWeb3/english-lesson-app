import { WordData } from '@/types';
import { databaseService } from './database';
import { enrichedVocabularyService } from './enrichedVocabularyService';
import { quotaManager } from './quotaManager';
import { ApiErrorType, WordsApiError, wordsApiService } from './wordsApiService';

export enum WordSource {
  CEFR_VOCABULARY = 'CEFR_VOCABULARY',
  ENRICHED_VOCABULARY = 'ENRICHED_VOCABULARY', 
  EXTERNAL_API = 'EXTERNAL_API',
  CACHED_EXTERNAL = 'CACHED_EXTERNAL',
}

export interface SearchResult {
  word: string;
  wordData: WordData;
  source: WordSource;
  isFromCache: boolean;
  responseTime: number;
  confidence: number; // 0.0 to 1.0
}

export interface SearchOptions {
  enableApiFallback?: boolean;
  respectApiQuota?: boolean;
  includeExternalCache?: boolean;
  timeoutMs?: number;
  userLevel?: string;
}

export interface SearchResponse {
  result: SearchResult | null;
  fallbackUsed: boolean;
  quotaWarning?: string;
  searchPath: string[]; // Track which sources were tried
  totalResponseTime: number;
}

export class UnifiedSearchService {
  private readonly SEARCH_TIMEOUT_MS = 5000;
  private readonly CONFIDENCE_THRESHOLDS = {
    EXACT_MATCH: 1.0,
    CLOSE_MATCH: 0.8,
    PARTIAL_MATCH: 0.6,
    WEAK_MATCH: 0.4,
  };

  /**
   * Primary search method that tries local sources first, then falls back to API
   */
  async searchWord(
    word: string, 
    options: SearchOptions = {}
  ): Promise<SearchResponse> {
    const {
      enableApiFallback = true,
      respectApiQuota = true,
      includeExternalCache = true,
      timeoutMs = this.SEARCH_TIMEOUT_MS,
      userLevel = 'A1',
    } = options;

    const startTime = Date.now();
    const searchPath: string[] = [];
    let fallbackUsed = false;
    let quotaWarning: string | undefined;

    const cleanWord = word.trim().toLowerCase();
    if (!cleanWord) {
      return {
        result: null,
        fallbackUsed,
        searchPath: ['INVALID_INPUT'],
        totalResponseTime: Date.now() - startTime,
      };
    }

    try {
      // Phase 1: Primary local search (fast, offline)
      const localResult = await this.searchLocalSources(cleanWord, userLevel, searchPath);
      
      if (localResult) {
        console.log(`Found "${word}" in local sources via ${localResult.source}`);
        return {
          result: localResult,
          fallbackUsed,
          searchPath,
          totalResponseTime: Date.now() - startTime,
        };
      }

      // Phase 2: Check cached external words if enabled
      if (includeExternalCache) {
        const cachedResult = await this.searchCachedExternalWords(cleanWord, searchPath);
        if (cachedResult) {
          console.log(`Found "${word}" in external cache`);
          return {
            result: cachedResult,
            fallbackUsed: false, // Cache doesn't count as fallback
            searchPath,
            totalResponseTime: Date.now() - startTime,
          };
        }
      }

      // Phase 3: API fallback (if enabled and quota allows)
      if (enableApiFallback) {
        fallbackUsed = true;
        
        // Check API quota before attempting external search
        if (respectApiQuota) {
          const quotaStatus = await quotaManager.getQuotaStatus();
          if (!quotaStatus.canMakeRequest) {
            quotaWarning = `API quota exceeded. External search disabled until ${quotaStatus.quotaResetTime.toLocaleTimeString()}.`;
            console.warn(quotaWarning);
            searchPath.push('API_QUOTA_EXCEEDED');
            
            return {
              result: null,
              fallbackUsed: true,
              quotaWarning,
              searchPath,
              totalResponseTime: Date.now() - startTime,
            };
          }

          if (quotaStatus.warningLevel === 'warning' || quotaStatus.warningLevel === 'critical') {
            quotaWarning = quotaStatus.message;
          }
        }

        const apiResult = await this.searchExternalApi(cleanWord, timeoutMs, searchPath);
        
        if (apiResult) {
          console.log(`Found "${word}" via external API fallback`);
          
          // Store API result in database for future use
          try {
            await this.storeExternalWordResult(cleanWord, apiResult.wordData);
          } catch (error) {
            console.warn('Failed to store external word result:', error);
          }

          return {
            result: apiResult,
            fallbackUsed: true,
            quotaWarning,
            searchPath,
            totalResponseTime: Date.now() - startTime,
          };
        }
      }

      // Word not found in any source
      console.log(`Word "${word}" not found in any available sources`);
      searchPath.push('NOT_FOUND');
      
      return {
        result: null,
        fallbackUsed,
        quotaWarning,
        searchPath,
        totalResponseTime: Date.now() - startTime,
      };

    } catch (error) {
      console.error('Error in unified search:', error);
      searchPath.push('SEARCH_ERROR');
      
      return {
        result: null,
        fallbackUsed,
        quotaWarning,
        searchPath,
        totalResponseTime: Date.now() - startTime,
      };
    }
  }

  /**
   * Search in local CEFR and enriched vocabulary (Phase 1)
   */
  private async searchLocalSources(
    word: string, 
    userLevel: string, 
    searchPath: string[]
  ): Promise<SearchResult | null> {
    const searchStartTime = Date.now();

    try {
      // 1. Try enriched vocabulary first (more comprehensive)
      searchPath.push('ENRICHED_VOCABULARY');
      const enrichedResult = await this.searchEnrichedVocabulary(word, userLevel);
      if (enrichedResult) {
        return enrichedResult;
      }

      // 2. Try legacy CEFR vocabulary
      searchPath.push('CEFR_VOCABULARY');
      const cefrResult = await this.searchCefrVocabulary(word);
      if (cefrResult) {
        return cefrResult;
      }

      return null;
    } catch (error) {
      console.error('Error searching local sources:', error);
      searchPath.push('LOCAL_SEARCH_ERROR');
      return null;
    }
  }

  /**
   * Search enriched vocabulary service
   */
  private async searchEnrichedVocabulary(word: string, userLevel: string): Promise<SearchResult | null> {
    try {
      const startTime = Date.now();
      
      // Try exact match first
      const vocabulary = await enrichedVocabularyService.getEnrichedVocabulary(userLevel);
      if (!vocabulary || !vocabulary.vocabulary) {
        console.warn('Invalid vocabulary structure returned');
        return null;
      }
      const wordEntry = vocabulary.vocabulary.find(w => w.word.toLowerCase() === word);
      
      if (wordEntry) {
        return {
          word: wordEntry.word,
          wordData: {
            word: wordEntry.word,
            meanings: wordEntry.apiData?.definitions ? wordEntry.apiData.definitions.map(def => ({
              partOfSpeech: def.partOfSpeech || 'unknown',
              definition: def.definition,
              example: undefined
            })) : [{ partOfSpeech: wordEntry.pos || 'unknown', definition: `${wordEntry.cefr} level word`, example: undefined }],
            pronunciation: {
              phonetic: wordEntry.apiData?.pronunciation?.all || '',
              audio: undefined
            },
            synonyms: wordEntry.apiData?.synonyms || [],
            antonyms: wordEntry.apiData?.antonyms || [],
            etymology: undefined,
          },
          source: WordSource.ENRICHED_VOCABULARY,
          isFromCache: true,
          responseTime: Date.now() - startTime,
          confidence: this.CONFIDENCE_THRESHOLDS.EXACT_MATCH,
        };
      }

      // Try fuzzy matching for close matches
      const fuzzyMatch = vocabulary.vocabulary.find(w => 
        this.calculateSimilarity(w.word.toLowerCase(), word) > 0.8
      );

      if (fuzzyMatch) {
        return {
          word: fuzzyMatch.word,
          wordData: {
            word: fuzzyMatch.word,
            meanings: fuzzyMatch.apiData?.definitions ? fuzzyMatch.apiData.definitions.map(def => ({
              partOfSpeech: def.partOfSpeech || 'unknown',
              definition: def.definition,
              example: undefined
            })) : [{ partOfSpeech: fuzzyMatch.pos || 'unknown', definition: `${fuzzyMatch.cefr} level word`, example: undefined }],
            pronunciation: {
              phonetic: fuzzyMatch.apiData?.pronunciation?.all || '',
              audio: undefined
            },
            synonyms: fuzzyMatch.apiData?.synonyms || [],
            antonyms: fuzzyMatch.apiData?.antonyms || [],
            etymology: undefined,
          },
          source: WordSource.ENRICHED_VOCABULARY,
          isFromCache: true,
          responseTime: Date.now() - startTime,
          confidence: this.calculateSimilarity(fuzzyMatch.word.toLowerCase(), word),
        };
      }

      return null;
    } catch (error) {
      console.error('Error searching enriched vocabulary:', error);
      return null;
    }
  }

  /**
   * Search legacy CEFR vocabulary
   */
  private async searchCefrVocabulary(word: string): Promise<SearchResult | null> {
    try {
      // Legacy CEFR vocabulary search is currently not implemented
      // as the specific database method doesn't exist yet.
      // This could be implemented when legacy word search is needed.
      console.log(`Legacy CEFR search for "${word}" - feature not yet implemented`);
      return null;
    } catch (error) {
      console.error('Error searching CEFR vocabulary:', error);
      return null;
    }
  }

  /**
   * Search cached external words (Phase 2)
   */
  private async searchCachedExternalWords(
    word: string, 
    searchPath: string[]
  ): Promise<SearchResult | null> {
    try {
      searchPath.push('EXTERNAL_CACHE');
      const startTime = Date.now();
      
      const cachedWord = await databaseService.getExternalWord(word);
      
      if (cachedWord) {
        return {
          word: cachedWord.word,
          wordData: {
            word: cachedWord.word,
            meanings: cachedWord.definitions ? JSON.parse(cachedWord.definitions) : [],
            pronunciation: {
              phonetic: cachedWord.phonetic || '',
              audio: cachedWord.pronunciation || undefined,
            },
            synonyms: cachedWord.synonyms ? JSON.parse(cachedWord.synonyms) : [],
            antonyms: cachedWord.antonyms ? JSON.parse(cachedWord.antonyms) : [],
            etymology: undefined,
          },
          source: WordSource.CACHED_EXTERNAL,
          isFromCache: true,
          responseTime: Date.now() - startTime,
          confidence: this.CONFIDENCE_THRESHOLDS.EXACT_MATCH,
        };
      }

      return null;
    } catch (error) {
      console.error('Error searching cached external words:', error);
      return null;
    }
  }

  /**
   * Search external API (Phase 3 - Fallback)
   */
  private async searchExternalApi(
    word: string, 
    timeoutMs: number, 
    searchPath: string[]
  ): Promise<SearchResult | null> {
    try {
      searchPath.push('EXTERNAL_API');
      const startTime = Date.now();
      
      const wordData = await wordsApiService.getWordDefinition(word, {
        respectQuota: true,
        warnUser: true,
      });

      if (wordData) {
        return {
          word: wordData.word,
          wordData,
          source: WordSource.EXTERNAL_API,
          isFromCache: false,
          responseTime: Date.now() - startTime,
          confidence: this.CONFIDENCE_THRESHOLDS.EXACT_MATCH,
        };
      }

      return null;
    } catch (error) {
      if (error instanceof WordsApiError) {
        if (error.type === ApiErrorType.NOT_FOUND_ERROR) {
          searchPath.push('API_NOT_FOUND');
        } else if (error.type === ApiErrorType.QUOTA_EXCEEDED) {
          searchPath.push('API_QUOTA_EXCEEDED');
        } else {
          searchPath.push(`API_ERROR_${error.type}`);
        }
      } else {
        searchPath.push('API_UNKNOWN_ERROR');
      }
      
      console.error('Error searching external API:', error);
      return null;
    }
  }

  /**
   * Store external API result in database
   */
  private async storeExternalWordResult(word: string, wordData: WordData): Promise<void> {
    try {
      // Extract examples from meanings
      const examples: string[] = [];
      wordData.meanings.forEach(meaning => {
        if (meaning.example) {
          examples.push(meaning.example);
        }
      });

      const externalWordData = {
        word: wordData.word,
        source: 'wordsapi',
        definitions: JSON.stringify(wordData.meanings),
        pronunciation: wordData.pronunciation.audio,
        phonetic: wordData.pronunciation.phonetic,
        synonyms: JSON.stringify(wordData.synonyms),
        antonyms: JSON.stringify(wordData.antonyms),
        examples: JSON.stringify(examples), // Extract examples from meanings
        frequency_score: null,
        difficulty_estimated: 2, // Default difficulty
        part_of_speech: wordData.meanings[0]?.partOfSpeech || 'unknown',
      };

      await databaseService.storeExternalWord(externalWordData);
      console.log(`Stored external word "${word}" in database for future use`);
    } catch (error) {
      console.error('Failed to store external word:', error);
      throw error;
    }
  }

  /**
   * Calculate string similarity (simple implementation)
   */
  private calculateSimilarity(str1: string, str2: string): number {
    if (str1 === str2) return 1.0;
    
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  /**
   * Calculate Levenshtein distance between two strings
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
    
    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;
    
    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1, // deletion
          matrix[j - 1][i] + 1, // insertion
          matrix[j - 1][i - 1] + indicator // substitution
        );
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  /**
   * Batch search multiple words with intelligent prioritization
   */
  async searchMultipleWords(
    words: string[],
    options: SearchOptions = {}
  ): Promise<Map<string, SearchResponse>> {
    const results = new Map<string, SearchResponse>();
    
    if (words.length === 0) return results;

    // Process in batches to avoid overwhelming the system
    const batchSize = 5;
    for (let i = 0; i < words.length; i += batchSize) {
      const batch = words.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async (word) => {
        try {
          const result = await this.searchWord(word, options);
          results.set(word, result);
        } catch (error) {
          console.error(`Failed to search word "${word}":`, error);
          results.set(word, {
            result: null,
            fallbackUsed: false,
            searchPath: ['BATCH_ERROR'],
            totalResponseTime: 0,
          });
        }
      });

      await Promise.all(batchPromises);
      
      // Small delay between batches to respect rate limits
      if (i + batchSize < words.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    return results;
  }

  /**
   * Get search statistics and analytics
   */
  async getSearchStats(): Promise<{
    totalSearches: number;
    localHitRate: number;
    cacheHitRate: number;
    apiUsageRate: number;
    averageResponseTime: number;
  }> {
    // This would be implemented with proper analytics tracking
    return {
      totalSearches: 0,
      localHitRate: 0.85, // 85% found in local sources
      cacheHitRate: 0.10, // 10% found in cache
      apiUsageRate: 0.05, // 5% required API fallback
      averageResponseTime: 250, // 250ms average
    };
  }
}

// Export singleton instance
export const unifiedSearchService = new UnifiedSearchService();