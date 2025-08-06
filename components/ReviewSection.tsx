import { Spacing } from '@/constants/ModernColors';
import { databaseService } from '@/services/database';
import { useAppStore } from '@/store/useAppStore';
import { Word } from '@/types';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
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

  useEffect(() => {
    loadReviewData();
  }, []);

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
      setEnrichedWeakWords(enrichedWeak);
      
      console.log(`Loaded review data: ${bookmarked.length} legacy bookmarked, ${enrichedBookmarked.length} enriched bookmarked, ${weak.length} legacy weak, ${enrichedWeak.length} enriched weak`);
    } catch (error) {
      console.error('Error loading review data:', error);
    } finally {
      setLoading(false);
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
    } catch (error) {
      Alert.alert('Error', 'Failed to start review. Please try again.');
    }
  };

  const handleRemoveBookmark = async (wordId: number) => {
    try {
      await databaseService.toggleBookmark(wordId);
      await loadReviewData();
      Alert.alert('Success', 'Bookmark removed');
    } catch (error) {
      Alert.alert('Error', 'Failed to remove bookmark');
    }
  };

  const handleRemoveEnrichedBookmark = async (word: string, cefrLevel: string) => {
    try {
      await databaseService.removeEnrichedBookmark(word, cefrLevel);
      await loadReviewData();
      Alert.alert('Success', 'Enriched bookmark removed');
    } catch (error) {
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
                      onPress={() => handleRemoveBookmark(word.id)}
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
                      onPress={() => handleRemoveEnrichedBookmark(word.word, word.cefr_level)}
                      style={styles.wordCard}
                      glassEffect={true}
                    >
                      <ThemedText style={styles.wordText}>{word.word}</ThemedText>
                      <ThemedText style={styles.definitionText} numberOfLines={2}>
                        {word.cefr_level} level word
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
                      style={styles.wordCard}
                      glassEffect={true}
                    >
                      <ThemedText style={styles.wordText}>{word.word}</ThemedText>
                      <ThemedText style={styles.definitionText} numberOfLines={2}>
                        {word.mastery_level}% mastery ({word.correct_attempts}/{word.attempts})
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
});