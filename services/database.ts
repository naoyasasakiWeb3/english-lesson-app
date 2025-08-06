import * as SQLite from 'expo-sqlite';
import { StudySession, UserProgress, Word } from '../types';
import vocabularyData from './vocabulary.json';

const DATABASE_NAME = 'vocabmaster.db';

class DatabaseService {
  private db: SQLite.SQLiteDatabase | null = null;

  async init(): Promise<void> {
    try {
      this.db = await SQLite.openDatabaseAsync(DATABASE_NAME);
      await this.createTables();
      await this.seedInitialData();
    } catch (error) {
      console.error('Database initialization error:', error);
      throw error;
    }
  }

  private async createTables(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    // Words table
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS words (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        word TEXT UNIQUE NOT NULL,
        definition TEXT NOT NULL,
        pronunciation TEXT,
        difficulty INTEGER DEFAULT 1,
        category TEXT DEFAULT 'general',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // User progress table
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS user_progress (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        word_id INTEGER NOT NULL,
        attempts INTEGER DEFAULT 0,
        correct_attempts INTEGER DEFAULT 0,
        last_attempt_date DATETIME,
        mastery_level INTEGER DEFAULT 0,
        is_bookmarked BOOLEAN DEFAULT 0,
        FOREIGN KEY (word_id) REFERENCES words (id)
      );
    `);

    // Study sessions table
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS study_sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date DATE NOT NULL,
        duration_minutes INTEGER NOT NULL,
        words_studied INTEGER NOT NULL,
        correct_answers INTEGER NOT NULL,
        total_questions INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // CEFR Words table
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS cefr_words (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        word TEXT UNIQUE NOT NULL,
        pos TEXT,
        cefr_level TEXT NOT NULL,
        core_inventory INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Word Details table (for Words API data)
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS word_details (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        word_id INTEGER NOT NULL,
        definition TEXT,
        pronunciation TEXT,
        example_sentence TEXT,
        etymology TEXT,
        synonyms TEXT,
        antonyms TEXT,
        difficulty_score REAL,
        frequency_score REAL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (word_id) REFERENCES cefr_words (id)
      );
    `);

    // User CEFR Levels table
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS user_cefr_levels (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT DEFAULT 'default',
        current_level TEXT DEFAULT 'A1',
        target_level TEXT DEFAULT 'B2',
        last_assessment_date DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Enriched vocabulary tables
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS enriched_bookmarks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        word TEXT NOT NULL,
        cefr_level TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS enriched_progress (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        word TEXT NOT NULL,
        cefr_level TEXT NOT NULL,
        attempts INTEGER DEFAULT 0,
        correct_attempts INTEGER DEFAULT 0,
        mastery_level INTEGER DEFAULT 0,
        last_attempt_date DATETIME,
        is_weak BOOLEAN DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create indexes for better performance
    await this.db.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_words_difficulty ON words(difficulty);
      CREATE INDEX IF NOT EXISTS idx_words_category ON words(category);
      CREATE INDEX IF NOT EXISTS idx_user_progress_word_id ON user_progress(word_id);
      CREATE INDEX IF NOT EXISTS idx_study_sessions_date ON study_sessions(date);
      CREATE INDEX IF NOT EXISTS idx_cefr_words_level ON cefr_words(cefr_level);
      CREATE INDEX IF NOT EXISTS idx_cefr_words_word ON cefr_words(word);
      CREATE INDEX IF NOT EXISTS idx_word_details_word_id ON word_details(word_id);
      CREATE INDEX IF NOT EXISTS idx_enriched_bookmarks_word_level ON enriched_bookmarks(word, cefr_level);
      CREATE INDEX IF NOT EXISTS idx_enriched_progress_word_level ON enriched_progress(word, cefr_level);
    `);
  }

  private async seedInitialData(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    // Check if legacy words already exist
    const existingWords = await this.db.getFirstAsync('SELECT COUNT(*) as count FROM words');
    if (!existingWords || (existingWords as any).count === 0) {
      // Initial word data for testing (reduced set)
    const sampleWords = [
      { word: 'beautiful', definition: 'having beauty; pleasing to the senses or mind', difficulty: 1, category: 'general' },
      { word: 'difficult', definition: 'hard to do, deal with, or understand', difficulty: 1, category: 'general' },
      { word: 'knowledge', definition: 'information and skills acquired through experience or education', difficulty: 2, category: 'academic' },
      { word: 'remember', definition: 'have in or be able to bring to one\'s mind', difficulty: 1, category: 'general' },
      { word: 'important', definition: 'of great significance or value', difficulty: 1, category: 'general' },
      { word: 'understand', definition: 'perceive the intended meaning of words or actions', difficulty: 2, category: 'general' },
      { word: 'different', definition: 'not the same as another or each other', difficulty: 1, category: 'general' },
      { word: 'experience', definition: 'practical contact with and observation of facts or events', difficulty: 2, category: 'general' },
      { word: 'environment', definition: 'the surroundings or conditions in which a person lives', difficulty: 3, category: 'academic' },
      { word: 'technology', definition: 'the application of scientific knowledge for practical purposes', difficulty: 3, category: 'technology' },
      // Additional beginner words
      { word: 'house', definition: 'a building for human habitation', difficulty: 1, category: 'general' },
      { word: 'water', definition: 'a colorless, transparent liquid', difficulty: 1, category: 'general' },
      { word: 'friend', definition: 'a person whom one knows and with whom one has a bond', difficulty: 1, category: 'general' },
      { word: 'family', definition: 'a group consisting of parents and children', difficulty: 1, category: 'general' },
      { word: 'school', definition: 'an institution for educating children', difficulty: 1, category: 'general' },
      // Intermediate words
      { word: 'analyze', definition: 'examine methodically and in detail', difficulty: 2, category: 'academic' },
      { word: 'create', definition: 'bring something into existence', difficulty: 2, category: 'general' },
      { word: 'develop', definition: 'grow or cause to grow and become more mature', difficulty: 2, category: 'general' },
      { word: 'evaluate', definition: 'form an idea of the amount or value of', difficulty: 2, category: 'academic' },
      { word: 'process', definition: 'a series of actions or steps taken to achieve a result', difficulty: 2, category: 'general' },
      // Advanced words
      { word: 'sophisticated', definition: 'having great knowledge or experience', difficulty: 3, category: 'general' },
      { word: 'fundamental', definition: 'forming a necessary base or core', difficulty: 3, category: 'academic' },
      { word: 'comprehensive', definition: 'complete and including everything', difficulty: 3, category: 'academic' },
      { word: 'significant', definition: 'sufficiently great or important to be worthy of attention', difficulty: 3, category: 'academic' },
      { word: 'demonstrate', definition: 'clearly show the existence or truth of something', difficulty: 3, category: 'academic' }
    ];

    for (const word of sampleWords) {
      await this.db.runAsync(
        'INSERT INTO words (word, definition, difficulty, category) VALUES (?, ?, ?, ?)',
        [word.word, word.definition, word.difficulty, word.category]
      );
    }

      console.log(`Seeded ${sampleWords.length} legacy words`);
    }

    // Check if CEFR words already exist
    const existingCefrWords = await this.db.getFirstAsync('SELECT COUNT(*) as count FROM cefr_words');
    if (!existingCefrWords || (existingCefrWords as any).count === 0) {
      console.log('Seeding CEFR-J vocabulary data...');
      
      // Seed CEFR-J vocabulary data
      let seededCount = 0;
      const batchSize = 100;
      
      for (let i = 0; i < vocabularyData.vocabulary.length; i += batchSize) {
        const batch = vocabularyData.vocabulary.slice(i, i + batchSize);
        
        await this.db.withTransactionAsync(async () => {
          for (const item of batch) {
            try {
              await this.db!.runAsync(
                'INSERT INTO cefr_words (word, pos, cefr_level, core_inventory) VALUES (?, ?, ?, ?)',
                [item.word, item.pos, item.cefr, item.coreInventory1 || 0]
              );
              seededCount++;
            } catch {
              console.warn(`Skipping duplicate word: ${item.word}`);
            }
          }
        });
      }
      
      console.log(`Seeded ${seededCount} CEFR-J words`);
    }

    // Check if user CEFR level settings exist
    const existingUserLevel = await this.db.getFirstAsync('SELECT COUNT(*) as count FROM user_cefr_levels');
    if (!existingUserLevel || (existingUserLevel as any).count === 0) {
      await this.db.runAsync(
        'INSERT INTO user_cefr_levels (user_id, current_level, target_level) VALUES (?, ?, ?)',
        ['default', 'A1', 'B2']
      );
      console.log('Seeded default user CEFR level settings');
    }
  }

  // Word operations
  async getAllWords(): Promise<Word[]> {
    if (!this.db) throw new Error('Database not initialized');
    
    const result = await this.db.getAllAsync(`
      SELECT id, word, definition, pronunciation, difficulty, category, created_at as createdAt
      FROM words ORDER BY word ASC
    `);
    
    return result as Word[];
  }

  async getWordsByDifficulty(difficulty: number): Promise<Word[]> {
    if (!this.db) throw new Error('Database not initialized');
    
    const result = await this.db.getAllAsync(`
      SELECT id, word, definition, pronunciation, difficulty, category, created_at as createdAt
      FROM words WHERE difficulty = ? ORDER BY RANDOM()
    `, [difficulty]);
    
    return result as Word[];
  }

  async getWordsByCategory(category: string): Promise<Word[]> {
    if (!this.db) throw new Error('Database not initialized');
    
    const result = await this.db.getAllAsync(`
      SELECT id, word, definition, pronunciation, difficulty, category, created_at as createdAt
      FROM words WHERE category = ? ORDER BY RANDOM()
    `, [category]);
    
    return result as Word[];
  }

  async getRandomWords(limit: number = 20): Promise<Word[]> {
    if (!this.db) throw new Error('Database not initialized');
    
    const result = await this.db.getAllAsync(`
      SELECT id, word, definition, pronunciation, difficulty, category, created_at as createdAt
      FROM words ORDER BY RANDOM() LIMIT ?
    `, [limit]);
    
    return result as Word[];
  }

  async addWord(word: Omit<Word, 'id' | 'createdAt'>): Promise<number> {
    if (!this.db) throw new Error('Database not initialized');
    
    const result = await this.db.runAsync(
      'INSERT INTO words (word, definition, pronunciation, difficulty, category) VALUES (?, ?, ?, ?, ?)',
      [word.word, word.definition, word.pronunciation || '', word.difficulty, word.category]
    );
    
    return result.lastInsertRowId;
  }

  // CEFR Words operations
  async getCefrWordsByLevel(cefrLevel: string, limit?: number): Promise<any[]> {
    if (!this.db) throw new Error('Database not initialized');
    
    const query = limit 
      ? 'SELECT * FROM cefr_words WHERE cefr_level = ? ORDER BY RANDOM() LIMIT ?'
      : 'SELECT * FROM cefr_words WHERE cefr_level = ? ORDER BY word ASC';
    
    const params = limit ? [cefrLevel, limit] : [cefrLevel];
    const result = await this.db.getAllAsync(query, params);
    
    return result;
  }

  async getRandomCefrWords(cefrLevel: string, count: number = 20): Promise<any[]> {
    if (!this.db) throw new Error('Database not initialized');
    
    // より多くの候補を取得してアプリケーション側でランダム化
    const candidateCount = Math.min(count * 5, 1000); // 最大1000個まで
    
    const result = await this.db.getAllAsync(`
      SELECT cw.*, wd.definition, wd.pronunciation, wd.example_sentence,
             wd.synonyms, wd.antonyms, wd.difficulty_score
      FROM cefr_words cw
      LEFT JOIN word_details wd ON cw.id = wd.word_id
      WHERE cw.cefr_level = ? 
      ORDER BY RANDOM() 
      LIMIT ?
    `, [cefrLevel, candidateCount]);
    
    if (result.length === 0) {
      return [];
    }
    
    // アプリケーション側で追加のランダム化を実行
    const shuffled = this.enhancedRandomSelection(result);
    
    // 要求された数まで切り詰め
    return shuffled.slice(0, count);
  }

  // 強化されたランダム選択（アルファベット順の偏りを防ぐ）
  private enhancedRandomSelection<T>(array: T[]): T[] {
    const shuffled = [...array];
    
    // Step 1: Fisher-Yates shuffle
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    
    // Step 2: グループベースの追加ランダム化
    const groupSize = Math.ceil(shuffled.length / 8);
    for (let group = 0; group < 8; group++) {
      const start = group * groupSize;
      const end = Math.min(start + groupSize, shuffled.length);
      
      // グループ内でさらにシャッフル
      for (let i = end - 1; i > start; i--) {
        const j = start + Math.floor(Math.random() * (i - start + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
    }
    
    // Step 3: 最終的なクロスシャッフル
    for (let i = 0; i < Math.min(50, shuffled.length); i++) {
      const randomIndex = Math.floor(Math.random() * shuffled.length);
      [shuffled[i], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[i]];
    }
    
    return shuffled;
  }

  async getCefrWordById(wordId: number): Promise<any | null> {
    if (!this.db) throw new Error('Database not initialized');
    
    const result = await this.db.getFirstAsync(`
      SELECT cw.*, wd.definition, wd.pronunciation, wd.example_sentence, 
             wd.synonyms, wd.antonyms, wd.difficulty_score
      FROM cefr_words cw
      LEFT JOIN word_details wd ON cw.id = wd.word_id
      WHERE cw.id = ?
    `, [wordId]);
    
    return result;
  }

  async searchCefrWords(searchTerm: string, cefrLevel?: string): Promise<any[]> {
    if (!this.db) throw new Error('Database not initialized');
    
    let query = `
      SELECT cw.*, wd.definition 
      FROM cefr_words cw 
      LEFT JOIN word_details wd ON cw.id = wd.word_id
      WHERE cw.word LIKE ?
    `;
    let params = [`%${searchTerm}%`];
    
    if (cefrLevel) {
      query += ' AND cw.cefr_level = ?';
      params.push(cefrLevel);
    }
    
    query += ' ORDER BY cw.word ASC LIMIT 50';
    
    const result = await this.db.getAllAsync(query, params);
    return result;
  }

  // User CEFR Level operations
  async getUserCefrLevel(): Promise<any> {
    if (!this.db) throw new Error('Database not initialized');
    
    const result = await this.db.getFirstAsync(
      'SELECT * FROM user_cefr_levels WHERE user_id = ?',
      ['default']
    );
    
    return result || { current_level: 'A1', target_level: 'B2' };
  }

  async updateUserCefrLevel(currentLevel: string, targetLevel?: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    const existing = await this.getUserCefrLevel();
    
    if (existing.id) {
      await this.db.runAsync(`
        UPDATE user_cefr_levels 
        SET current_level = ?, target_level = ?, updated_at = CURRENT_TIMESTAMP
        WHERE user_id = ?
      `, [currentLevel, targetLevel || existing.target_level, 'default']);
    } else {
      await this.db.runAsync(
        'INSERT INTO user_cefr_levels (user_id, current_level, target_level) VALUES (?, ?, ?)',
        ['default', currentLevel, targetLevel || 'B2']
      );
    }
  }

  // Word Details operations
  async addWordDetails(wordId: number, details: {
    definition?: string;
    pronunciation?: string;
    example_sentence?: string;
    etymology?: string;
    synonyms?: string;
    antonyms?: string;
    difficulty_score?: number;
    frequency_score?: number;
  }): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    await this.db.runAsync(`
      INSERT OR REPLACE INTO word_details 
      (word_id, definition, pronunciation, example_sentence, etymology, synonyms, antonyms, difficulty_score, frequency_score)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      wordId,
      details.definition || null,
      details.pronunciation || null,
      details.example_sentence || null,
      details.etymology || null,
      details.synonyms || null,
      details.antonyms || null,
      details.difficulty_score || null,
      details.frequency_score || null
    ]);
  }

