// Type definitions moved from cefrQuizService.ts
import { enrichedVocabularyService } from './enrichedVocabularyService';
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

class EnrichedQuizService {
  
  // メインのクイズ生成メソッド：enriched vocabularyを使用
  async createEnrichedCefrQuiz(cefrLevel: string, questionCount: number = 10): Promise<QuizQuestion[]> {
    try {
      console.log(`Creating enriched CEFR quiz for level: ${cefrLevel}, questions: ${questionCount}`);
      
      // 利用可能なレベルをチェック
      const availableLevels = await enrichedVocabularyService.getAvailableLevels();
      console.log(`Available enriched levels: ${availableLevels.join(', ')}`);
      
      if (!availableLevels.includes(cefrLevel)) {
        console.warn(`Level ${cefrLevel} not available, falling back to A1`);
        cefrLevel = 'A1'; // A1をフォールバックとして使用
      }
      
      // 40単語を取得
      let allWords: CefrQuizWord[] = [];
      
      try {
        allWords = await enrichedVocabularyService.getRandomEnrichedWords(cefrLevel, 40);
      } catch (error) {
        console.warn(`Failed to get words from ${cefrLevel}, trying multiple levels:`, error);
        allWords = await enrichedVocabularyService.getWordsFromMultipleLevels(cefrLevel, 40);
      }
      
      if (allWords.length < questionCount) {
        throw new Error(`Insufficient words available. Got: ${allWords.length}, needed: ${questionCount}`);
      }
      
      console.log(`Successfully retrieved ${allWords.length} enriched words`);
      
      // 40単語のプールから10問のクイズを生成
      const questions = await this.generateQuizFromEnrichedWords(allWords, questionCount);
      
      if (questions.length < questionCount) {
        console.warn(`Only generated ${questions.length} questions out of ${questionCount} requested`);
      }
      
      console.log(`Successfully created ${questions.length} enriched quiz questions`);
      return questions;
      
    } catch (error) {
      console.error('Error in createEnrichedCefrQuiz:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to generate ${questionCount} enriched quiz questions: ${errorMessage}`);
    }
  }
  
  // 40単語のプールから指定数のクイズを生成
  private async generateQuizFromEnrichedWords(wordPool: CefrQuizWord[], questionCount: number): Promise<QuizQuestion[]> {
    console.log(`Generating ${questionCount} questions from ${wordPool.length} enriched words`);
    
    // 定義がある単語を優先的に正解候補として選択
    const wordsWithDefinitions = wordPool.filter(word => word.definition && word.definition.trim().length > 0);
    const wordsWithoutDefinitions = wordPool.filter(word => !word.definition || word.definition.trim().length === 0);
    
    console.log(`Words with definitions: ${wordsWithDefinitions.length}, without: ${wordsWithoutDefinitions.length}`);
    
    // 正解候補として使用する単語を選択（必要数を確保）
    let correctWords: CefrQuizWord[] = [];
    
    if (wordsWithDefinitions.length >= questionCount) {
      correctWords = this.shuffleArray(wordsWithDefinitions).slice(0, questionCount);
    } else {
      correctWords = [
        ...wordsWithDefinitions,
        ...this.shuffleArray(wordsWithoutDefinitions).slice(0, questionCount - wordsWithDefinitions.length)
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
        const question = await this.createQuestionForEnrichedWord(word, incorrectWords);
        if (question) {
          questions.push(question);
        }
      } catch (error) {
        console.warn(`Failed to create question for word ${word.word}:`, error);
      }
    }

    console.log(`Successfully generated ${questions.length} questions from enriched data`);
    return questions;
  }
  
  // 詳細データがある単語に特化したクイズ問題作成
  private async createQuestionForEnrichedWord(word: CefrQuizWord, incorrectWordsPool: CefrQuizWord[]): Promise<QuizQuestion | null> {
    // 定義がある場合は定義クイズを優先
    if (word.definition && word.definition.trim().length > 0) {
      return this.createDefinitionQuestionWithPool(word, incorrectWordsPool);
    }
    
    // 同義語がある場合は同義語クイズ
    if (word.synonyms && word.synonyms.trim().length > 0) {
      return this.createSynonymQuestionWithPool(word, incorrectWordsPool);
    }
    
    // 例文がある場合は例文クイズ
    if (word.example_sentence && word.example_sentence.trim().length > 0) {
      return this.createExampleQuestionWithPool(word, incorrectWordsPool);
    }
    
    // 最後の手段：基本的な品詞クイズ
    return this.createBasicQuestionWithPool(word, incorrectWordsPool);
  }
  
  // 定義を選択肢とするクイズ問題を作成
  private createDefinitionQuestionWithPool(word: CefrQuizWord, incorrectWordsPool: CefrQuizWord[]): QuizQuestion {
    // 正解の定義
    const correctDefinition = word.definition!;
    
    // 不正解の定義（他の単語の定義から3つ選択）
    const incorrectDefinitions = incorrectWordsPool
      .filter(w => w.definition && w.definition.trim().length > 0 && w.definition !== correctDefinition)
      .map(w => w.definition!)
      .filter(def => def.length < 150) // 長すぎる定義を除外
      .slice(0, 3);
    
    // 不正解が足りない場合は汎用的な不正解を追加
    while (incorrectDefinitions.length < 3) {
      const genericWrongAnswers = [
        "A type of vehicle used for transportation",
        "A mathematical concept involving calculations", 
        "A weather phenomenon in nature",
        "A food item commonly consumed at meals",
        "A tool used for construction work"
      ];
      
      const randomGeneric = genericWrongAnswers[Math.floor(Math.random() * genericWrongAnswers.length)];
      if (!incorrectDefinitions.includes(randomGeneric)) {
        incorrectDefinitions.push(randomGeneric);
      }
    }
    
    // 選択肢をシャッフル
    const options = this.shuffleArray([correctDefinition, ...incorrectDefinitions]);
    
    return {
      word: word,
      question: `What is the meaning of "${word.word}"?`,
      options: options,
      correctAnswer: correctDefinition,
      type: 'definition'
    };
  }
  
  // 同義語クイズ問題を作成
  private createSynonymQuestionWithPool(word: CefrQuizWord, incorrectWordsPool: CefrQuizWord[]): QuizQuestion {
    const synonyms = word.synonyms!.split(',').map(s => s.trim()).filter(s => s.length > 0);
    const correctSynonym = synonyms[0];
    
    // 他の単語から不正解選択肢を作成
    const incorrectOptions = incorrectWordsPool
      .filter(w => w.word !== word.word)
      .map(w => w.word)
      .slice(0, 3);
    
    const options = this.shuffleArray([correctSynonym, ...incorrectOptions]);
    
    return {
      word: word,
      question: `Which word is a synonym of "${word.word}"?`,
      options: options,
      correctAnswer: correctSynonym,
      type: 'synonym'
    };
  }
  
  // 例文クイズ問題を作成
  private createExampleQuestionWithPool(word: CefrQuizWord, incorrectWordsPool: CefrQuizWord[]): QuizQuestion {
    const example = word.example_sentence!;
    const hiddenExample = example.replace(new RegExp(word.word, 'gi'), '____');
    
    // 他の単語から不正解選択肢を作成
    const incorrectOptions = incorrectWordsPool
      .filter(w => w.word !== word.word)
      .map(w => w.word)
      .slice(0, 3);
    
    const options = this.shuffleArray([word.word, ...incorrectOptions]);
    
    return {
      word: word,
      question: `Fill in the blank: ${hiddenExample}`,
      options: options,
      correctAnswer: word.word,
      type: 'example'
    };
  }
  
  // 基本的な品詞クイズ問題を作成
  private createBasicQuestionWithPool(word: CefrQuizWord, incorrectWordsPool: CefrQuizWord[]): QuizQuestion {
    const correctAnswer = `A ${word.pos || 'word'} (${word.cefr_level} level)`;
    
    // 他の品詞や説明から不正解選択肢を作成
    const incorrectOptions = incorrectWordsPool
      .filter(w => w.pos !== word.pos || w.cefr_level !== word.cefr_level)
      .map(w => `A ${w.pos || 'word'} (${w.cefr_level} level)`)
      .slice(0, 3);
    
    // 不正解が足りない場合は汎用的な選択肢を追加
    while (incorrectOptions.length < 3) {
      const genericOptions = [
        "A mathematical formula",
        "A cooking ingredient", 
        "A sports equipment",
        "A scientific term"
      ];
      
      const randomOption = genericOptions[Math.floor(Math.random() * genericOptions.length)];
      if (!incorrectOptions.includes(randomOption)) {
        incorrectOptions.push(randomOption);
      }
    }
    
    const options = this.shuffleArray([correctAnswer, ...incorrectOptions]);
    
    return {
      word: word,
      question: `What type of word is "${word.word}"?`,
      options: options,
      correctAnswer: correctAnswer,
      type: 'definition'
    };
  }
  
  // Fisher-Yatesシャッフルアルゴリズム
  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }
  
  // 利用可能な詳細語彙レベルを取得
  async getAvailableEnrichedLevels(): Promise<string[]> {
    return await enrichedVocabularyService.getAvailableLevels();
  }
}

export const enrichedQuizService = new EnrichedQuizService(); 