import { CefrQuizWord } from './enrichedQuizService';

// 静的インポート（React Native対応）
import enrichedA1Data from './enriched_vocabulary_A1.json';
import enrichedA2Data from './enriched_vocabulary_A2.json';
import enrichedB1Data from './enriched_vocabulary_B1.json';
import enrichedB2Data from './enriched_vocabulary_B2.json';
import enrichedC1Data from './enriched_vocabulary_C1.json';
import enrichedC2Data from './enriched_vocabulary_C2.json';

// Enriched vocabulary data structure
interface EnrichedVocabularyData {
  metadata: {
    source: string;
    cefrLevel: string;
    wordCount: number;
    createdDate: string;
    description: string;
    enrichedDate: string;
    totalWords: number;
    wordsWithApiData: number;
    wordsWithoutApiData: number;
    apiDataCoverage: number;
    totalApiRequests: number;
    failedApiRequests: number;
    apiSource: string;
  };
  vocabulary: EnrichedWord[];
}

interface EnrichedWord {
  word: string;
  pos: string;
  cefr: string;
  coreInventory1: any;
  coreInventory2: any;
  threshold: any;
  apiData: {
    pronunciation?: {
      all?: string;
    };
    definitions?: {
      definition: string;
      partOfSpeech: string;
      derivation: string[];
      typeOf: string[];
      hasTypes: string[];
      partOf: string[];
      hasParts: string[];
      similarTo: string[];
      also: string[];
    }[];
    syllables?: {
      count: number;
      list: string[];
    };
    frequency?: number;
    examples?: string[];
    synonyms?: string[];
    antonyms?: string[];
  };
}

class EnrichedVocabularyService {
  private vocabularyCache: Map<string, EnrichedVocabularyData> = new Map();
  
  // 事前定義された語彙データマッピング（React Native対応）
  private vocabularyData: { [key: string]: EnrichedVocabularyData } = {
    'A1': enrichedA1Data as EnrichedVocabularyData,
    'A2': enrichedA2Data as EnrichedVocabularyData,
    'B1': enrichedB1Data as EnrichedVocabularyData,
    'B2': enrichedB2Data as EnrichedVocabularyData,
    'C1': enrichedC1Data as EnrichedVocabularyData,
    'C2': enrichedC2Data as EnrichedVocabularyData,
    // 将来追加: 'A2': enrichedA2Data, 'B1': enrichedB1Data, など
  };
  
  // レベル別の詳細語彙データを取得
  async getEnrichedVocabulary(cefrLevel: string): Promise<EnrichedVocabularyData> {
    // キャッシュから取得を試行
    if (this.vocabularyCache.has(cefrLevel)) {
      return this.vocabularyCache.get(cefrLevel)!;
    }
    
    try {
      console.log(`Loading enriched vocabulary for level: ${cefrLevel}`);
      
      // 静的にインポートされた語彙データを取得
      const vocabularyData = this.loadVocabularyData(cefrLevel);
      
      console.log(`Loaded ${vocabularyData.vocabulary.length} enriched words for ${cefrLevel}`);
      console.log(`API data coverage: ${vocabularyData.metadata.apiDataCoverage}%`);
      
      // キャッシュに保存
      this.vocabularyCache.set(cefrLevel, vocabularyData);
      
      return vocabularyData;
    } catch (error) {
      console.error(`Failed to load enriched vocabulary for ${cefrLevel}:`, error);
      throw new Error(`Enriched vocabulary data not available for level: ${cefrLevel}`);
    }
  }
  
  // 静的インポートされた語彙データを取得（React Native対応）
  private loadVocabularyData(cefrLevel: string): EnrichedVocabularyData {
    const vocabularyData = this.vocabularyData[cefrLevel];
    
    if (!vocabularyData) {
      throw new Error(`Vocabulary data not available for level: ${cefrLevel}. Available levels: ${Object.keys(this.vocabularyData).join(', ')}`);
    }
    
    return vocabularyData;
  }
  
  // 指定されたレベルからランダムに単語を取得
  async getRandomEnrichedWords(cefrLevel: string, count: number = 40): Promise<CefrQuizWord[]> {
    const vocabularyData = await this.getEnrichedVocabulary(cefrLevel);
    const words = vocabularyData.vocabulary;
    
    if (words.length === 0) {
      throw new Error(`No words available for level: ${cefrLevel}`);
    }
    
    console.log(`Selecting ${count} words from ${words.length} available ${cefrLevel} words`);
    
    // 強化されたランダム選択（偏りを防ぐ）
    const shuffledWords = this.enhancedShuffle(words);
    const selectedWords = shuffledWords.slice(0, Math.min(count, words.length));
    
    // CefrQuizWord形式に変換
    const quizWords: CefrQuizWord[] = selectedWords.map((word, index) => ({
      id: index + 1,
      word: word.word,
      pos: word.pos,
      cefr_level: word.cefr,
      definition: this.extractBestDefinition(word) || undefined,
      pronunciation: word.apiData?.pronunciation?.all || undefined,
      example_sentence: this.extractBestExample(word) || undefined,
      synonyms: word.apiData?.synonyms?.join(', ') || undefined,
      antonyms: word.apiData?.antonyms?.join(', ') || undefined,
    }));
    
    console.log(`Converted ${quizWords.length} words to quiz format`);
    console.log(`Sample words: ${quizWords.slice(0, 5).map(w => w.word).join(', ')}`);
    
    return quizWords;
  }
  
