import { Spacing } from '@/constants/ModernColors';
import { databaseService } from '@/services/database';
import { enrichedVocabularyService } from '@/services/enrichedVocabularyService';
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
        definition?: string;
        pronunciation?: string;
        example?: string;
        synonyms?: string[];
        antonyms?: string[];
        pos?: string;
        attempts?: number;
        correctAttempts?: number;
        masteryLevel?: number;
      }
    | null
  >(null);
  const [enrichedDefinitionMap, setEnrichedDefinitionMap] = useState<Record<string, string>>({});

  useEffect(() => {
    loadReviewData();
  }, []);

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
        ]));
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
    stats?: { attempts?: number; correctAttempts?: number; masteryLevel?: number }
  ) => {
    try {
      const data = await enrichedVocabularyService.getEnrichedVocabulary(cefr);
      const found = data.vocabulary.find(v => v.word.toLowerCase() === word.toLowerCase());
      setDetailData({
        type: 'enriched',
        word,
        cefr,
        definition: found?.apiData?.definitions && found.apiData.definitions.length > 0 ? found.apiData.definitions[0].definition : undefined,
        pronunciation: found?.apiData?.pronunciation?.all,
        example: found?.apiData?.examples && found.apiData.examples.length > 0 ? found.apiData.examples[0] : undefined,
        synonyms: found?.apiData?.synonyms,
        antonyms: found?.apiData?.antonyms,
        pos: found?.pos,
        attempts: stats?.attempts,
        correctAttempts: stats?.correctAttempts,
        masteryLevel: stats?.masteryLevel,
      });
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

  const handleRemoveBookmark = async (wordId: number) => {
    try {
      await databaseService.toggleBookmark(wordId);
      await loadReviewData();
      Alert.alert('Success', 'Bookmark removed');
    } catch {
      Alert.alert('Error', 'Failed to remove bookmark');
    }
  };

  const handleRemoveEnrichedBookmark = async (word: string, cefrLevel: string) => {
    try {
      await databaseService.removeEnrichedBookmark(word, cefrLevel);
      await loadReviewData();
      Alert.alert('Success', 'Enriched bookmark removed');
    } catch {
      Alert.alert('Error', 'Failed to remove enriched bookmark');
    }
  };

  if (loading) {
    return (
      <ModernCard variant="neutral" delay={100}>
        <ThemedText style={styles.loadingText}>Loading review data...</ThemedText>
      </ModernCard>
    );
  }

  return (
    <View style={styles.container}>
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
            <ThemedText style={styles.wordCount}>
              {bookmarkedWords.length + enrichedBookmarkedWords.length} words
            </ThemedText>
          </View>

          {(bookmarkedWords.length + enrichedBookmarkedWords.length) > 0 ? (
            <>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                style={styles.wordsScroll}
                contentContainerStyle={styles.wordsScrollContent}
              >
                {/* Legacy bookmarked words */}
                {bookmarkedWords.slice(0, 5).map((word, index) => (
                  <Animated.View
                    key={`legacy-${word.id}`}
                    entering={FadeInLeft.delay(200 + index * 100)}
                  >
                    <ModernCard
                      variant="glass"
                      onPress={() => openLegacyDetail(word)}
                      style={styles.wordCard}
                      glassEffect={true}
                    >
                      <ThemedText style={styles.wordText}>{word.word}</ThemedText>
                      <ThemedText style={styles.definitionText} numberOfLines={2}>
                        {word.definition}
                      </ThemedText>
                      <View style={styles.sourceBadge}>
                        <ThemedText style={styles.sourceText}>Legacy</ThemedText>
                      </View>
                    </ModernCard>
                  </Animated.View>
                ))}
                
                {/* Enriched bookmarked words */}
                {enrichedBookmarkedWords.slice(0, 5).map((word, index) => (
                  <Animated.View
                    key={`enriched-${word.word}-${word.cefr_level}`}
                    entering={FadeInLeft.delay(200 + (bookmarkedWords.length + index) * 100)}
                  >
                    <ModernCard
                      variant="glass"
                      onPress={() => openEnrichedDetail(word.word, word.cefr_level)}
                      style={styles.wordCard}
                      glassEffect={true}
                    >
                      <ThemedText style={styles.wordText}>{word.word}</ThemedText>
                      <ThemedText style={styles.definitionText} numberOfLines={2}>
                        {enrichedDefinitionMap[`${word.word}|${word.cefr_level}`] || `${word.cefr_level} level word`}
                      </ThemedText>
                      <View style={styles.cefrBadge}>
                        <ThemedText style={styles.cefrText}>{word.cefr_level}</ThemedText>
                      </View>
                    </ModernCard>
                  </Animated.View>
                ))}
              </ScrollView>

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
            <ThemedText style={styles.wordCount}>
              {weakWords.length + enrichedWeakWords.length} words
            </ThemedText>
          </View>

          {(weakWords.length + enrichedWeakWords.length) > 0 ? (
            <>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                style={styles.wordsScroll}
                contentContainerStyle={styles.wordsScrollContent}
              >
                {/* Legacy weak words */}
                {weakWords.slice(0, 5).map((word, index) => (
                  <Animated.View
                    key={`legacy-weak-${word.id}`}
                    entering={FadeInRight.delay(300 + index * 100)}
                  >
                    <ModernCard
                      variant="glass"
                      style={styles.wordCard}
                      glassEffect={true}
                    >
                      <ThemedText style={styles.wordText}>{word.word}</ThemedText>
                      <ThemedText style={styles.definitionText} numberOfLines={2}>
                        {word.definition}
                      </ThemedText>
                      <View style={styles.difficultyBadge}>
                        <ThemedText style={styles.difficultyText}>
                          {word.difficulty === 1 ? 'Easy' : 
                           word.difficulty === 2 ? 'Medium' : 'Hard'}
                        </ThemedText>
                      </View>
                    </ModernCard>
                  </Animated.View>
                ))}
                
                {/* Enriched weak words */}
                {enrichedWeakWords.slice(0, 5).map((word, index) => (
                  <Animated.View
                    key={`enriched-weak-${word.word}-${word.cefr_level}`}
                    entering={FadeInRight.delay(300 + (weakWords.length + index) * 100)}
                  >
                    <ModernCard
                      variant="glass"
                      onPress={() => openEnrichedDetail(word.word, word.cefr_level, { attempts: word.attempts, correctAttempts: word.correct_attempts, masteryLevel: word.mastery_level })}
                      style={styles.wordCard}
                      glassEffect={true}
                    >
                      <ThemedText style={styles.wordText}>{word.word}</ThemedText>
                      <ThemedText style={styles.definitionText} numberOfLines={2}>
                        {enrichedDefinitionMap[`${word.word}|${word.cefr_level}`] || `${word.cefr_level} level word`}
                      </ThemedText>
                      <View style={styles.cefrBadge}>
                        <ThemedText style={styles.cefrText}>{word.cefr_level}</ThemedText>
                      </View>
                    </ModernCard>
                  </Animated.View>
                ))}
              </ScrollView>

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
        <Pressable style={styles.detailOverlay} onPress={() => setDetailVisible(false)}>
          <Animated.View entering={FadeInDown.delay(50)} style={styles.detailSheet}>
            {detailData && (
              <>
                <ThemedText style={styles.detailTitle}>{detailData.word}</ThemedText>
                {'cefr' in detailData && detailData.cefr ? (
                  <View style={styles.detailBadgesRow}>
                    <View style={styles.cefrBadge}><ThemedText style={styles.cefrText}>{detailData.cefr}</ThemedText></View>
                    {detailData.pos ? (<View style={styles.sourceBadge}><ThemedText style={styles.sourceText}>{detailData.pos}</ThemedText></View>) : null}
                  </View>
                ) : null}
                {detailData.definition ? (
                  <View style={styles.detailBlock}>
                    <ThemedText style={styles.detailLabel}>Meaning</ThemedText>
                    <ThemedText style={styles.detailText}>{detailData.definition}</ThemedText>
                  </View>
                ) : null}
                {'attempts' in detailData && (detailData.attempts ?? 0) > 0 ? (
                  <View style={styles.detailBlock}>
                    <ThemedText style={styles.detailLabel}>Accuracy</ThemedText>
                    <ThemedText style={styles.detailText}>
                      {Math.round(((detailData.correctAttempts ?? 0) / (detailData.attempts ?? 1)) * 100)}% ({detailData.correctAttempts ?? 0}/{detailData.attempts ?? 0})
                    </ThemedText>
                  </View>
                ) : null}
                {'example' in detailData && detailData.example ? (
                  <View style={styles.detailBlock}>
                    <ThemedText style={styles.detailLabel}>Example</ThemedText>
                    <ThemedText style={styles.detailText}>{detailData.example}</ThemedText>
                  </View>
                ) : null}
                {'synonyms' in detailData && detailData.synonyms && detailData.synonyms.length > 0 ? (
                  <View style={styles.detailBlock}>
                    <ThemedText style={styles.detailLabel}>Synonyms</ThemedText>
                    <ThemedText style={styles.detailText}>{detailData.synonyms.join(', ')}</ThemedText>
                  </View>
                ) : null}
                {'antonyms' in detailData && detailData.antonyms && detailData.antonyms.length > 0 ? (
                  <View style={styles.detailBlock}>
                    <ThemedText style={styles.detailLabel}>Antonyms</ThemedText>
                    <ThemedText style={styles.detailText}>{detailData.antonyms.join(', ')}</ThemedText>
                  </View>
                ) : null}
                {detailData.pronunciation ? (
                  <View style={styles.detailBlock}>
                    <ThemedText style={styles.detailLabel}>Pronunciation</ThemedText>
                    <ThemedText style={styles.detailText}>{detailData.pronunciation}</ThemedText>
                  </View>
                ) : null}

                {detailData?.type === 'enriched' ? (
                  <ModernButton
                    title={'attempts' in detailData ? 'Remove Challenging Word' : 'Remove Bookmark'}
                    onPress={async () => {
                      if ('attempts' in detailData) {
                        // challenging（weak）単語としての解除
                        await databaseService.removeEnrichedWeakWord(detailData.word, detailData.cefr);
                        await loadReviewData();
                      } else {
                        await handleRemoveEnrichedBookmark(detailData.word, detailData.cefr);
                      }
                      setDetailVisible(false);
                    }}
                    variant="error"
                    size="md"
                    icon="🗑️"
                    style={styles.detailRemoveButton}
                  />
                ) : (
                  <ModernButton
                    title="Remove Bookmark"
                    onPress={async () => {
                      // legacy の場合はIDが無いので検索
                      const target = bookmarkedWords.find(w => w.word === detailData.word);
                      if (target) {
                        await handleRemoveBookmark(target.id);
                      }
                      setDetailVisible(false);
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
        </Pressable>
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
});