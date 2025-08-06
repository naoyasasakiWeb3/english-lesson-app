import { databaseService } from './database';
import { wordsApiService } from './wordsApi';

export interface CefrQuizWord {
  id: number;
  word: string;
  pos?: string;
  cefr_level: string;
  definition?: string;
  pronunciation?: string;
  example_sentence?: string;
  synonyms?: string;
  antonyms?: string;
}

export interface QuizQuestion {
  word: CefrQuizWord;
  question: string;
  options: string[];
  correctAnswer: string;
  type: 'definition' | 'synonym' | 'antonym' | 'example';
}

class CefrQuizService {
  // 40単語をランダムに取得し、Words APIで詳細情報を取得する
  async getQuizWordsWithApiData(cefrLevel: string, totalWords: number = 40): Promise<CefrQuizWord[]> {
    try {
      console.log(`Fetching ${totalWords} fresh words for CEFR level: ${cefrLevel}`);
      
      // 常に新規で単語を取得（重複や取得失敗を考慮して多めに取得）
      const candidateWords = await databaseService.getRandomCefrWords(cefrLevel, totalWords * 3);
      
      if (candidateWords.length === 0) {
        throw new Error(`No words found for CEFR level: ${cefrLevel}`);
      }

      console.log(`Retrieved ${candidateWords.length} candidate words from database`);

      // ランダムシャッフルを強化して偏りを防ぐ
      const shuffledWords = this.enhancedShuffle(candidateWords);
      const selectedWords = shuffledWords.slice(0, totalWords);
      
      console.log(`Selected ${selectedWords.length} words for processing`);
      console.log(`Sample words: ${selectedWords.slice(0, 5).map(w => w.word).join(', ')}`);
      
      // Words APIが設定されている場合、並列で詳細情報を取得
      if (await wordsApiService.isApiKeyConfigured()) {
        console.log(`Fetching detailed data for ${selectedWords.length} words from Words API...`);
        
        // API制限を考慮して、バッチ処理で詳細情報を取得
        const enrichedWords = await this.enrichWordsInBatches(selectedWords);
        return enrichedWords;
      } else {
        console.log('Words API not configured, using basic word data');
        // APIが設定されていない場合は、既存の情報のみ使用
        return selectedWords as CefrQuizWord[];
      }
    } catch (error) {
      console.error('Error getting quiz words with API data:', error);
      throw new Error('Failed to get quiz words');
    }
  }

