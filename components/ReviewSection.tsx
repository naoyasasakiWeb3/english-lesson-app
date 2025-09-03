import { Spacing } from '@/constants/ModernColors';
import { databaseService } from '@/services/database';
import { enrichedVocabularyService } from '@/services/enrichedVocabularyService';
import { unifiedSearchService } from '@/services/unifiedSearchService';
import { wordsApiService } from '@/services/wordsApiService';
import { useAppStore } from '@/store/useAppStore';
import { Word } from '@/types';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View
} from 'react-native';
import Animated, { FadeInDown, FadeInLeft, FadeInRight } from 'react-native-reanimated';
import { ThemedText } from './ThemedText';
import ModernCard from './layout/ModernCard';
import ModernButton from './modern/ModernButton';

export default function ReviewSection() {
  const router = useRouter();
  const { startQuiz } = useAppStore();
  const [bookmarkedWords, setBookmarkedWords] = useState<Word[]>([]);
  const [enrichedBookmarkedWords, setEnrichedBookmarkedWords] = useState<{word: string; cefr_level: string; created_at: string}[]>([]);
  const [weakWords, setWeakWords] = useState<Word[]>([]);
  const [enrichedWeakWords, setEnrichedWeakWords] = useState<{word: string; cefr_level: string; attempts: number; correct_attempts: number; mastery_level: number}[]>([]);
  const [loading, setLoading] = useState(true);
  const [detailVisible, setDetailVisible] = useState(false);
  const [detailData, setDetailData] = useState<
    | {
        type: 'legacy';
        word: string;
        definition?: string;
        pronunciation?: string;
        difficulty?: number;
      }
    | {
        type: 'enriched';
        word: string;
        cefr: string;
        meanings?: { definition: string; example?: string; partOfSpeech?: string; synonyms?: string[]; examples?: string[] }[];
        definition?: string;
        pronunciation?: string;
        example?: string;
        synonyms?: string[];
        antonyms?: string[];
        pos?: string;
        attempts?: number;
        correctAttempts?: number;
        masteryLevel?: number;
        isBookmarked?: boolean;
        source?: 'search' | 'bookmarked' | 'challenging';
        accuracy?: number;
      }
    | null
  >(null);
  const [meaningIndex, setMeaningIndex] = useState(0);
  const [enrichedDefinitionMap, setEnrichedDefinitionMap] = useState<Record<string, string>>({});
  const [bookmarkedPage, setBookmarkedPage] = useState(0);
  const [challengingPage, setChallengingPage] = useState(0);
  const [listVisible, setListVisible] = useState(false);
  const [listType, setListType] = useState<'bookmarked' | 'challenging' | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{ word: string; cefr: string; definition?: string }[]>([]);
  const [searching, setSearching] = useState(false);
  const [apiSearching, setApiSearching] = useState(false);
  const [hasApiKey, setHasApiKey] = useState(false);

  useEffect(() => {
    loadReviewData();
    checkApiKey();
  }, []);

  const checkApiKey = async () => {
    try {
      const hasKey = await wordsApiService.hasApiKey();
      setHasApiKey(hasKey);
    } catch (error) {
      console.error('Error checking API key:', error);
      setHasApiKey(false);
    }
  };

  // 画面がフォーカスされたときにデータをリフレッシュ
  useFocusEffect(
    useCallback(() => {
      console.log('ReviewSection focused - checking database status');
      if (databaseService.isInitialized()) {
        console.log('Database initialized - refreshing review data');
        loadReviewData();
      } else {
        console.log('Database not yet initialized - skipping review data refresh');
      }
      checkApiKey(); // APIキーの状態も確認
    }, [])
  );

  const loadReviewData = async () => {
    try {
      setLoading(true);
      const [bookmarked, weak, enrichedBookmarked, enrichedWeak] = await Promise.all([
        databaseService.getBookmarkedWords(),
        databaseService.getWeakWords(),
        databaseService.getEnrichedBookmarkedWords(),
        databaseService.getEnrichedWeakWords()
      ]);
      
      console.log('Loaded enriched weak words:', enrichedWeak.map(w => ({
        word: w.word,
        cefr_level: w.cefr_level,
        attempts: w.attempts,
        correct_attempts: w.correct_attempts,
        accuracy: w.attempts > 0 ? w.correct_attempts / w.attempts : 0
      })));
      
      setBookmarkedWords(bookmarked);
      setWeakWords(weak);
      setEnrichedBookmarkedWords(enrichedBookmarked);
      // DBのis_weakに準拠（UI側での重複フィルタはしない）
      setEnrichedWeakWords(enrichedWeak);
      // Enriched定義の事前取得（代表的なもの1つ）
      try {
        const levelSet = Array.from(new Set([
          ...enrichedBookmarked.map(w => w.cefr_level),
          ...enrichedWeak.map(w => w.cefr_level),
        ])).filter(level => level !== 'EXTERNAL'); // EXTERNALレベルを除外
        
        const map: Record<string, string> = {};
        for (const level of levelSet) {
          const data = await enrichedVocabularyService.getEnrichedVocabulary(level);
          for (const b of enrichedBookmarked.filter(w => w.cefr_level === level)) {
            const found = data.vocabulary.find(v => v.word.toLowerCase() === b.word.toLowerCase());
            const def = found?.apiData?.definitions && found.apiData.definitions.length > 0 ? found.apiData.definitions[0].definition : undefined;
            if (def) {
              map[`${b.word}|${level}`] = def;
            }
          }
          for (const ew of enrichedWeak.filter(w => w.cefr_level === level)) {
            const found = data.vocabulary.find(v => v.word.toLowerCase() === ew.word.toLowerCase());
            const def = found?.apiData?.definitions && found.apiData.definitions.length > 0 ? found.apiData.definitions[0].definition : undefined;
            if (def) {
              map[`${ew.word}|${level}`] = def;
            }
          }
        }
        
        // EXTERNALレベルの単語に対して外部データから定義を取得
        for (const b of enrichedBookmarked.filter(w => w.cefr_level === 'EXTERNAL')) {
          try {
            const externalWord = await databaseService.getExternalWord(b.word);
            if (externalWord && externalWord.definitions) {
              const defs = JSON.parse(externalWord.definitions);
              if (defs && defs.length > 0) {
                map[`${b.word}|EXTERNAL`] = defs[0].definition || 'External API definition';
              }
            }
          } catch (error) {
            console.warn(`Failed to get external definition for ${b.word}:`, error);
            map[`${b.word}|EXTERNAL`] = 'External API word';
          }
        }
        
        setEnrichedDefinitionMap(map);
      } catch (e) {
        console.warn('Failed to prefetch enriched definitions', e);
      }
      
      console.log(`Loaded review data: ${bookmarked.length} legacy bookmarked, ${enrichedBookmarked.length} enriched bookmarked, ${weak.length} legacy weak, ${enrichedWeak.length} enriched weak`);
    } catch (error) {
      console.error('Error loading review data:', error);
    } finally {
      setLoading(false);
    }
  };

  // 検索（プレフィックス一致、最大10件）
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (searchQuery.trim().length === 0) {
          setSearchResults([]);
          setDetailData(null); // 検索がクリアされた時に詳細データもクリア
          return;
        }
        setSearching(true);
        setDetailData(null); // 新しい検索の開始時に詳細データをクリア
        const res = await enrichedVocabularyService.searchWordsAcrossLevels(searchQuery, 10);
        if (!cancelled) {
          setSearchResults(res.map(r => ({ word: r.word, cefr: r.cefr, definition: r.definition })));
        }
      } catch (error) {
        if (!cancelled) setSearchResults([]);
        console.warn('Search error:', error);
      } finally {
        if (!cancelled) setSearching(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [searchQuery]);

  // WordsAPIで検索する関数
  const searchWithWordsApi = async () => {
    if (!searchQuery.trim() || !hasApiKey) {
      if (!hasApiKey) {
        Alert.alert(
          'API Key Required',
          'Please set your WordsAPI key in Settings first.',
          [{ text: 'Go to Settings', onPress: () => router.push('/settings') }, { text: 'Cancel' }]
        );
      }
      return;
    }

    try {
      setApiSearching(true);
      const searchResponse = await unifiedSearchService.searchWord(searchQuery.trim(), {
        enableApiFallback: true,
        respectApiQuota: true,
        includeExternalCache: true,
        userLevel: 'A1', // デフォルトレベル
      });

      if (searchResponse.result) {
        // WordsAPIからの結果を詳細表示
        const wordData = searchResponse.result.wordData;
        
        // 検索結果にAPIの結果を追加
        const apiResult = {
          word: wordData.word,
          cefr: 'EXTERNAL',
          definition: wordData.meanings[0]?.definition || 'No definition available'
        };
        setSearchResults([apiResult]);
        
        // ブックマーク状態を確認
        const isBookmarked = await databaseService.isEnrichedWordBookmarked(wordData.word, 'EXTERNAL');
        
        // 詳細モーダルも表示
        setDetailData({
          type: 'enriched',
          word: wordData.word,
          cefr: 'EXTERNAL', // 外部APIからの結果であることを示す
          meanings: (wordData.meanings || []).map(m => ({
            definition: m.definition,
            example: m.example,
            partOfSpeech: m.partOfSpeech,
            synonyms: m.synonyms,
            examples: m.examples,
          })),
          definition: wordData.meanings[0]?.definition || 'No definition available',
          pronunciation: wordData.pronunciation.phonetic,
          example: wordData.meanings[0]?.example,
          synonyms: wordData.synonyms,
          antonyms: wordData.antonyms,
          pos: wordData.meanings[0]?.partOfSpeech,
          source: 'search',
          isBookmarked: isBookmarked,
        });
        setMeaningIndex(0);
        setDetailVisible(true);
      } else {
        Alert.alert(
          'Word Not Found',
          `"${searchQuery}" was not found in WordsAPI.${searchResponse.quotaWarning ? '\n\n' + searchResponse.quotaWarning : ''}`
        );
      }
    } catch (error) {
      console.error('WordsAPI search error:', error);
      Alert.alert(
        'Search Error',
        'Failed to search with WordsAPI. Please try again later.'
      );
    } finally {
      setApiSearching(false);
    }
  };

  const openLegacyDetail = (word: Word) => {
    setDetailData({
      type: 'legacy',
      word: word.word,
      definition: word.definition,
      pronunciation: word.pronunciation,
      difficulty: word.difficulty,
    });
    setDetailVisible(true);
  };

  const openEnrichedDetail = async (
    word: string,
    cefr: string,
    stats?: { attempts?: number; correctAttempts?: number; masteryLevel?: number },
    source?: 'search' | 'bookmarked' | 'challenging'
  ) => {
    try {
      // EXTERNALレベルの場合は特別な処理
      if (cefr === 'EXTERNAL') {
        // 外部データベースから詳細情報を取得
        const externalWord = await databaseService.getExternalWord(word);
        const isBm = await databaseService.isEnrichedWordBookmarked(word, cefr);
        
        let definitions: any[] = [];
        let synonyms: string[] = [];
        let antonyms: string[] = [];
        let examples: string[] = [];
        
        if (externalWord) {
          console.log('External word data:', JSON.stringify(externalWord, null, 2));
          try {
            if (externalWord.definitions) {
              definitions = JSON.parse(externalWord.definitions);
              console.log('Parsed definitions:', definitions);
            }
            if (externalWord.synonyms) {
              synonyms = JSON.parse(externalWord.synonyms);
              console.log('Parsed synonyms:', synonyms);
            }
            if (externalWord.antonyms) {
              antonyms = JSON.parse(externalWord.antonyms);
              console.log('Parsed antonyms:', antonyms);
            }
            if (externalWord.examples) {
              examples = JSON.parse(externalWord.examples);
              console.log('Parsed examples:', examples);
            }
          } catch (parseError) {
            console.warn('Failed to parse external word data:', parseError);
          }
        } else {
          console.log('No external word data found for:', word);
        }
        
        // デバッグ: definitionsの詳細構造を確認
        console.log('Definitions array length:', definitions.length);
        if (definitions.length > 0) {
          console.log('First definition object:', JSON.stringify(definitions[0], null, 2));
          console.log('Available keys in first definition:', Object.keys(definitions[0]));
        }
        
        // definitionの取得ロジックを改善
        let definitionText = 'No definition available';
        let partOfSpeech = 'unknown';
        
        if (definitions.length > 0) {
          const firstDef = definitions[0];
          
          // 複数の可能なフィールドから定義を取得
          if (firstDef.definition) {
            definitionText = firstDef.definition;
          } else if (firstDef.meaning) {
            definitionText = firstDef.meaning;
          } else if (firstDef.text) {
            definitionText = firstDef.text;
          } else if (typeof firstDef === 'string') {
            definitionText = firstDef;
          }
          
          // partOfSpeechも同様に複数のフィールドをチェック
          if (firstDef.partOfSpeech) {
            partOfSpeech = firstDef.partOfSpeech;
          } else if (firstDef.part_of_speech) {
            partOfSpeech = firstDef.part_of_speech;
          } else if (firstDef.pos) {
            partOfSpeech = firstDef.pos;
          }
        }
        
        console.log('Final definition text:', definitionText);
        console.log('Final part of speech:', partOfSpeech);

        // EXTERNAL単語のaccuracy情報を取得（全ソース対応）
        let accuracy = 0;
        
        // 1. enrichedWeakWordsから検索（どのソースからでも）
        const weakWordData = enrichedWeakWords.find(w => w.word === word && w.cefr_level === 'EXTERNAL');
        if (weakWordData && weakWordData.attempts > 0) {
          accuracy = weakWordData.attempts > 0 ? weakWordData.correct_attempts / weakWordData.attempts : 0;
          console.log(`Found accuracy for EXTERNAL word ${word} from enrichedWeakWords: ${accuracy}`);
        }
        
        // 2. データベースから直接取得
        if (accuracy === 0) {
          try {
            const progressData = await databaseService.getEnrichedWordProgress(word, 'EXTERNAL');
            if (progressData && progressData.attempts > 0) {
              accuracy = progressData.correct_attempts / progressData.attempts;
              console.log(`Found accuracy for EXTERNAL word ${word} from database: ${accuracy}`);
            }
          } catch (error) {
            console.warn('Failed to get progress from database for EXTERNAL word:', error);
          }
        }

        const meaningsFromExternal = (definitions || []).map((d: any) => ({
          definition:
            d?.definition ?? d?.meaning ?? d?.text ?? (typeof d === 'string' ? d : ''),
          example: d?.example ?? (Array.isArray(d?.examples) ? d.examples[0] : undefined),
          partOfSpeech: d?.partOfSpeech ?? d?.part_of_speech ?? d?.pos,
          synonyms: d?.synonyms,
          examples: d?.examples,
        }));

        const detailDataObj = {
          type: 'enriched' as const,
          word,
          cefr: 'EXTERNAL',
          meanings: meaningsFromExternal,
          definition: definitionText,
          pronunciation: externalWord?.phonetic || '',
          example: examples.length > 0 ? examples[0] : undefined,
          synonyms: synonyms,
          antonyms: antonyms,
          pos: partOfSpeech,
          source: source || 'bookmarked',
          isBookmarked: isBm,
          accuracy: accuracy, // accuracy情報を追加
        };
        
        console.log('Setting detail data for EXTERNAL word:', JSON.stringify(detailDataObj, null, 2));
        setDetailData(detailDataObj);
        setMeaningIndex(0);
        setDetailVisible(true);
        return;
      }
      
      const data = await enrichedVocabularyService.getEnrichedVocabulary(cefr);
      const found = data.vocabulary.find(v => v.word.toLowerCase() === word.toLowerCase());
      const isBm = await databaseService.isEnrichedWordBookmarked(word, cefr);
      
      // CEFR単語のaccuracy情報を取得（優先順位順）
      let accuracy = 0;
      
      // 1. Challenging wordsから開かれた場合、enrichedWeakWordsからaccuracy情報を取得
      if (source === 'challenging') {
        const weakWordData = enrichedWeakWords.find(w => w.word === word && w.cefr_level === cefr);
        if (weakWordData) {
          accuracy = weakWordData.attempts > 0 ? weakWordData.correct_attempts / weakWordData.attempts : 0;
          console.log(`Found accuracy for CEFR word ${word} (${cefr}) from challenging: ${accuracy}`);
        }
      }
      
      // 2. stats情報がある場合はそれを使用
      if (accuracy === 0 && stats && stats.attempts && stats.correctAttempts !== undefined && stats.attempts > 0) {
        accuracy = stats.correctAttempts / stats.attempts;
        console.log(`Found accuracy from stats for CEFR word ${word}: ${accuracy}`);
      }
      
      // 3. どこからでもaccuracy情報を取得できるように、enrichedWeakWordsを全体検索
      if (accuracy === 0) {
        // enrichedWeakWordsから検索（challenging以外でも）
        const weakWordData = enrichedWeakWords.find(w => w.word === word && w.cefr_level === cefr);
        if (weakWordData && weakWordData.attempts > 0) {
          accuracy = weakWordData.correct_attempts / weakWordData.attempts;
          console.log(`Found accuracy for CEFR word ${word} (${cefr}) from enrichedWeakWords: ${accuracy}`);
        }
      }
      
      // 4. 最後の手段：データベースから直接取得
      if (accuracy === 0) {
        try {
          const progressData = await databaseService.getEnrichedWordProgress(word, cefr);
          if (progressData && progressData.attempts > 0) {
            accuracy = progressData.correct_attempts / progressData.attempts;
            console.log(`Found accuracy for CEFR word ${word} (${cefr}) from database: ${accuracy}`);
          }
        } catch (error) {
          console.warn('Failed to get progress from database:', error);
        }
      }
      
      const meaningsFromCefr = (found?.apiData?.definitions || []).map((d: any) => ({
        definition:
          d?.definition ?? d?.meaning ?? d?.text ?? (typeof d === 'string' ? d : ''),
        example: d?.example ?? (Array.isArray(d?.examples) ? d.examples[0] : undefined),
        partOfSpeech: d?.partOfSpeech ?? d?.part_of_speech ?? d?.pos ?? found?.pos,
        synonyms: d?.synonyms,
        examples: d?.examples,
      }));

      setDetailData({
        type: 'enriched',
        word,
        cefr,
        meanings: meaningsFromCefr,
        definition: found?.apiData?.definitions && found.apiData.definitions.length > 0 ? found.apiData.definitions[0].definition : undefined,
        pronunciation: found?.apiData?.pronunciation?.all,
        example: found?.apiData?.examples && found.apiData.examples.length > 0 ? found.apiData.examples[0] : undefined,
        synonyms: found?.apiData?.synonyms,
        antonyms: found?.apiData?.antonyms,
        pos: found?.pos,
        attempts: stats?.attempts,
        correctAttempts: stats?.correctAttempts,
        masteryLevel: stats?.masteryLevel,
        isBookmarked: isBm,
        source,
        accuracy: accuracy, // accuracy情報を追加
      } as any);
      setMeaningIndex(0);
      setDetailVisible(true);
    } catch {
      Alert.alert('Error', 'Failed to load word details');
    }
  };

  const handleStartReview = async (mode: 'bookmarked' | 'weak') => {
    try {
      const legacyWordCount = mode === 'bookmarked' ? bookmarkedWords.length : weakWords.length;
      const enrichedWordCount = mode === 'bookmarked' ? enrichedBookmarkedWords.length : enrichedWeakWords.length;
      const totalWordCount = legacyWordCount + enrichedWordCount;
      
      if (totalWordCount === 0) {
        Alert.alert(
          'No Words Available',
          mode === 'bookmarked' 
            ? 'You haven\'t bookmarked any words yet. Complete some quizzes first!'
            : 'No weak words found. Keep practicing to identify challenging words!'
        );
        return;
      }
      
      console.log(`Starting ${mode} review with ${totalWordCount} words (${legacyWordCount} legacy + ${enrichedWordCount} enriched)`);
      await startQuiz(mode, Math.min(totalWordCount, 20));
      router.push('/quiz');
    } catch {
      Alert.alert('Error', 'Failed to start review. Please try again.');
    }
  };

  // Note: remove handlers are now inlined in the detail modal buttons

  if (loading) {
    return (
      <ModernCard variant="neutral" delay={100}>
        <ThemedText style={styles.loadingText}>Loading review data...</ThemedText>
      </ModernCard>
    );
  }

  return (
    <View style={styles.container}>
      {/* Search Section */}
      <Animated.View entering={FadeInDown.delay(60)}>
        <ModernCard variant="primary" delay={0}>
          <ThemedText style={styles.sectionTitle}>🔎 Search Words (A1–C2)</ThemedText>
          <TextInput
            placeholder="Type to search..."
            placeholderTextColor="rgba(255,255,255,0.6)"
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={styles.searchInput}
          />
          {searchQuery.trim().length > 0 && (
            <View style={styles.suggestionsBox}>
              {searching || apiSearching ? (
                <ThemedText style={styles.detailText}>
                  {searching && 'Searching local vocabulary...'}
                  {apiSearching && 'Searching WordsAPI...'}
                </ThemedText>
              ) : searchResults.length === 0 ? (
                <View style={styles.noResultsContainer}>
                  <ThemedText style={styles.detailText}>No results found in local vocabulary</ThemedText>
                  <ModernButton
                    title={hasApiKey ? "Search WordsAPI" : "Please set API Key"}
                    onPress={searchWithWordsApi}
                    variant={hasApiKey ? "secondary" : "disabled"}
                    size="sm"
                    icon={hasApiKey ? "🔍" : "⚠️"}
                    style={styles.apiSearchButton}
                    disabled={!hasApiKey || apiSearching}
                  />
                </View>
              ) : (
                <>
                  {searchResults.map((s, idx) => (
                    <Pressable 
                      key={`s-${s.cefr}-${s.word}-${idx}`} 
                      onPress={() => {
                        if (s.cefr === 'EXTERNAL') {
                          // 外部API結果の場合も、最新のブックマーク状態で詳細を表示
                          openEnrichedDetail(s.word, s.cefr, undefined, 'search');
                        } else {
                          openEnrichedDetail(s.word, s.cefr, undefined, 'search');
                        }
                      }}
                    >
                      <View style={styles.suggestionRow}>
                        <ThemedText style={styles.suggestionWord}>{s.word}</ThemedText>
                        <View style={s.cefr === 'EXTERNAL' ? styles.apiBadge : styles.cefrBadge}>
                          <ThemedText style={s.cefr === 'EXTERNAL' ? styles.apiText : styles.cefrText}>
                            {s.cefr === 'EXTERNAL' ? 'API' : s.cefr}
                          </ThemedText>
                        </View>
                      </View>
                      {s.definition ? (
                        <ThemedText style={styles.suggestionDef} numberOfLines={1}>{s.definition}</ThemedText>
                      ) : null}
                    </Pressable>
                  ))}
                  {hasApiKey && !searchResults.some(r => r.cefr === 'EXTERNAL') && (
                    <ModernButton
                      title="Search WordsAPI for more results"
                      onPress={searchWithWordsApi}
                      variant="secondary"
                      size="sm"
                      icon="🔍"
                      style={styles.apiSearchButton}
                      disabled={apiSearching}
                    />
                  )}
                </>
              )}
            </View>
          )}
        </ModernCard>
      </Animated.View>
      {/* Bookmarked Words Section */}
      <Animated.View entering={FadeInDown.delay(100)}>
        <ModernCard variant="secondary" delay={0}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <ThemedText style={styles.sectionEmoji}>⭐</ThemedText>
              <ThemedText style={styles.sectionTitle}>
                Bookmarked Words
              </ThemedText>
            </View>
            <Pressable onPress={() => { setListType('bookmarked'); setListVisible(true); }}>
              <ThemedText style={styles.wordCount}>
                {bookmarkedWords.length + enrichedBookmarkedWords.length} words
              </ThemedText>
            </Pressable>
          </View>

          {(bookmarkedWords.length + enrichedBookmarkedWords.length) > 0 ? (
            <>
              {/* Bookmarked pagination (10 per page) */}
              {(() => {
                const combined = [
                  ...bookmarkedWords.map(w => ({
                    key: `legacy-${w.id}`,
                    type: 'legacy' as const,
                    word: w.word,
                    definition: w.definition,
                    cefr: undefined as string | undefined,
                    legacy: w,
                  })),
                  ...enrichedBookmarkedWords.map(w => ({
                    key: `enriched-${w.word}-${w.cefr_level}`,
                    type: 'enriched' as const,
                    word: w.word,
                    definition: enrichedDefinitionMap[`${w.word}|${w.cefr_level}`] || `${w.cefr_level} level word`,
                    cefr: w.cefr_level,
                    legacy: undefined,
                  })),
                ];
                const pageSize = 10;
                const totalPages = Math.max(1, Math.ceil(combined.length / pageSize));
                const page = Math.min(bookmarkedPage, totalPages - 1);
                const pageItems = combined.slice(page * pageSize, page * pageSize + pageSize);
                return (
                  <>
                    <ScrollView 
                      horizontal 
                      showsHorizontalScrollIndicator={false}
                      style={styles.wordsScroll}
                      contentContainerStyle={styles.wordsScrollContent}
                    >
                      {pageItems.map((item, idx) => (
                        <Animated.View key={item.key} entering={FadeInLeft.delay(200 + idx * 80)}>
                          <ModernCard
                            variant="glass"
                            onPress={() => item.type === 'legacy' ? openLegacyDetail(item.legacy!) : openEnrichedDetail(item.word, item.cefr!, undefined, 'bookmarked')}
                            style={styles.wordCard}
                            glassEffect={true}
                          >
                            <ThemedText style={styles.wordText}>{item.word}</ThemedText>
                            <ThemedText style={styles.definitionText} numberOfLines={2}>
                              {item.definition}
                            </ThemedText>
                            <View style={item.cefr ? styles.cefrBadge : styles.sourceBadge}>
                              <ThemedText style={item.cefr ? styles.cefrText : styles.sourceText}>
                                {item.cefr || 'Legacy'}
                              </ThemedText>
                            </View>
                          </ModernCard>
                        </Animated.View>
                      ))}
                    </ScrollView>
                    {combined.length > pageSize && (
                      <View style={styles.paginationRow}>
                        <ModernButton
                          title="Prev"
                          onPress={() => setBookmarkedPage(Math.max(0, page - 1))}
                          variant="secondary"
                          size="sm"
                          style={styles.paginationButton}
                        />
                        <ThemedText style={styles.paginationText}>{page + 1} / {totalPages}</ThemedText>
                        <ModernButton
                          title="Next"
                          onPress={() => setBookmarkedPage(Math.min(totalPages - 1, page + 1))}
                          variant="secondary"
                          size="sm"
                          style={styles.paginationButton}
                        />
                      </View>
                    )}
                  </>
                );
              })()}

              <Animated.View entering={FadeInDown.delay(400)}>
                  <ModernButton
                    title="Review Bookmarked Words"
                    onPress={() => handleStartReview('bookmarked')}
                    variant="secondary"
                    size="lg"
                    icon="⭐"
                    style={styles.reviewButton}
                  />
              </Animated.View>
            </>
          ) : (
            <Animated.View entering={FadeInDown.delay(300)} style={styles.emptyState}>
              <ThemedText style={styles.emptyStateText}>
                No bookmarked words yet
              </ThemedText>
              <ThemedText style={styles.emptyStateSubtext}>
                Bookmark words during quizzes to review them later
              </ThemedText>
            </Animated.View>
          )}
        </ModernCard>
      </Animated.View>

      {/* Weak Words Section */}
      <Animated.View entering={FadeInDown.delay(200)}>
        <ModernCard variant="error" delay={0}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <ThemedText style={styles.sectionEmoji}>🔥</ThemedText>
              <ThemedText style={styles.sectionTitle}>
                Challenging Words
              </ThemedText>
            </View>
            <Pressable onPress={() => { setListType('challenging'); setListVisible(true); }}>
              <ThemedText style={styles.wordCount}>
                {weakWords.length + enrichedWeakWords.length} words
              </ThemedText>
            </Pressable>
          </View>

          {(weakWords.length + enrichedWeakWords.length) > 0 ? (
            <>
              {(() => {
                const combined = [
                  ...weakWords.map(w => ({
                    key: `legacy-weak-${w.id}`,
                    type: 'legacy' as const,
                    word: w.word,
                    definition: w.definition,
                    cefr: undefined as string | undefined,
                    legacy: w,
                  })),
                  ...enrichedWeakWords.map(w => ({
                    key: `enriched-weak-${w.word}-${w.cefr_level}`,
                    type: 'enriched' as const,
                    word: w.word,
                    definition: enrichedDefinitionMap[`${w.word}|${w.cefr_level}`] || `${w.cefr_level} level word`,
                    cefr: w.cefr_level,
                    legacy: undefined,
                    stats: { attempts: w.attempts, correctAttempts: w.correct_attempts, masteryLevel: w.mastery_level }
                  })),
                ];
                const pageSize = 10;
                const totalPages = Math.max(1, Math.ceil(combined.length / pageSize));
                const page = Math.min(challengingPage, totalPages - 1);
                const pageItems = combined.slice(page * pageSize, page * pageSize + pageSize);
                return (
                  <>
                    <ScrollView 
                      horizontal 
                      showsHorizontalScrollIndicator={false}
                      style={styles.wordsScroll}
                      contentContainerStyle={styles.wordsScrollContent}
                    >
                      {pageItems.map((item, idx) => (
                        <Animated.View key={item.key} entering={FadeInRight.delay(300 + idx * 80)}>
                          <ModernCard
                            variant="glass"
                            onPress={() => item.type === 'legacy' ? undefined : openEnrichedDetail(item.word, item.cefr!, item.stats, 'challenging')}
                            style={styles.wordCard}
                            glassEffect={true}
                          >
                            <ThemedText style={styles.wordText}>{item.word}</ThemedText>
                            <ThemedText style={styles.definitionText} numberOfLines={2}>
                              {item.definition}
                            </ThemedText>
                            <View style={item.cefr ? styles.cefrBadge : styles.difficultyBadge}>
                              <ThemedText style={item.cefr ? styles.cefrText : styles.difficultyText}>
                                {item.cefr || (item.legacy?.difficulty === 1 ? 'Easy' : item.legacy?.difficulty === 2 ? 'Medium' : 'Hard')}
                              </ThemedText>
                            </View>
                          </ModernCard>
                        </Animated.View>
                      ))}
                    </ScrollView>
                    {combined.length > pageSize && (
                      <View style={styles.paginationRow}>
                        <ModernButton
                          title="Prev"
                          onPress={() => setChallengingPage(Math.max(0, page - 1))}
                          variant="secondary"
                          size="sm"
                          style={styles.paginationButton}
                        />
                        <ThemedText style={styles.paginationText}>{page + 1} / {totalPages}</ThemedText>
                        <ModernButton
                          title="Next"
                          onPress={() => setChallengingPage(Math.min(totalPages - 1, page + 1))}
                          variant="secondary"
                          size="sm"
                          style={styles.paginationButton}
                        />
                      </View>
                    )}
                  </>
                );
              })()}

              <Animated.View entering={FadeInDown.delay(500)}>
                <ModernButton
                  title="Practice Challenging Words"
                  onPress={() => handleStartReview('weak')}
                  variant="error"
                  size="lg"
                  icon="🔥"
                  style={styles.reviewButton}
                />
              </Animated.View>
            </>
          ) : (
            <Animated.View entering={FadeInDown.delay(400)} style={styles.emptyState}>
              <ThemedText style={styles.emptyStateText}>
                No challenging words identified yet
              </ThemedText>
              <ThemedText style={styles.emptyStateSubtext}>
                Keep practicing to identify words that need more work
              </ThemedText>
            </Animated.View>
          )}
        </ModernCard>
      </Animated.View>

      {/* Quick Actions */}
      <Animated.View entering={FadeInDown.delay(300)}>
        <ModernCard variant="primary" delay={0} style={styles.quickActionsCard}>
          <ThemedText style={styles.sectionTitle}>
            Quick Review Options
          </ThemedText>
          
          <View style={styles.quickActions}>
            <ModernButton
              title="Start New Quiz"
              onPress={() => router.push('/quiz')}
              variant="success"
              size="md"
              icon="🎯"
              style={styles.quickActionButton}
            />
            
            <ModernButton
              title="Refresh Data"
              onPress={loadReviewData}
              variant="secondary"
              size="md"
              icon="🔄"
              style={styles.quickActionButton}
            />
          </View>
        </ModernCard>
      </Animated.View>
      {/* Detail Modal */}
      <Modal visible={detailVisible} transparent animationType="fade" onRequestClose={() => setDetailVisible(false)}>
        <View style={styles.detailOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setDetailVisible(false)} />
          <Animated.View entering={FadeInDown.delay(50)} style={styles.detailSheet}>
            {detailData && (
              <>
                <ThemedText style={styles.detailTitle}>{detailData.word}</ThemedText>
                {'cefr' in detailData && detailData.cefr ? (
                  <View style={styles.detailBadgesRow}>
                    <View style={detailData.cefr === 'EXTERNAL' ? styles.apiBadge : styles.cefrBadge}>
                      <ThemedText style={detailData.cefr === 'EXTERNAL' ? styles.apiText : styles.cefrText}>
                        {detailData.cefr === 'EXTERNAL' ? 'API' : detailData.cefr}
                      </ThemedText>
                    </View>
                    {detailData.pos ? (<View style={styles.sourceBadge}><ThemedText style={styles.sourceText}>{detailData.pos}</ThemedText></View>) : null}
                    {'accuracy' in detailData && detailData.accuracy !== undefined && typeof detailData.accuracy === 'number' ? (
                      <View style={styles.accuracyBadgeDetail}>
                        <ThemedText style={styles.accuracyTextDetail}>
                          {Math.round(detailData.accuracy * 100)}% accuracy
                        </ThemedText>
                      </View>
                    ) : null}
                  </View>
                ) : null}

                {/* Show tabs if multiple meanings exist */}
                {'meanings' in detailData && detailData.meanings && detailData.meanings.length > 0 ? (
                  <View style={{ marginBottom: Spacing.md }}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
                      <View style={{ flexDirection: 'row', gap: 8 }}>
                        {detailData.meanings.map((m, idx) => (
                          <Pressable key={`m-${idx}`} onPress={() => {
                            console.log(`Tab clicked: ${idx}, current meaningIndex: ${meaningIndex}`);
                            console.log(`Selected meaning synonyms:`, m.synonyms);
                            setMeaningIndex(idx);
                          }}>
                            <View style={[styles.tabPill, meaningIndex === idx ? styles.tabPillActive : styles.tabPillInactive]}>
                              <ThemedText style={meaningIndex === idx ? styles.tabPillTextActive : styles.tabPillTextInactive}>
                                {m.partOfSpeech || `Def ${idx + 1}`}
                              </ThemedText>
                            </View>
                          </Pressable>
                        ))}
                      </View>
                    </ScrollView>
                  </View>
                ) : null}

                {/* Unified Word Details - Always show 4 items: Definition, Synonyms, Example, Pronunciation */}
                {/* Definition */}
                <View style={styles.detailBlock}>
                  <ThemedText style={styles.detailLabel}>Definition</ThemedText>
                  <ThemedText style={styles.detailText}>
                    {(() => {
                      const hasMultipleMeanings = 'meanings' in detailData && detailData.meanings && detailData.meanings.length > 0;
                      const currentDefinition = hasMultipleMeanings && detailData.meanings ? detailData.meanings[meaningIndex]?.definition : null;
                      const globalDefinition = detailData.definition;

                      console.log('Definition debug:', {
                        hasMultipleMeanings,
                        meaningIndex,
                        currentDefinition,
                        globalDefinition
                      });

                      if (hasMultipleMeanings && detailData.meanings) {
                        return currentDefinition || globalDefinition || 'No definition available';
                      } else {
                        return globalDefinition || 'No definition available';
                      }
                    })()}
                  </ThemedText>
                </View>

                {/* Synonyms */}
                <View style={styles.detailBlock}>
                  <ThemedText style={styles.detailLabel}>Synonyms</ThemedText>
                  <ThemedText style={styles.detailText}>
                    {(() => {
                      const hasMultipleMeanings = 'meanings' in detailData && detailData.meanings && detailData.meanings.length > 0;
                      const currentMeaningSynonyms = hasMultipleMeanings && detailData.meanings ? detailData.meanings[meaningIndex]?.synonyms : null;
                      const globalSynonyms = detailData.type === 'enriched' && 'synonyms' in detailData ? detailData.synonyms : null;

                      console.log('Synonyms debug:', {
                        hasMultipleMeanings,
                        meaningIndex,
                        currentMeaningSynonyms,
                        globalSynonyms,
                        currentMeaningSynonymsLength: currentMeaningSynonyms?.length,
                        globalSynonymsLength: globalSynonyms?.length
                      });

                      if (hasMultipleMeanings && detailData.meanings) {
                        if (currentMeaningSynonyms && currentMeaningSynonyms.length > 0) {
                          return currentMeaningSynonyms.join(', ');
                        } else if (globalSynonyms && globalSynonyms.length > 0) {
                          return globalSynonyms.join(', ');
                        } else {
                          return 'No synonyms available';
                        }
                      } else {
                        if (globalSynonyms && globalSynonyms.length > 0) {
                          return globalSynonyms.join(', ');
                        } else {
                          return 'No synonyms available';
                        }
                      }
                    })()}
                  </ThemedText>
                </View>

                {/* Example */}
                <View style={styles.detailBlock}>
                  <ThemedText style={styles.detailLabel}>Example</ThemedText>
                  <ThemedText style={styles.detailText}>
                    {'meanings' in detailData && detailData.meanings && detailData.meanings.length > 0
                      ? (detailData.meanings[meaningIndex]?.examples && detailData.meanings[meaningIndex]?.examples.length > 0)
                        ? detailData.meanings[meaningIndex]?.examples[0]
                        : (detailData.meanings[meaningIndex]?.example)
                          ? detailData.meanings[meaningIndex]?.example
                          : (detailData.type === 'enriched' && 'example' in detailData && detailData.example)
                            ? detailData.example
                            : 'No example available'
                      : (detailData.type === 'enriched' && 'example' in detailData && detailData.example)
                        ? detailData.example
                        : 'No example available'
                    }
                  </ThemedText>
                </View>

                {/* Pronunciation */}
                {detailData.pronunciation ? (
                  <View style={styles.detailBlock}>
                    <ThemedText style={styles.detailLabel}>Pronunciation</ThemedText>
                    <ThemedText style={styles.detailText}>{detailData.pronunciation}</ThemedText>
                  </View>
                ) : null}
                {/* Show Accuracy separately if available */}
                {'attempts' in detailData && (detailData.attempts ?? 0) > 0 ? (
                  <View style={styles.detailBlock}>
                    <ThemedText style={styles.detailLabel}>Accuracy</ThemedText>
                    <ThemedText style={styles.detailText}>
                      {Math.round(((detailData.correctAttempts ?? 0) / (detailData.attempts ?? 1)) * 100)}% ({detailData.correctAttempts ?? 0}/{detailData.attempts ?? 0})
                    </ThemedText>
                  </View>
                ) : null}

                {detailData?.type === 'enriched' && detailData.source === 'search' && (
                  <ModernButton
                    title={detailData.isBookmarked ? 'Remove Bookmark' : 'Add Bookmark'}
                    onPress={async () => {
                      try {
                        await databaseService.toggleEnrichedWordBookmark(detailData.word, detailData.cefr);
                        await loadReviewData();
                        
                        // 検索結果にEXTERNAL単語がある場合、その状態を更新
                        if (detailData.cefr === 'EXTERNAL' && searchResults.some(r => r.cefr === 'EXTERNAL' && r.word === detailData.word)) {
                          // 検索結果から該当のEXTERNAL単語を削除（ブックマーク削除の場合）
                          const wasBookmarked = detailData.isBookmarked;
                          if (wasBookmarked) {
                            // ブックマークを削除した場合、検索結果からも削除
                            setSearchResults(prev => prev.filter(r => !(r.cefr === 'EXTERNAL' && r.word === detailData.word)));
                          }
                        }
                        
                        setDetailVisible(false);
                      } catch (err) {
                        console.error('[ReviewSection] Error during bookmark toggle:', err);
                        Alert.alert('Error', 'Failed to update bookmark.');
                      }
                    }}
                    variant="secondary"
                    size="md"
                    icon={detailData.isBookmarked ? '🗑️' : '⭐'}
                    style={styles.detailRemoveButton}
                  />
                )}
                {detailData?.type === 'enriched' && detailData.source === 'bookmarked' && (
                  <ModernButton
                    title="Remove Bookmark"
                    onPress={async () => {
                      try {
                        await databaseService.removeEnrichedBookmark(detailData.word, detailData.cefr);
                        await loadReviewData();
                        setDetailVisible(false);
                      } catch (err) {
                        console.error('[ReviewSection] Error during enriched bookmark removal:', err);
                        Alert.alert('Error', 'Failed to remove bookmark.');
                      }
                    }}
                    variant="error"
                    size="md"
                    icon="🗑️"
                    style={styles.detailRemoveButton}
                  />
                )}
                {detailData?.type === 'enriched' && detailData.source === 'challenging' && (
                  <ModernButton
                    title="Remove Challenging Word"
                    onPress={async () => {
                      try {
                        await databaseService.removeEnrichedWeakWord(detailData.word, detailData.cefr);
                        await loadReviewData();
                        setDetailVisible(false);
                      } catch (err) {
                        console.error('[ReviewSection] Error during weak word removal:', err);
                        Alert.alert('Error', 'Failed to remove challenging word.');
                      }
                    }}
                    variant="error"
                    size="md"
                    icon="🗑️"
                    style={styles.detailRemoveButton}
                  />
                )}
              </>
            )}
          </Animated.View>
        </View>
      </Modal>

      {/* Word List Modal (Bookmarked / Challenging) */}
      <Modal visible={listVisible} transparent animationType="fade" onRequestClose={() => setListVisible(false)}>
        <View style={styles.detailOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setListVisible(false)} />
          <Animated.View entering={FadeInDown.delay(50)} style={styles.detailSheet}>
            <ThemedText style={styles.detailTitle}>
              {listType === 'bookmarked' ? 'Bookmarked Words' : 'Challenging Words'}
            </ThemedText>
            <ScrollView style={styles.listScroll} contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={true}>
              {(() => {
                const words = listType === 'bookmarked'
                  ? [
                      ...bookmarkedWords.map(w => w.word),
                      ...enrichedBookmarkedWords.map(w => w.word),
                    ]
                  : [
                      ...weakWords.map(w => w.word),
                      ...enrichedWeakWords.map(w => w.word),
                    ];
                if (words.length === 0) {
                  return <ThemedText style={styles.detailText}>No words</ThemedText>;
                }
                return (
                  <View style={styles.listItemsWrapper}>
                    {listType === 'bookmarked' ? (
                      // Bookmarked Words表示（既存ロジック）
                      words.map((w, idx) => (
                        <Pressable 
                          key={`${listType}-w-${idx}`} 
                          style={styles.listItemPressable}
                          onPress={() => {
                            // ブックマーク単語の詳細表示ロジック
                            const legacyWord = bookmarkedWords.find(bw => bw.word === w);
                            const enrichedWord = enrichedBookmarkedWords.find(ew => ew.word === w);
                            
                            if (enrichedWord) {
                              openEnrichedDetail(w, enrichedWord.cefr_level, undefined, 'bookmarked');
                            } else if (legacyWord) {
                              setDetailData({
                                type: 'legacy',
                                word: legacyWord.word,
                                definition: legacyWord.definition,
                                pronunciation: legacyWord.pronunciation,
                                difficulty: legacyWord.difficulty
                              });
                              setDetailVisible(true);
                            }
                            setListVisible(false);
                          }}
                        >
                          <ThemedText style={styles.listItem}>• {w}</ThemedText>
                        </Pressable>
                      ))
                    ) : (
                      // Challenging Words表示（拡張版）
                      (() => {
                        const challengingItems = [
                          ...weakWords.map(w => ({ 
                            word: w.word, 
                            type: 'legacy' as const,
                            accuracy: 0, // Legacy words accuracy calculation needed
                            category: w.category || 'Unknown'
                          })),
                          ...enrichedWeakWords.map(w => {
                            const accuracy = w.attempts > 0 ? w.correct_attempts / w.attempts : 0;
                            console.log(`Challenging word ${w.word} (${w.cefr_level}): ${w.correct_attempts}/${w.attempts} = ${accuracy}`);
                            return {
                              word: w.word, 
                              type: 'enriched' as const,
                              cefr_level: w.cefr_level,
                              accuracy: accuracy,
                              category: w.cefr_level
                            };
                          })
                        ];
                        
                        return challengingItems.map((item, idx) => {
                          console.log(`Rendering challenging item ${idx}: ${item.word}, accuracy: ${item.accuracy}, type: ${item.type}`);
                          return (
                            <Pressable 
                              key={`challenging-${idx}`} 
                              style={styles.challengingWordItem}
                              onPress={() => {
                                if (item.type === 'enriched' && 'cefr_level' in item) {
                                  openEnrichedDetail(item.word, item.cefr_level, undefined, 'challenging');
                                } else {
                                  const legacyWord = weakWords.find(w => w.word === item.word);
                                  if (legacyWord) {
                                    setDetailData({
                                      type: 'legacy',
                                      word: legacyWord.word,
                                      definition: legacyWord.definition,
                                      pronunciation: legacyWord.pronunciation,
                                      difficulty: legacyWord.difficulty
                                    });
                                    setDetailVisible(true);
                                  }
                                }
                                setListVisible(false);
                              }}
                            >
                              <View style={styles.challengingWordContent}>
                                <View style={styles.challengingWordHeader}>
                                  <ThemedText style={styles.challengingWordText}>{item.word}</ThemedText>
                                  <View style={styles.challengingWordBadges}>
                                    <View style={styles.accuracyBadgeSmall}>
                                      <ThemedText style={styles.accuracyTextSmall}>
                                        {(() => {
                                          const percentage = Math.round(item.accuracy * 100);
                                          console.log(`Displaying accuracy for ${item.word}: ${item.accuracy} -> ${percentage}%`);
                                          return `${percentage}%`;
                                        })()}
                                      </ThemedText>
                                    </View>
                                    <View style={item.type === 'enriched' && 'cefr_level' in item && item.cefr_level === 'EXTERNAL' ? styles.apiBadgeSmall : styles.categoryBadgeSmall}>
                                      <ThemedText style={item.type === 'enriched' && 'cefr_level' in item && item.cefr_level === 'EXTERNAL' ? styles.apiTextSmall : styles.categoryTextSmall}>
                                        {item.type === 'enriched' && 'cefr_level' in item && item.cefr_level === 'EXTERNAL' ? 'API' : item.category}
                                      </ThemedText>
                                    </View>
                                  </View>
                                </View>
                              </View>
                            </Pressable>
                          );
                        });
                      })()
                    )}
                  </View>
                );
              })()}
            </ScrollView>
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: Spacing.lg,
  },
  loadingText: {
    textAlign: 'center',
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '500',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionEmoji: {
    fontSize: 24,
    marginRight: Spacing.xs,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
  },
  wordCount: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '600',
  },
  wordsScroll: {
    marginBottom: Spacing.lg,
  },
  wordsScrollContent: {
    paddingRight: Spacing.md,
  },
  wordCard: {
    width: 150,
    minHeight: 120,
    marginRight: Spacing.sm,
    marginVertical: 0,
  },
  wordText: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: Spacing.xs,
    color: '#ffffff',
  },
  definitionText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 18,
    flex: 1,
    fontWeight: '400',
  },
  sourceBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    paddingHorizontal: Spacing.xs,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginTop: Spacing.xs,
  },
  sourceText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '700',
  },
  cefrBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    paddingHorizontal: Spacing.xs,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginTop: Spacing.xs,
  },
  cefrText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '700',
  },
  apiBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.8)', // Green for API results
    paddingHorizontal: Spacing.xs,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginTop: Spacing.xs,
  },
  apiText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '700',
  },
  difficultyBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    paddingHorizontal: Spacing.xs,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginTop: Spacing.xs,
  },
  difficultyText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '700',
  },
  reviewButton: {
    width: '100%',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: Spacing.xs,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  emptyStateSubtext: {
    fontSize: 14,
    textAlign: 'center',
    color: 'rgba(255, 255, 255, 0.6)',
    lineHeight: 20,
    fontWeight: '400',
  },
  quickActions: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: Spacing.xs,
    marginTop: Spacing.md,
  },
  quickActionButton: {
    width: '80%',
  },
  quickActionsCard: {
    marginBottom: Spacing.lg,
  },
  detailOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailSheet: {
    width: '92%',
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 16,
    padding: Spacing.md,
    maxHeight: '70%',
  },
  detailTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: Spacing.sm,
  },
  detailBadgesRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
    marginBottom: Spacing.md,
  },
  detailBlock: {
    marginBottom: Spacing.sm,
  },
  detailLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 4,
    fontWeight: '700',
  },
  detailText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.95)',
    lineHeight: 20,
  },
  detailRemoveButton: {
    marginTop: Spacing.md,
  },
  tabPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  tabPillActive: {
    backgroundColor: 'rgba(66,165,245,0.2)',
    borderColor: 'rgba(66,165,245,0.5)',
  },
  tabPillInactive: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderColor: 'rgba(255,255,255,0.15)',
  },
  tabPillTextActive: {
    color: '#42a5f5',
    fontWeight: '700',
    fontSize: 12,
  },
  tabPillTextInactive: {
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '600',
    fontSize: 12,
  },
  listScroll: {
    maxHeight: '100%',
  },
  listContent: {
    paddingBottom: Spacing.md,
  },
  listItemsWrapper: {
    paddingBottom: Spacing.sm,
    gap: 6,
  },
  listItem: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.95)',
    lineHeight: 22,
  },
  paginationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.xs,
    marginBottom: Spacing.md,
  },
  paginationButton: {
    minWidth: 100,
  },
  paginationText: {
    color: '#ffffff',
    fontWeight: '700',
  },
  paginationInfoRow: {
    alignItems: 'center',
    marginTop: Spacing.xs,
  },
  paginationInfoText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
  },
  // Search styles
  searchInput: {
    width: '100%',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    color: '#ffffff',
    marginTop: Spacing.sm,
    marginBottom: Spacing.sm,
    backgroundColor: 'rgba(255,255,255,0.08)'
  },
  suggestionsBox: {
    gap: 8,
  },
  suggestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  suggestionWord: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  suggestionDef: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 12,
    marginLeft: 2,
    marginBottom: 6,
  },
  noResultsContainer: {
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
  },
  apiSearchButton: {
    marginTop: Spacing.xs,
    width: '100%',
  },
  listItemPressable: {
    marginBottom: Spacing.xs,
  },
  challengingWordItem: {
    marginBottom: Spacing.sm,
    padding: Spacing.sm,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  challengingWordContent: {
    flexDirection: 'column',
    gap: Spacing.xs,
  },
  challengingWordText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  challengingWordMeta: {
    flexDirection: 'row',
    gap: Spacing.xs,
    alignItems: 'center',
    flexWrap: 'wrap',
    marginTop: 4,
  },
  accuracyBadge: {
    backgroundColor: 'rgba(255,87,87,0.3)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,87,87,0.5)',
    minWidth: 80,
    alignItems: 'center',
  },
  accuracyText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  categoryBadge: {
    backgroundColor: 'rgba(66,165,245,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(66,165,245,0.3)',
  },
  categoryText: {
    color: '#42a5f5',
    fontSize: 11,
    fontWeight: '600',
  },
  // 新しいスタイル: 単語の横に配置される小さなバッジ
  challengingWordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  challengingWordBadges: {
    flexDirection: 'row',
    gap: Spacing.xs,
    alignItems: 'center',
  },
  accuracyBadgeSmall: {
    backgroundColor: 'rgba(255,87,87,0.3)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,87,87,0.5)',
    minWidth: 35,
    alignItems: 'center',
  },
  accuracyTextSmall: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '600',
  },
  categoryBadgeSmall: {
    backgroundColor: 'rgba(66,165,245,0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(66,165,245,0.3)',
    minWidth: 35,
    alignItems: 'center',
  },
  categoryTextSmall: {
    color: '#42a5f5',
    fontSize: 9,
    fontWeight: '600',
  },
  apiBadgeSmall: {
    backgroundColor: 'rgba(255,165,0,0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,165,0,0.4)',
    minWidth: 35,
    alignItems: 'center',
  },
  apiTextSmall: {
    color: '#ffa500',
    fontSize: 9,
    fontWeight: '600',
  },
  // 詳細モーダル用のaccuracyバッジ
  accuracyBadgeDetail: {
    backgroundColor: 'rgba(255,87,87,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,87,87,0.3)',
  },
  accuracyTextDetail: {
    color: '#ff5757',
    fontSize: 11,
    fontWeight: '600',
  },
});