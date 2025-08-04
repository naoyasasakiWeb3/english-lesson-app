import * as SQLite from 'expo-sqlite';
import { Word, UserProgress, StudySession } from '../types';

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

    // Create indexes for better performance
    await this.db.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_words_difficulty ON words(difficulty);
      CREATE INDEX IF NOT EXISTS idx_words_category ON words(category);
      CREATE INDEX IF NOT EXISTS idx_user_progress_word_id ON user_progress(word_id);
      CREATE INDEX IF NOT EXISTS idx_study_sessions_date ON study_sessions(date);
    `);
  }

  private async seedInitialData(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    // Check if data already exists
    const existingWords = await this.db.getFirstAsync('SELECT COUNT(*) as count FROM words');
    if (existingWords && (existingWords as any).count > 0) {
      return; // Data already seeded
    }

    // Initial word data for testing
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

    console.log(`Seeded ${sampleWords.length} initial words`);
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
    
    return result.map(session => ({
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