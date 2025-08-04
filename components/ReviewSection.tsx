import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  ScrollView,
  Alert 
} from 'react-native';
import Animated, { FadeInDown, FadeInLeft, FadeInRight } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { ThemedText } from './ThemedText';
import ModernCard from './layout/ModernCard';
import ModernButton from './modern/ModernButton';
import { useAppStore } from '@/store/useAppStore';
import { databaseService } from '@/services/database';
import { Word } from '@/types';
import { Spacing } from '@/constants/ModernColors';

export default function ReviewSection() {
  const router = useRouter();
  const { startQuiz } = useAppStore();
  const [bookmarkedWords, setBookmarkedWords] = useState<Word[]>([]);
  const [weakWords, setWeakWords] = useState<Word[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReviewData();
  }, []);

  const loadReviewData = async () => {
    try {
      setLoading(true);
      const [bookmarked, weak] = await Promise.all([
        databaseService.getBookmarkedWords(),
        databaseService.getWeakWords()
      ]);
      setBookmarkedWords(bookmarked);
      setWeakWords(weak);
    } catch (error) {
      console.error('Error loading review data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartReview = async (mode: 'bookmarked' | 'weak') => {
    try {
      const wordCount = mode === 'bookmarked' ? bookmarkedWords.length : weakWords.length;
      if (wordCount === 0) {
        Alert.alert(
          'No Words Available',
          mode === 'bookmarked' 
            ? 'You haven\'t bookmarked any words yet. Complete some quizzes first!'
            : 'No weak words found. Keep practicing to identify challenging words!'
        );
        return;
      }
      
      await startQuiz(mode, Math.min(wordCount, 20));
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
              {bookmarkedWords.length} words
            </ThemedText>
          </View>

          {bookmarkedWords.length > 0 ? (
            <>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                style={styles.wordsScroll}
                contentContainerStyle={styles.wordsScrollContent}
              >
                {bookmarkedWords.slice(0, 10).map((word, index) => (
                  <Animated.View
                    key={word.id}
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
              {weakWords.length} words
            </ThemedText>
          </View>

          {weakWords.length > 0 ? (
            <>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                style={styles.wordsScroll}
                contentContainerStyle={styles.wordsScrollContent}
              >
                {weakWords.slice(0, 10).map((word, index) => (
                  <Animated.View
                    key={word.id}
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
        <ModernCard variant="primary" delay={0}>
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
              variant="neutral"
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
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  quickActionButton: {
    flex: 1,
  },
});