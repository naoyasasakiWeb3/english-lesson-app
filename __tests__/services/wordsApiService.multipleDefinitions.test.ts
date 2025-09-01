import { WordsApiService } from '../../services/wordsApiService';
import { EnhancedMeaning } from '../../types';

// Mock dependencies
jest.mock('@react-native-async-storage/async-storage');
jest.mock('expo-secure-store');

describe('WordsApiService - Multiple Definitions Enhancement', () => {
  let wordsApiService: WordsApiService;

  beforeEach(() => {
    wordsApiService = new WordsApiService();
  });

  describe('transformApiResponse - Multiple Definitions Extraction', () => {
    it('should extract all definitions with metadata from definitions array', () => {
      const mockApiResponse = {
        word: 'test',
        definitions: [
          {
            definition: 'first meaning',
            partOfSpeech: 'noun',
            examples: ['example 1']
          },
          {
            definition: 'second meaning', 
            partOfSpeech: 'verb',
            examples: ['example 2']
          }
        ],
        pronunciation: { all: 'test-pronunciation' },
        synonyms: ['synonym1'],
        antonyms: ['antonym1']
      };

      // Access private method for testing
      const result = (wordsApiService as any).transformApiResponse(mockApiResponse);

      expect(result.meanings).toHaveLength(2);
      expect(result.meanings[0].definition).toBe('first meaning');
      expect(result.meanings[0].partOfSpeech).toBe('noun');
      expect(result.meanings[0].source).toBe('wordsapi');
      expect(result.meanings[0].metadata?.source).toBe('wordsapi');
      expect(result.meanings[0].metadata?.definitionId).toBe('test-api-0');
      expect(result.meanings[0].metadata?.originalIndex).toBe(0);

      expect(result.meanings[1].definition).toBe('second meaning');
      expect(result.meanings[1].partOfSpeech).toBe('verb');
      expect(result.meanings[1].metadata?.originalIndex).toBe(1);
    });

    it('should handle results field with metadata extraction', () => {
      const mockApiResponse = {
        word: 'test',
        results: [
          {
            definition: 'result definition',
            partOfSpeech: 'adjective',
            examples: ['result example']
          }
        ],
        pronunciation: { all: 'test-pronunciation' }
      };

      const result = (wordsApiService as any).transformApiResponse(mockApiResponse);

      expect(result.meanings).toHaveLength(1);
      expect(result.meanings[0].definition).toBe('result definition');
      expect(result.meanings[0].partOfSpeech).toBe('adjective');
      expect(result.meanings[0].metadata?.definitionId).toBe('test-results-0');
    });

    it('should handle single definition field with metadata', () => {
      const mockApiResponse = {
        word: 'test',
        definition: 'single definition',
        pronunciation: { all: 'test-pronunciation' }
      };

      const result = (wordsApiService as any).transformApiResponse(mockApiResponse);

      expect(result.meanings).toHaveLength(1);
      expect(result.meanings[0].definition).toBe('single definition');
      expect(result.meanings[0].partOfSpeech).toBe('unknown');
      expect(result.meanings[0].metadata?.definitionId).toBe('test-single-0');
    });

    it('should handle meaning field with metadata', () => {
      const mockApiResponse = {
        word: 'test',
        meaning: 'meaning field definition',
        pronunciation: { all: 'test-pronunciation' }
      };

      const result = (wordsApiService as any).transformApiResponse(mockApiResponse);

      expect(result.meanings).toHaveLength(1);
      expect(result.meanings[0].definition).toBe('meaning field definition');
      expect(result.meanings[0].metadata?.definitionId).toBe('test-meaning-0');
    });

    it('should include lastUpdated timestamp in metadata', () => {
      const mockApiResponse = {
        word: 'test',
        definitions: [{ definition: 'test', partOfSpeech: 'noun' }]
      };

      const result = (wordsApiService as any).transformApiResponse(mockApiResponse);

      expect(result.meanings[0].metadata?.lastUpdated).toBeDefined();
      expect(new Date(result.meanings[0].metadata!.lastUpdated!)).toBeInstanceOf(Date);
    });
  });

  describe('Error Handling for Malformed Definition Arrays', () => {
    it('should handle empty definitions array gracefully', () => {
      const mockApiResponse = {
        word: 'test',
        definitions: [],
        pronunciation: { all: 'test-pronunciation' }
      };

      const result = (wordsApiService as any).transformApiResponse(mockApiResponse);

      expect(result.meanings).toHaveLength(0);
      expect(result.word).toBe('test');
    });

    it('should handle malformed definition objects', () => {
      const mockApiResponse = {
        word: 'test',
        definitions: [
          { /* missing definition field */ },
          { definition: 'valid definition', partOfSpeech: 'noun' }
        ]
      };

      const result = (wordsApiService as any).transformApiResponse(mockApiResponse);

      expect(result.meanings).toHaveLength(2);
      expect(result.meanings[0].definition).toBe(''); // Empty string for missing definition
      expect(result.meanings[1].definition).toBe('valid definition');
    });
  });
});