  async getCefrLevelStats(): Promise<{[level: string]: number}> {
    if (!this.db) throw new Error('Database not initialized');
    
    const result = await this.db.getAllAsync(`
      SELECT cefr_level, COUNT(*) as count 
      FROM cefr_words 
      GROUP BY cefr_level 
      ORDER BY cefr_level
    `);
    
    const stats: {[level: string]: number} = {};
    result.forEach((row: any) => {
      stats[row.cefr_level] = row.count;
    });
    
    return stats;
  }

  async getAllCefrWords(): Promise<any[]> {
    if (!this.db) throw new Error('Database not initialized');
    
    const result = await this.db.getAllAsync(`
      SELECT * FROM cefr_words ORDER BY word ASC
    `);
    
    return result;
  }

  // User progress operations
  async getUserProgress(wordId: number): Promise<UserProgress | null> {
    if (!this.db) throw new Error('Database not initialized');
    
    const result = await this.db.getFirstAsync(`
      SELECT id, word_id as wordId, attempts, correct_attempts as correctAttempts,
             last_attempt_date as lastAttemptDate, mastery_level as masteryLevel,
             is_bookmarked as isBookmarked
      FROM user_progress WHERE word_id = ?
    `, [wordId]);
    
    return result as UserProgress | null;
  }