  // 単語を複数のバッチに分けて並列処理で詳細情報を取得
  private async enrichWordsInBatches(words: any[], batchSize: number = 8): Promise<CefrQuizWord[]> {
    const enrichedWords: CefrQuizWord[] = [];
    
    // バッチごとに処理
    for (let i = 0; i < words.length; i += batchSize) {
      const batch = words.slice(i, i + batchSize);
      
      console.log(`Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(words.length / batchSize)}`);
      
      // バッチ内の単語を並列で処理
      const batchPromises = batch.map(async (word): Promise<CefrQuizWord> => {
        try {
          // 既に詳細情報がある場合はスキップ
          if (word.definition) {
            return word as CefrQuizWord;
          }

          const enrichedData = await wordsApiService.enrichWordData(word.word);
          
          if (enrichedData.definition) {
            // データベースに詳細情報を保存
            await databaseService.addWordDetails(word.id, enrichedData);
            
            return {
              ...word,
              definition: enrichedData.definition,
              pronunciation: enrichedData.pronunciation,
              example_sentence: enrichedData.example_sentence,
              synonyms: enrichedData.synonyms,
              antonyms: enrichedData.antonyms,
            } as CefrQuizWord;
          } else {
            return word as CefrQuizWord;
          }
        } catch (error) {
          console.warn(`Failed to enrich word ${word.word}:`, error);
          return word as CefrQuizWord;
        }
      });
      
      const batchResults = await Promise.allSettled(batchPromises);
      
      // 成功した結果のみを追加
      batchResults.forEach(result => {
        if (result.status === 'fulfilled') {
          enrichedWords.push(result.value);
        }
      });
      
      // API制限を避けるため、バッチ間で少し待機
      if (i + batchSize < words.length) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    return enrichedWords;
  }

  async getQuizWords(cefrLevel: string, count: number = 20): Promise<CefrQuizWord[]> {
    try {
      const words = await databaseService.getRandomCefrWords(cefrLevel, count * 2); // Get more words for better selection
      
      // Filter words that have detailed information
      const wordsWithDetails = words.filter(word => word.definition || word.word.length > 2);
      
      return wordsWithDetails.slice(0, count) as CefrQuizWord[];
    } catch (error) {
      console.error('Error getting quiz words:', error);
      throw new Error('Failed to get quiz words');
    }
  }

  async generateQuizQuestions(words: CefrQuizWord[]): Promise<QuizQuestion[]> {
    const questions: QuizQuestion[] = [];
    
    for (const word of words) {
      try {
        // Try to get enriched data from Words API if available
        if (await wordsApiService.isApiKeyConfigured()) {
          try {
            const enrichedData = await wordsApiService.enrichWordData(word.word);
            
            if (enrichedData.definition && !word.definition) {
              // Update database with new data
              await databaseService.addWordDetails(word.id, enrichedData);
              word.definition = enrichedData.definition;
              word.pronunciation = enrichedData.pronunciation;
              word.example_sentence = enrichedData.example_sentence;
              word.synonyms = enrichedData.synonyms;
              word.antonyms = enrichedData.antonyms;
            }
          } catch (error) {
            console.warn(`Failed to enrich word ${word.word}:`, error);
          }
        }
        
        const question = await this.createQuestionForWord(word, words);
        if (question) {
          questions.push(question);
        }
      } catch (error) {
        console.warn(`Failed to create question for word ${word.word}:`, error);
      }
    }
    
    return questions;
  }

  // 新しいクイズ生成メソッド：40単語を取得して10問のクイズを作成
  async generateQuizWithFreshWords(cefrLevel: string, questionCount: number = 10): Promise<QuizQuestion[]> {
    try {
      console.log(`Generating quiz: ${questionCount} questions for CEFR level: ${cefrLevel}`);
      
      // 必ず40単語を新規取得（要件に従い、既存データに依存しない）
      const requiredWords = 40;
      const allWords = await this.getQuizWordsWithApiData(cefrLevel, requiredWords);
      
      if (allWords.length < questionCount) {
        // 40単語取得できなかった場合は、隣接レベルから補完して必ず10問にする
        console.log(`Insufficient words from ${cefrLevel} (${allWords.length}). Expanding to adjacent levels...`);
        const expandedWords = await this.expandWordPoolForQuiz(cefrLevel, requiredWords, allWords);
        
        if (expandedWords.length < questionCount) {
          throw new Error(`Could not gather enough words for ${questionCount} questions. Got: ${expandedWords.length}`);
        }
        
        return this.generateQuizFromWordPool(expandedWords, questionCount);
      }

      console.log(`Successfully retrieved ${allWords.length} words`);
      return this.generateQuizFromWordPool(allWords, questionCount);
    } catch (error) {
      console.error('Error generating quiz with fresh words:', error);
      throw error;
    }
  }

  // 40単語のプールから指定数のクイズを生成
  private async generateQuizFromWordPool(wordPool: CefrQuizWord[], questionCount: number): Promise<QuizQuestion[]> {
    console.log(`Generating ${questionCount} questions from ${wordPool.length} words`);
    
    // 詳細情報がある単語を優先的に正解候補として選択
    const wordsWithDefinitions = wordPool.filter(word => word.definition);
    const wordsWithoutDefinitions = wordPool.filter(word => !word.definition);
    
    console.log(`Words with definitions: ${wordsWithDefinitions.length}, without: ${wordsWithoutDefinitions.length}`);
    
    // 正解候補として使用する単語を選択（必要数を確保）
    let correctWords: CefrQuizWord[] = [];
    
    if (wordsWithDefinitions.length >= questionCount) {
      correctWords = this.enhancedShuffle(wordsWithDefinitions).slice(0, questionCount);
    } else {
      correctWords = [
        ...wordsWithDefinitions,
        ...this.enhancedShuffle(wordsWithoutDefinitions).slice(0, questionCount - wordsWithDefinitions.length)
      ];
    }

    // 不正解候補として使用する単語（正解候補以外の残り単語）
    const incorrectWords = wordPool.filter(word => 
      !correctWords.some(correctWord => correctWord.id === word.id)
    );

    console.log(`Selected ${correctWords.length} correct words and ${incorrectWords.length} incorrect words`);

    // 各正解単語に対してクイズ問題を生成
    const questions: QuizQuestion[] = [];
    
    for (let i = 0; i < correctWords.length; i++) {
      const word = correctWords[i];
      try {
        const question = await this.createQuestionForWordWithPool(word, incorrectWords);
        if (question) {
          questions.push(question);
        }
      } catch (error) {
        console.warn(`Failed to create question for word ${word.word}:`, error);
      }
    }

    if (questions.length < questionCount) {
      console.warn(`Only generated ${questions.length} questions out of ${questionCount} requested`);
    }

    console.log(`Successfully generated ${questions.length} questions`);
    return questions;
  }

  // 単語プールを拡張して必要数を確保
  private async expandWordPoolForQuiz(targetLevel: string, requiredWords: number, existingWords: CefrQuizWord[]): Promise<CefrQuizWord[]> {
    let combinedWords = [...existingWords];
    const adjacentLevels = this.getAdjacentCefrLevels(targetLevel);
    
    console.log(`Expanding word pool from ${combinedWords.length} words. Target: ${requiredWords}`);
    
    for (const adjLevel of adjacentLevels) {
      if (combinedWords.length >= requiredWords) break;
      
      const needed = requiredWords - combinedWords.length;
      console.log(`Fetching ${needed} additional words from ${adjLevel}`);
      
      try {
        const adjWords = await this.getQuizWordsWithApiData(adjLevel, needed);
        // 重複を避けて追加
        const uniqueAdjWords = adjWords.filter(adjWord => 
          !combinedWords.some(existingWord => existingWord.word === adjWord.word)
        );
        combinedWords = [...combinedWords, ...uniqueAdjWords];
        console.log(`Added ${uniqueAdjWords.length} unique words from ${adjLevel}. Total: ${combinedWords.length}`);
      } catch (error) {
        console.warn(`Failed to get words from ${adjLevel}:`, error);
      }
    }
    
    return combinedWords;
  }

  // CEFRレベルの隣接レベルを取得するヘルパーメソッド
  private getAdjacentCefrLevels(cefrLevel: string): string[] {
    const levels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
    const currentIndex = levels.indexOf(cefrLevel);
    
    if (currentIndex === -1) return ['A2', 'B1']; // デフォルト
    
    const adjacent: string[] = [];
    
    // 隣接する下位レベル
    if (currentIndex > 0) {
      adjacent.push(levels[currentIndex - 1]);
    }
    
    // 隣接する上位レベル
    if (currentIndex < levels.length - 1) {
      adjacent.push(levels[currentIndex + 1]);
    }
    
    // より遠いレベルも追加（必要に応じて）
    if (currentIndex > 1) {
      adjacent.push(levels[currentIndex - 2]);
    }
    if (currentIndex < levels.length - 2) {
      adjacent.push(levels[currentIndex + 2]);
    }
    
    return adjacent;
  }

  // 特定の不正解候補プールを使ってクイズ問題を作成
  private async createQuestionForWordWithPool(word: CefrQuizWord, incorrectWordsPool: CefrQuizWord[]): Promise<QuizQuestion | null> {
    // If we have a definition, create a definition question
    if (word.definition) {
      return this.createDefinitionQuestionWithPool(word, incorrectWordsPool);
    }
    
    // If we have synonyms, create a synonym question
    if (word.synonyms) {
      return this.createSynonymQuestionWithPool(word, incorrectWordsPool);
    }
    
    // If we have an example sentence, create an example question
    if (word.example_sentence) {
      return this.createExampleQuestionWithPool(word, incorrectWordsPool);
    }
    
    // Fallback: create a basic definition question using part of speech
    return this.createBasicQuestionWithPool(word, incorrectWordsPool);
  }

  private createDefinitionQuestionWithPool(word: CefrQuizWord, incorrectWordsPool: CefrQuizWord[]): QuizQuestion {
    // 不正解候補から3つの定義を選択
    const incorrectOptions = this.shuffleArray(incorrectWordsPool)
      .filter(w => w.definition && w.definition !== word.definition)
      .slice(0, 3)
      .map(w => w.definition!);
    
    // 足りない場合は基本的な定義を生成
    while (incorrectOptions.length < 3 && incorrectWordsPool.length > incorrectOptions.length) {
      const remainingWords = incorrectWordsPool.filter(w => 
        !incorrectOptions.includes(w.definition || '') && w.id !== word.id
      );
      
      if (remainingWords.length > 0) {
        const fallbackWord = remainingWords[0];
        incorrectOptions.push(fallbackWord.definition || `A ${fallbackWord.pos || 'word'} related to ${fallbackWord.word}`);
      } else {
        break;
      }
    }
    
    const options = [word.definition!, ...incorrectOptions];
    const shuffledOptions = this.shuffleArray(options);
    
    return {
      word,
      question: `What does "${word.word}" mean?`,
      options: shuffledOptions,
      correctAnswer: word.definition!,
      type: 'definition'
    };
  }

  private createSynonymQuestionWithPool(word: CefrQuizWord, incorrectWordsPool: CefrQuizWord[]): QuizQuestion {
    const synonyms = JSON.parse(word.synonyms!);
    const correctSynonym = synonyms[0];
    
    const incorrectOptions = this.shuffleArray(incorrectWordsPool)
      .slice(0, 3)
      .map(w => w.word);
    
    const options = [correctSynonym, ...incorrectOptions];
    const shuffledOptions = this.shuffleArray(options);
    
    return {
      word,
      question: `Which word is a synonym for "${word.word}"?`,
      options: shuffledOptions,
      correctAnswer: correctSynonym,
      type: 'synonym'
    };
  }

  private createExampleQuestionWithPool(word: CefrQuizWord, incorrectWordsPool: CefrQuizWord[]): QuizQuestion {
    const sentence = word.example_sentence!;
    const blankedSentence = sentence.replace(new RegExp(word.word, 'gi'), '____');
    
    const incorrectOptions = this.shuffleArray(incorrectWordsPool)
      .slice(0, 3)
      .map(w => w.word);
    
    const options = [word.word, ...incorrectOptions];
    const shuffledOptions = this.shuffleArray(options);
    
    return {
      word,
      question: `Fill in the blank: ${blankedSentence}`,
      options: shuffledOptions,
      correctAnswer: word.word,
      type: 'example'
    };
  }

  private createBasicQuestionWithPool(word: CefrQuizWord, incorrectWordsPool: CefrQuizWord[]): QuizQuestion {
    // Create a basic definition based on part of speech
    const basicDefinition = this.createBasicDefinition(word);
    
    const incorrectOptions = this.shuffleArray(incorrectWordsPool)
      .slice(0, 3)
      .map(w => this.createBasicDefinition(w));
    
    const options = [basicDefinition, ...incorrectOptions];
    const shuffledOptions = this.shuffleArray(options);
    
    return {
      word,
      question: `What type of word is "${word.word}"?`,
      options: shuffledOptions,
      correctAnswer: basicDefinition,
      type: 'definition'
    };
  }

  private async createQuestionForWord(word: CefrQuizWord, allWords: CefrQuizWord[]): Promise<QuizQuestion | null> {
    // If we have a definition, create a definition question
    if (word.definition) {
      return this.createDefinitionQuestion(word, allWords);
    }
    
    // If we have synonyms, create a synonym question
    if (word.synonyms) {
      return this.createSynonymQuestion(word, allWords);
    }
    
    // If we have an example sentence, create an example question
    if (word.example_sentence) {
      return this.createExampleQuestion(word, allWords);
    }
    
    // Fallback: create a basic definition question using part of speech
    return this.createBasicQuestion(word, allWords);
  }

  private createDefinitionQuestion(word: CefrQuizWord, allWords: CefrQuizWord[]): QuizQuestion {
    const otherWords = allWords.filter(w => w.id !== word.id).slice(0, 3);
    const options = [
      word.definition!,
      ...otherWords.map(w => w.definition || `A ${w.pos || 'word'} related to ${w.word}`).slice(0, 3)
    ];
    
    const shuffledOptions = this.shuffleArray(options);
    
    return {
      word,
      question: `What does "${word.word}" mean?`,
      options: shuffledOptions,
      correctAnswer: word.definition!,
      type: 'definition'
    };
  }

  private createSynonymQuestion(word: CefrQuizWord, allWords: CefrQuizWord[]): QuizQuestion {
    const synonyms = JSON.parse(word.synonyms!);
    const correctSynonym = synonyms[0];
    
    const otherWords = allWords.filter(w => w.id !== word.id).slice(0, 3);
    const options = [
      correctSynonym,
      ...otherWords.map(w => w.word).slice(0, 3)
    ];
    
    const shuffledOptions = this.shuffleArray(options);
    
    return {
      word,
      question: `Which word is a synonym for "${word.word}"?`,
      options: shuffledOptions,
      correctAnswer: correctSynonym,
      type: 'synonym'
    };
  }

  private createExampleQuestion(word: CefrQuizWord, allWords: CefrQuizWord[]): QuizQuestion {
    const sentence = word.example_sentence!;
    const blankedSentence = sentence.replace(new RegExp(word.word, 'gi'), '____');
    
    const otherWords = allWords.filter(w => w.id !== word.id).slice(0, 3);
    const options = [
      word.word,
      ...otherWords.map(w => w.word).slice(0, 3)
    ];
    
    const shuffledOptions = this.shuffleArray(options);
    
    return {
      word,
      question: `Fill in the blank: ${blankedSentence}`,
      options: shuffledOptions,
      correctAnswer: word.word,
      type: 'example'
    };
  }

  private createBasicQuestion(word: CefrQuizWord, allWords: CefrQuizWord[]): QuizQuestion {
    const otherWords = allWords.filter(w => w.id !== word.id).slice(0, 3);
    
    // Create a basic definition based on part of speech
    const basicDefinition = this.createBasicDefinition(word);
    
    const options = [
      basicDefinition,
      ...otherWords.map(w => this.createBasicDefinition(w)).slice(0, 3)
    ];
    
    const shuffledOptions = this.shuffleArray(options);
    
    return {
      word,
      question: `What type of word is "${word.word}"?`,
      options: shuffledOptions,
      correctAnswer: basicDefinition,
      type: 'definition'
    };
  }

  private createBasicDefinition(word: CefrQuizWord): string {
    const pos = word.pos || 'word';
    
    switch (pos.toLowerCase()) {
      case 'noun':
        return `A noun (person, place, or thing)`;
      case 'verb':
        return `A verb (action word)`;
      case 'adjective':
        return `An adjective (describing word)`;
      case 'adverb':
        return `An adverb (modifies verbs/adjectives)`;
      case 'determiner':
        return `A determiner (specifies nouns)`;
      case 'preposition':
        return `A preposition (shows relationships)`;
      case 'pronoun':
        return `A pronoun (replaces nouns)`;
      case 'conjunction':
        return `A conjunction (connects words/phrases)`;
      default:
        return `A ${pos} (${word.cefr_level} level word)`;
    }
  }

  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  // 強化されたシャッフルアルゴリズム（Fisher-Yates + 追加ランダム化）
  private enhancedShuffle<T>(array: T[]): T[] {
    const shuffled = [...array];
    
    // 第1段階: Fisher-Yatesシャッフル
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    
    // 第2段階: セクション別再シャッフル（アルファベット順の偏りを防ぐ）
    const sectionSize = Math.ceil(shuffled.length / 10);
    for (let section = 0; section < 10; section++) {
      const start = section * sectionSize;
      const end = Math.min(start + sectionSize, shuffled.length);
      const sectionArray = shuffled.slice(start, end);
      
      // セクション内でさらにシャッフル
      for (let i = sectionArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [sectionArray[i], sectionArray[j]] = [sectionArray[j], sectionArray[i]];
      }
      
      // シャッフルされたセクションを元の配列に戻す
      for (let i = 0; i < sectionArray.length; i++) {
        shuffled[start + i] = sectionArray[i];
      }
    }
    
    // 第3段階: 最終ランダム化
    for (let i = 0; i < shuffled.length; i++) {
      const randomIndex = Math.floor(Math.random() * shuffled.length);
      [shuffled[i], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[i]];
    }
    
    return shuffled;
  }

  // 更新されたメインのクイズ作成メソッド
  async createCefrQuiz(cefrLevel: string, questionCount: number = 10): Promise<QuizQuestion[]> {
    try {
      // Get user's current level for appropriate difficulty
      const userLevel = await databaseService.getUserCefrLevel();
      const targetLevel = cefrLevel || userLevel.current_level;
      
      console.log(`Creating CEFR quiz for level: ${targetLevel}, questions: ${questionCount}`);
      
      // 必ず指定された問題数（デフォルト10問）を生成
      const requiredQuestions = questionCount;
      
      try {
        // メインの新規単語クイズ生成を試行
        const questions = await this.generateQuizWithFreshWords(targetLevel, requiredQuestions);
        
        if (questions.length >= requiredQuestions) {
          console.log(`Successfully created ${questions.length} quiz questions for ${targetLevel}`);
          return questions.slice(0, requiredQuestions); // 確実に指定数を返す
        }
        
        throw new Error(`Insufficient questions generated: ${questions.length}/${requiredQuestions}`);
      } catch (error) {
        console.warn(`Primary quiz generation failed for ${targetLevel}:`, error);
        
        // フォールバック: より広範囲のレベルから取得
        console.log('Attempting fallback with expanded level range...');
        return await this.generateFallbackQuiz(targetLevel, requiredQuestions);
      }
    } catch (error) {
      console.error('Error in createCefrQuiz:', error);
      throw new Error(`Failed to generate ${questionCount} quiz questions. Please try again.`);
    }
  }

  // フォールバック戦略：より広範囲のレベルから確実に指定数のクイズを生成
  private async generateFallbackQuiz(primaryLevel: string, requiredQuestions: number): Promise<QuizQuestion[]> {
    console.log(`Generating fallback quiz: ${requiredQuestions} questions`);
    
    // 全レベルを優先順位付き
    const allLevels = this.getPrioritizedLevels(primaryLevel);
    let combinedWords: CefrQuizWord[] = [];
    
    // 各レベルから単語を収集
    for (const level of allLevels) {
      if (combinedWords.length >= 40) break; // 40単語で十分
      
      try {
        const needed = Math.min(20, 40 - combinedWords.length);
        console.log(`Fetching ${needed} words from level ${level}`);
        
        const levelWords = await this.getQuizWordsWithApiData(level, needed);
        
        // 重複を避けて追加
        const uniqueWords = levelWords.filter(newWord => 
          !combinedWords.some(existing => existing.word === newWord.word)
        );
        
        combinedWords = [...combinedWords, ...uniqueWords];
        console.log(`Added ${uniqueWords.length} words from ${level}. Total: ${combinedWords.length}`);
        
      } catch (error) {
        console.warn(`Failed to get words from level ${level}:`, error);
      }
    }
    
    if (combinedWords.length < requiredQuestions) {
      throw new Error(`Could not gather enough words for quiz. Got: ${combinedWords.length}, needed: ${requiredQuestions}`);
    }
    
    // 確実に指定数のクイズを生成
    const questions = await this.generateQuizFromWordPool(combinedWords, requiredQuestions);
    
    if (questions.length < requiredQuestions) {
      throw new Error(`Fallback quiz generation failed. Got: ${questions.length}/${requiredQuestions} questions`);
    }
    
    return questions.slice(0, requiredQuestions);
  }

  // レベルを優先順位付きで取得
  private getPrioritizedLevels(primaryLevel: string): string[] {
    const allLevels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
    const prioritized = [primaryLevel];
    
    // 隣接レベルを追加
    const adjacent = this.getAdjacentCefrLevels(primaryLevel);
    prioritized.push(...adjacent);
    
    // 残りのレベルを追加
    allLevels.forEach(level => {
      if (!prioritized.includes(level)) {
        prioritized.push(level);
      }
    });
    
    return prioritized;
  }

  async getAvailableLevels(): Promise<string[]> {
    const stats = await databaseService.getCefrLevelStats();
    return Object.keys(stats).sort();
  }

  async getLevelStats(): Promise<{[level: string]: number}> {
    return await databaseService.getCefrLevelStats();
  }

  // Method to enrich words in batches for better quiz experience
  async enrichQuizWords(words: CefrQuizWord[]): Promise<void> {
    if (!(await wordsApiService.isApiKeyConfigured())) {
      return;
    }

    const wordsToEnrich = words.filter(word => !word.definition);
    
    if (wordsToEnrich.length === 0) {
      return;
    }

    try {
      // Process in smaller batches to respect API limits
      const batchSize = 5;
      for (let i = 0; i < wordsToEnrich.length; i += batchSize) {
        const batch = wordsToEnrich.slice(i, i + batchSize);
        
        const enrichPromises = batch.map(async (word) => {
          try {
            const enrichedData = await wordsApiService.enrichWordData(word.word);
            
            if (enrichedData.definition) {
              await databaseService.addWordDetails(word.id, enrichedData);
              
              // Update the word object
              word.definition = enrichedData.definition;
              word.pronunciation = enrichedData.pronunciation;
              word.example_sentence = enrichedData.example_sentence;
              word.synonyms = enrichedData.synonyms;
              word.antonyms = enrichedData.antonyms;
            }
          } catch (error) {
            console.warn(`Failed to enrich word ${word.word}:`, error);
          }
        });
        
        await Promise.all(enrichPromises);
        
        // Add delay between batches
        if (i + batchSize < wordsToEnrich.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    } catch (error) {
      console.error('Error enriching quiz words:', error);
    }
  }
}

export const cefrQuizService = new CefrQuizService();