  // 単語から最適な定義を抽出
  private extractBestDefinition(word: EnrichedWord): string | null {
    if (!word.apiData?.definitions || word.apiData.definitions.length === 0) {
      return null;
    }
    
    // 最初の定義を使用（通常、最も一般的）
    const firstDefinition = word.apiData.definitions[0];
    return firstDefinition.definition;
  }
  
  // 単語から最適な例文を抽出
  private extractBestExample(word: EnrichedWord): string | null {
    if (word.apiData?.examples && word.apiData.examples.length > 0) {
      return word.apiData.examples[0];
    }
    return null;
  }
  
  // 複数レベルから単語を取得（フォールバック用）
  async getWordsFromMultipleLevels(primaryLevel: string, totalWords: number = 40): Promise<CefrQuizWord[]> {
    let combinedWords: CefrQuizWord[] = [];
    
    // 優先順位付きレベルリスト
    const prioritizedLevels = this.getPrioritizedLevels(primaryLevel);
    
    for (const level of prioritizedLevels) {
      if (combinedWords.length >= totalWords) break;
      
      try {
        const needed = totalWords - combinedWords.length;
        console.log(`Fetching ${needed} words from level ${level}`);
        
        const levelWords = await this.getRandomEnrichedWords(level, needed);
        
        // 重複を避けて追加
        const uniqueWords = levelWords.filter(newWord => 
          !combinedWords.some(existing => existing.word === newWord.word)
        );
        
        combinedWords = [...combinedWords, ...uniqueWords];
        console.log(`Added ${uniqueWords.length} unique words from ${level}. Total: ${combinedWords.length}`);
        
      } catch (error) {
        console.warn(`Failed to get words from level ${level}:`, error);
      }
    }
    
    return combinedWords;
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
  
  // 隣接するCEFRレベルを取得
  private getAdjacentCefrLevels(cefrLevel: string): string[] {
    const levels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
    const currentIndex = levels.indexOf(cefrLevel);
    
    if (currentIndex === -1) return levels;
    
    const adjacent: string[] = [];
    
    // 隣接レベルを優先順位付きで追加
    if (currentIndex > 0) adjacent.push(levels[currentIndex - 1]); // 一つ下のレベル
    if (currentIndex < levels.length - 1) adjacent.push(levels[currentIndex + 1]); // 一つ上のレベル
    
    // さらに隣接するレベルを追加
    if (currentIndex > 1) adjacent.push(levels[currentIndex - 2]);
    if (currentIndex < levels.length - 2) adjacent.push(levels[currentIndex + 2]);
    
    // 残りのレベルを追加
    levels.forEach(level => {
      if (level !== cefrLevel && !adjacent.includes(level)) {
        adjacent.push(level);
      }
    });
    
    return adjacent;
  }
  
  // 強化されたシャッフルアルゴリズム（アルファベット順の偏りを防ぐ）
  private enhancedShuffle<T>(array: T[]): T[] {
    const shuffled = [...array];
    
    // 第1段階: Fisher-Yatesシャッフル
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    
    // 第2段階: セクション別再シャッフル（アルファベット順の偏りを防ぐ）
    const sectionSize = Math.ceil(shuffled.length / 12);
    for (let section = 0; section < 12; section++) {
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
  
  // 利用可能なレベルをチェック
  async getAvailableLevels(): Promise<string[]> {
    // 静的にインポートされたデータから利用可能なレベルを返す
    return Object.keys(this.vocabularyData);
  }

  // 追加: 全CEFRレベル横断で前方一致検索（最大limit件）
  async searchWordsAcrossLevels(prefix: string, limit: number = 10): Promise<{
    word: string;
    cefr: string;
    definition?: string;
    pronunciation?: string;
    example?: string;
    synonyms?: string[];
    antonyms?: string[];
    pos?: string;
  }[]> {
    const query = prefix.trim().toLowerCase();
    if (!query) return [];

    const levels = Object.keys(this.vocabularyData);
    const results: {
      word: string; cefr: string; definition?: string; pronunciation?: string; example?: string; synonyms?: string[]; antonyms?: string[]; pos?: string;
    }[] = [];

    for (const level of levels) {
      const data = this.vocabularyData[level];
      // できるだけ軽量に前方一致で抽出
      for (let i = 0; i < data.vocabulary.length; i++) {
        const v = data.vocabulary[i];
        if (v.word.toLowerCase().startsWith(query)) {
          results.push({
            word: v.word,
            cefr: v.cefr,
            definition: this.extractBestDefinition(v) || undefined,
            pronunciation: v.apiData?.pronunciation?.all || undefined,
            example: v.apiData?.examples && v.apiData.examples.length > 0 ? v.apiData.examples[0] : undefined,
            synonyms: v.apiData?.synonyms,
            antonyms: v.apiData?.antonyms,
            pos: v.pos,
          });
          if (results.length >= limit) return results;
        }
      }
      if (results.length >= limit) break;
    }

    return results.slice(0, limit);
  }
}

export const enrichedVocabularyService = new EnrichedVocabularyService(); 