  async updateUserProgress(wordId: number, isCorrect: boolean): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    const existing = await this.getUserProgress(wordId);
    
    if (existing) {
      const newCorrectAttempts = existing.correctAttempts + (isCorrect ? 1 : 0);
      const newAttempts = existing.attempts + 1;
      const newMasteryLevel = Math.round((newCorrectAttempts / newAttempts) * 100);
      
      await this.db.runAsync(`
        UPDATE user_progress 
        SET attempts = ?, correct_attempts = ?, last_attempt_date = CURRENT_TIMESTAMP, mastery_level = ?
        WHERE word_id = ?
      `, [newAttempts, newCorrectAttempts, newMasteryLevel, wordId]);
    } else {
      const masteryLevel = isCorrect ? 100 : 0;
      await this.db.runAsync(`
        INSERT INTO user_progress (word_id, attempts, correct_attempts, last_attempt_date, mastery_level)
        VALUES (?, 1, ?, CURRENT_TIMESTAMP, ?)
      `, [wordId, isCorrect ? 1 : 0, masteryLevel]);
    }
  }

  async toggleBookmark(wordId: number): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    const existing = await this.getUserProgress(wordId);
    
    if (existing) {
      await this.db.runAsync(
        'UPDATE user_progress SET is_bookmarked = ? WHERE word_id = ?',
        [!existing.isBookmarked, wordId]
      );
    } else {
      await this.db.runAsync(
        'INSERT INTO user_progress (word_id, is_bookmarked) VALUES (?, 1)',
        [wordId]
      );
    }
  }

  async getBookmarkedWords(): Promise<Word[]> {
    if (!this.db) throw new Error('Database not initialized');
    
    const result = await this.db.getAllAsync(`
      SELECT w.id, w.word, w.definition, w.pronunciation, w.difficulty, w.category, w.created_at as createdAt
      FROM words w
      INNER JOIN user_progress up ON w.id = up.word_id
      WHERE up.is_bookmarked = 1
      ORDER BY w.word ASC
    `);
    
    return result as Word[];
  }

  async getWeakWords(): Promise<Word[]> {
    if (!this.db) throw new Error('Database not initialized');
    
    const result = await this.db.getAllAsync(`
      SELECT w.id, w.word, w.definition, w.pronunciation, w.difficulty, w.category, w.created_at as createdAt
      FROM words w
      INNER JOIN user_progress up ON w.id = up.word_id
      WHERE up.mastery_level < 50 AND up.attempts >= 3
      ORDER BY up.mastery_level ASC
    `);
    
    return result as Word[];
  }

  // Enriched vocabulary用のブックマーク・進捗管理メソッド
  async toggleEnrichedWordBookmark(word: string, cefrLevel: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    try {
      console.log(`Toggling bookmark for enriched word: ${word} (${cefrLevel})`);
      
      // まず既存のブックマークを確認
      const existing = await this.db.getFirstAsync(`
        SELECT id FROM enriched_bookmarks 
        WHERE word = ? AND cefr_level = ?
      `, [word, cefrLevel]);

      if (existing) {
        // 既にブックマークされていれば削除
        await this.db.runAsync(`
          DELETE FROM enriched_bookmarks 
          WHERE word = ? AND cefr_level = ?
        `, [word, cefrLevel]);
        console.log(`Removed bookmark for word: ${word} (${cefrLevel})`);
      } else {
        // ブックマークされていなければ追加
        await this.db.runAsync(`
          INSERT INTO enriched_bookmarks (word, cefr_level, created_at)
          VALUES (?, ?, datetime('now'))
        `, [word, cefrLevel]);
        console.log(`Added bookmark for word: ${word} (${cefrLevel})`);
      }
      
      // 確認のためブックマーク数を取得
      const count = await this.db.getFirstAsync(`
        SELECT COUNT(*) as count FROM enriched_bookmarks
      `) as any;
      console.log(`Total enriched bookmarks: ${count?.count || 0}`);
      
    } catch (error) {
      console.error('Error toggling enriched word bookmark:', error);
      throw error;
    }
  }

  async isEnrichedWordBookmarked(word: string, cefrLevel: string): Promise<boolean> {
    if (!this.db) throw new Error('Database not initialized');
    
    try {
      const result = await this.db.getFirstAsync(`
        SELECT id FROM enriched_bookmarks 
        WHERE word = ? AND cefr_level = ?
      `, [word, cefrLevel]);
      
      return !!result;
    } catch (error) {
      console.error('Error checking enriched word bookmark:', error);
      return false;
    }
  }

  async getEnrichedBookmarkedWords(): Promise<{word: string; cefr_level: string; created_at: string}[]> {
    if (!this.db) throw new Error('Database not initialized');
    
    try {
      const result = await this.db.getAllAsync(`
        SELECT word, cefr_level, created_at
        FROM enriched_bookmarks 
        ORDER BY created_at DESC
      `);
      
      return result as {word: string; cefr_level: string; created_at: string}[];
    } catch (error) {
      console.error('Error getting enriched bookmarked words:', error);
      return [];
    }
  }

  async updateEnrichedWordProgress(word: string, cefrLevel: string, isCorrect: boolean): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    try {
      console.log(`Updating progress for enriched word: ${word} (${cefrLevel}) - ${isCorrect ? 'correct' : 'incorrect'}`);
      
      // 既存の進捗レコードを確認
      const existing = await this.db.getFirstAsync(`
        SELECT * FROM enriched_progress 
        WHERE word = ? AND cefr_level = ?
      `, [word, cefrLevel]) as any;

      if (existing) {
        // 既存レコードを更新
        const newAttempts = existing.attempts + 1;
        const newCorrectAttempts = existing.correct_attempts + (isCorrect ? 1 : 0);
        const newMasteryLevel = Math.min(100, Math.round((newCorrectAttempts / newAttempts) * 100));
        
        await this.db.runAsync(`
          UPDATE enriched_progress 
          SET attempts = ?, correct_attempts = ?, mastery_level = ?, 
              last_attempt_date = datetime('now'), is_weak = ?
          WHERE word = ? AND cefr_level = ?
        `, [newAttempts, newCorrectAttempts, newMasteryLevel, newMasteryLevel < 60, word, cefrLevel]);
        
        console.log(`Updated progress: ${word} - attempts: ${newAttempts}, correct: ${newCorrectAttempts}, mastery: ${newMasteryLevel}%`);
      } else {
        // 新しいレコードを作成
        const masteryLevel = isCorrect ? 100 : 0;
        await this.db.runAsync(`
          INSERT INTO enriched_progress 
          (word, cefr_level, attempts, correct_attempts, mastery_level, last_attempt_date, is_weak)
          VALUES (?, ?, 1, ?, ?, datetime('now'), ?)
        `, [word, cefrLevel, isCorrect ? 1 : 0, masteryLevel, masteryLevel < 60]);
        
        console.log(`Created new progress record: ${word} - mastery: ${masteryLevel}%`);
      }
      
      console.log(`Updated progress for word: ${word} (${isCorrect ? 'correct' : 'incorrect'})`);
    } catch (error) {
      console.error('Error updating enriched word progress:', error);
      throw error;
    }
  }

  async getEnrichedWeakWords(): Promise<Array<{word: string; cefr_level: string; attempts: number; correct_attempts: number; mastery_level: number}>> {
    if (!this.db) throw new Error('Database not initialized');
    
    try {
      const result = await this.db.getAllAsync(`
        SELECT word, cefr_level, attempts, correct_attempts, mastery_level
        FROM enriched_progress 
        WHERE is_weak = 1 
        ORDER BY mastery_level ASC, last_attempt_date DESC
        LIMIT 50
      `);
      
      return result as Array<{word: string; cefr_level: string; attempts: number; correct_attempts: number; mastery_level: number}>;
    } catch (error) {
      console.error('Error getting enriched weak words:', error);
      return [];
    }
  }

  async removeEnrichedBookmark(word: string, cefrLevel: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    try {
      console.log(`Removing enriched bookmark: ${word} (${cefrLevel})`);
      
      await this.db.runAsync(`
        DELETE FROM enriched_bookmarks 
        WHERE word = ? AND cefr_level = ?
      `, [word, cefrLevel]);
      
      console.log(`Successfully removed enriched bookmark: ${word} (${cefrLevel})`);
    } catch (error) {
      console.error('Error removing enriched bookmark:', error);
      throw error;
    }
  }

  // Study session operations
  async saveStudySession(session: Omit<StudySession, 'id'>): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    await this.db.runAsync(`
      INSERT INTO study_sessions (date, duration_minutes, words_studied, correct_answers, total_questions)
      VALUES (?, ?, ?, ?, ?)
    `, [
      session.date.toISOString().split('T')[0],
      session.durationMinutes,
      session.wordsStudied,
      session.correctAnswers,
      session.totalQuestions
    ]);
  }

  async getStudySessionsByDate(startDate: Date, endDate: Date): Promise<StudySession[]> {
    if (!this.db) throw new Error('Database not initialized');
    
    const result = await this.db.getAllAsync(`
      SELECT id, date, duration_minutes as durationMinutes, words_studied as wordsStudied,
             correct_answers as correctAnswers, total_questions as totalQuestions
      FROM study_sessions
      WHERE date >= ? AND date <= ?
      ORDER BY date DESC
    `, [startDate.toISOString().split('T')[0], endDate.toISOString().split('T')[0]]);
    
    return result.map((session: any) => ({
      ...session,
      date: new Date(session.date)
    })) as StudySession[];
  }

  async getTodayStats(): Promise<{ studyTime: number; wordsStudied: number; accuracy: number }> {
    if (!this.db) throw new Error('Database not initialized');
    
    const today = new Date().toISOString().split('T')[0];
    const result = await this.db.getFirstAsync(`
      SELECT 
        COALESCE(SUM(duration_minutes), 0) as studyTime,
        COALESCE(SUM(words_studied), 0) as wordsStudied,
        CASE 
          WHEN SUM(total_questions) > 0 
          THEN ROUND((SUM(correct_answers) * 100.0) / SUM(total_questions), 1)
          ELSE 0 
        END as accuracy
      FROM study_sessions
      WHERE date = ?
    `, [today]);
    
    return result as { studyTime: number; wordsStudied: number; accuracy: number };
  }
}

export const databaseService = new DatabaseService();