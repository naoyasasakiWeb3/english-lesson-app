import { EnhancedMeaning, DefinitionMetadata } from '../../types';

describe('Enhanced TypeScript Interfaces', () => {
  describe('DefinitionMetadata interface', () => {
    it('should support all required metadata fields', () => {
      const metadata: DefinitionMetadata = {
        source: 'wordsapi',
        definitionId: 'test-1',
        migrated: true,
        originalId: 123,
        originalIndex: 0,
        confidenceScore: 0.95,
        lastUpdated: '2025-09-01T00:00:00.000Z'
      };

      expect(metadata.source).toBe('wordsapi');
      expect(metadata.definitionId).toBe('test-1');
      expect(metadata.migrated).toBe(true);
      expect(metadata.originalId).toBe(123);
      expect(metadata.originalIndex).toBe(0);
      expect(metadata.confidenceScore).toBe(0.95);
      expect(metadata.lastUpdated).toBe('2025-09-01T00:00:00.000Z');
    });

    it('should support all source types', () => {
      const sources: DefinitionMetadata['source'][] = ['legacy', 'wordsapi', 'cefr', 'external'];
      
      sources.forEach(source => {
        const metadata: DefinitionMetadata = { source };
        expect(metadata.source).toBe(source);
      });
    });
  });

  describe('EnhancedMeaning interface', () => {
    it('should support enhanced meaning structure with metadata', () => {
      const meaning: EnhancedMeaning = {
        partOfSpeech: 'noun',
        definition: 'test definition',
        example: 'test example',
        source: 'wordsapi',
        metadata: {
          source: 'wordsapi',
          definitionId: 'test-meaning-1',
          originalIndex: 0,
          lastUpdated: '2025-09-01T00:00:00.000Z'
        }
      };

      expect(meaning.partOfSpeech).toBe('noun');
      expect(meaning.definition).toBe('test definition');
      expect(meaning.example).toBe('test example');
      expect(meaning.source).toBe('wordsapi');
      expect(meaning.metadata?.source).toBe('wordsapi');
    });

    it('should work with minimal required fields', () => {
      const meaning: EnhancedMeaning = {
        partOfSpeech: 'unknown',
        definition: 'minimal definition'
      };

      expect(meaning.partOfSpeech).toBe('unknown');
      expect(meaning.definition).toBe('minimal definition');
      expect(meaning.example).toBeUndefined();
      expect(meaning.source).toBeUndefined();
      expect(meaning.metadata).toBeUndefined();
    });
  });

  describe('WordData interface compatibility', () => {
    it('should support enhanced meanings in WordData structure', () => {
      const enhancedMeanings: EnhancedMeaning[] = [
        {
          partOfSpeech: 'noun',
          definition: 'first definition',
          source: 'wordsapi',
          metadata: { source: 'wordsapi', definitionId: 'test-0', originalIndex: 0, lastUpdated: '2025-09-01T00:00:00.000Z' }
        },
        {
          partOfSpeech: 'verb', 
          definition: 'second definition',
          source: 'wordsapi',
          metadata: { source: 'wordsapi', definitionId: 'test-1', originalIndex: 1, lastUpdated: '2025-09-01T00:00:00.000Z' }
        }
      ];

      // This should compile without TypeScript errors
      const wordData = {
        word: 'test',
        meanings: enhancedMeanings,
        pronunciation: { phonetic: 'test' },
        synonyms: [],
        antonyms: []
      };

      expect(wordData.meanings).toHaveLength(2);
      expect(wordData.meanings[0].metadata?.source).toBe('wordsapi');
    });
  });
});