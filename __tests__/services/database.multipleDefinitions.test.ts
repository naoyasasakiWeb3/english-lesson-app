import { DatabaseService } from '../../services/database';
import { EnhancedMeaning } from '../../types';

// Mock expo-sqlite
const mockExecAsync = jest.fn();
const mockRunAsync = jest.fn();
const mockGetAllAsync = jest.fn();
const mockGetFirstAsync = jest.fn();

jest.mock('expo-sqlite', () => ({
  openDatabaseAsync: jest.fn(() => Promise.resolve({
    execAsync: mockExecAsync,
    runAsync: mockRunAsync,
    getAllAsync: mockGetAllAsync,
    getFirstAsync: mockGetFirstAsync,
  })),
}));

describe('DatabaseService - Multiple Definitions Enhancement', () => {
  let databaseService: DatabaseService;

  beforeEach(() => {
    jest.clearAllMocks();
    databaseService = new DatabaseService();
  });

  describe('Database Schema Migration', () => {
    it('should add definitions_array column during migration', async () => {
      // Mock PRAGMA table_info response - no definitions_array column exists
      mockGetAllAsync.mockResolvedValueOnce([
        { name: 'id' },
        { name: 'word_id' },
        { name: 'definition' },
        { name: 'pronunciation' }
      ]);

      // Mock existing records for migration
      mockGetAllAsync.mockResolvedValueOnce([
        { id: 1, definition: 'test definition', example_sentence: 'test example' }
      ]);

      // Mock external words for migration
      mockGetAllAsync.mockResolvedValueOnce([
        { id: 1, word: 'test', definitions: '[{"definition": "old format"}]' }
      ]);

      // Initialize database (triggers migration)
      await databaseService.init();

      // Verify ALTER TABLE commands were executed
      expect(mockExecAsync).toHaveBeenCalledWith(
        expect.stringContaining('ALTER TABLE word_details ADD COLUMN definitions_array TEXT')
      );
      expect(mockExecAsync).toHaveBeenCalledWith(
        expect.stringContaining('ALTER TABLE word_details ADD COLUMN updated_at DATETIME')
      );
    });

    it('should migrate existing single definitions to multiple definitions format', async () => {
      mockGetAllAsync.mockImplementation((query: string) => {
        if (query.includes('PRAGMA table_info')) {
          return Promise.resolve([{ name: 'id' }, { name: 'definition' }]);
        }
        if (query.includes('WHERE definitions_array IS NULL')) {
          return Promise.resolve([
            { id: 1, definition: 'original definition', example_sentence: 'example' }
          ]);
        }
        if (query.includes('external_words')) {
          return Promise.resolve([]);
        }
        return Promise.resolve([]);
      });

      await databaseService.init();

      // Verify migration UPDATE was called with proper JSON structure
      expect(mockRunAsync).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE word_details'),
        expect.arrayContaining([
          expect.stringContaining('"definition":"original definition"'),
          1
        ])
      );
    });
  });

  describe('Enhanced TypeScript Interfaces', () => {
    it('should handle EnhancedMeaning structure correctly', () => {
      const testMeaning: EnhancedMeaning = {
        partOfSpeech: 'noun',
        definition: 'test definition',
        example: 'test example',
        source: 'wordsapi',
        metadata: {
          source: 'wordsapi',
          definitionId: 'test-1',
          originalIndex: 0,
          lastUpdated: '2025-09-01T00:00:00.000Z'
        }
      };

      expect(testMeaning.metadata?.source).toBe('wordsapi');
      expect(testMeaning.source).toBe('wordsapi');
      expect(testMeaning.metadata?.originalIndex).toBe(0);
    });
  });

  describe('addWordDetails - Multiple Definitions Support', () => {
    it('should store multiple definitions with metadata', async () => {
      const multipleDefinitions: EnhancedMeaning[] = [
        {
          partOfSpeech: 'noun',
          definition: 'first meaning',
          source: 'wordsapi',
          metadata: { source: 'wordsapi', definitionId: 'test-0', originalIndex: 0, lastUpdated: '2025-09-01T00:00:00.000Z' }
        },
        {
          partOfSpeech: 'verb',
          definition: 'second meaning',
          source: 'wordsapi',
          metadata: { source: 'wordsapi', definitionId: 'test-1', originalIndex: 1, lastUpdated: '2025-09-01T00:00:00.000Z' }
        }
      ];

      await databaseService.addWordDetails(1, { definitions: multipleDefinitions });

      expect(mockRunAsync).toHaveBeenCalledWith(
        expect.stringContaining('INSERT OR REPLACE INTO word_details'),
        expect.arrayContaining([
          1, // wordId
          'first meaning', // backward compatibility definition
          expect.stringContaining('"definition":"first meaning"'), // definitions_array JSON
          null, null, null, null, null, null, null
        ])
      );
    });

    it('should maintain backward compatibility with single definition', async () => {
      await databaseService.addWordDetails(1, { 
        definition: 'single definition',
        example_sentence: 'example'
      });

      expect(mockRunAsync).toHaveBeenCalledWith(
        expect.stringContaining('INSERT OR REPLACE INTO word_details'),
        expect.arrayContaining([
          1,
          'single definition',
          expect.stringContaining('"source":"legacy"'),
          null, 'example', null, null, null, null, null
        ])
      );
    });
  });

  describe('getWordDetailsWithDefinitions - Backward Compatibility', () => {
    it('should return definitions array from definitions_array column', async () => {
      const mockDefinitions = [
        {
          partOfSpeech: 'noun',
          definition: 'first meaning',
          source: 'wordsapi',
          metadata: { source: 'wordsapi', definitionId: 'test-0' }
        }
      ];

      mockGetFirstAsync.mockResolvedValueOnce({
        id: 1,
        definition: 'first meaning',
        definitions_array: JSON.stringify(mockDefinitions),
        pronunciation: 'test-pronunciation'
      });

      const result = await databaseService.getWordDetailsWithDefinitions(1);

      expect(result?.definitions).toHaveLength(1);
      expect(result?.definitions[0].definition).toBe('first meaning');
      expect(result?.definitions[0].metadata?.source).toBe('wordsapi');
    });

    it('should fallback to single definition when definitions_array is empty', async () => {
      mockGetFirstAsync.mockResolvedValueOnce({
        id: 1,
        definition: 'fallback definition',
        definitions_array: null,
        example_sentence: 'fallback example'
      });

      const result = await databaseService.getWordDetailsWithDefinitions(1);

      expect(result?.definitions).toHaveLength(1);
      expect(result?.definitions[0].definition).toBe('fallback definition');
      expect(result?.definitions[0].source).toBe('legacy');
      expect(result?.definitions[0].example).toBe('fallback example');
    });
  });
});