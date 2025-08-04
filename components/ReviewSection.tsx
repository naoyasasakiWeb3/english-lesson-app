import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  TouchableOpacity, 
  View, 
  ScrollView,
  Alert 
} from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';
import { useAppStore } from '@/store/useAppStore';
import { databaseService } from '@/services/database';
import { Word } from '@/types';

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
      await loadReviewData(); // Refresh the data
      Alert.alert('Success', 'Bookmark removed');
    } catch (error) {
      Alert.alert('Error', 'Failed to remove bookmark');
    }
  };

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText>Loading review data...</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Bookmarked Words Section */}
      <ThemedView style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleContainer}>
            <ThemedText style={styles.sectionEmoji}>⭐</ThemedText>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
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
            >
              {bookmarkedWords.slice(0, 10).map((word) => (
                <TouchableOpacity
                  key={word.id}
                  style={styles.wordCard}
                  onLongPress={() => handleRemoveBookmark(word.id)}
                >
                  <ThemedText style={styles.wordText}>{word.word}</ThemedText>
                  <ThemedText style={styles.definitionText} numberOfLines={2}>
                    {word.definition}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TouchableOpacity
              style={[styles.reviewButton, { backgroundColor: '#9C27B0' }]}
              onPress={() => handleStartReview('bookmarked')}
            >
              <ThemedText style={styles.reviewButtonText}>
                Review Bookmarked Words
              </ThemedText>
            </TouchableOpacity>
          </>
        ) : (
          <View style={styles.emptyState}>
            <ThemedText style={styles.emptyStateText}>
              No bookmarked words yet
            </ThemedText>
            <ThemedText style={styles.emptyStateSubtext}>
              Bookmark words during quizzes to review them later
            </ThemedText>
          </View>
        )}
      </ThemedView>

      {/* Weak Words Section */}
      <ThemedView style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleContainer}>
            <ThemedText style={styles.sectionEmoji}>🔥</ThemedText>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
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
            >
              {weakWords.slice(0, 10).map((word) => (
                <TouchableOpacity
                  key={word.id}
                  style={[styles.wordCard, styles.weakWordCard]}
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
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TouchableOpacity
              style={[styles.reviewButton, { backgroundColor: '#F44336' }]}
              onPress={() => handleStartReview('weak')}
            >
              <ThemedText style={styles.reviewButtonText}>
                Practice Challenging Words
              </ThemedText>
            </TouchableOpacity>
          </>
        ) : (
          <View style={styles.emptyState}>
            <ThemedText style={styles.emptyStateText}>
              No challenging words identified yet
            </ThemedText>
            <ThemedText style={styles.emptyStateSubtext}>
              Keep practicing to identify words that need more work
            </ThemedText>
          </View>
        )}
      </ThemedView>

      {/* Quick Actions */}
      <ThemedView style={styles.section}>
        <ThemedText type="subtitle" style={styles.sectionTitle}>
          Quick Review Options
        </ThemedText>
        
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.quickActionButton}
            onPress={() => router.push('/quiz')}
          >
            <ThemedText style={styles.quickActionEmoji}>🎯</ThemedText>
            <ThemedText style={styles.quickActionText}>Start New Quiz</ThemedText>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.quickActionButton}
            onPress={loadReviewData}
          >
            <ThemedText style={styles.quickActionEmoji}>🔄</ThemedText>
            <ThemedText style={styles.quickActionText}>Refresh Data</ThemedText>
          </TouchableOpacity>
        </View>
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  section: {
    marginBottom: 25,
    padding: 20,
    borderRadius: 12,
    backgroundColor: '#f8f9fa',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionEmoji: {
    fontSize: 24,
    marginRight: 8,
  },
  sectionTitle: {
    fontSize: 18,
  },
  wordCount: {
    fontSize: 14,
    opacity: 0.7,
    fontWeight: '600',
  },
  wordsScroll: {
    marginBottom: 20,
  },
  wordCard: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 16,
    marginRight: 12,
    width: 150,
    minHeight: 120,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  weakWordCard: {
    borderLeftWidth: 3,
    borderLeftColor: '#F44336',
  },
  wordText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  definitionText: {
    fontSize: 14,
    opacity: 0.8,
    lineHeight: 18,
    flex: 1,
  },
  difficultyBadge: {
    backgroundColor: '#F44336',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  difficultyText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '600',
  },
  reviewButton: {
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  reviewButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    opacity: 0.7,
  },
  emptyStateSubtext: {
    fontSize: 14,
    textAlign: 'center',
    opacity: 0.5,
    lineHeight: 20,
  },
  quickActions: {
    flexDirection: 'row',
    gap: 12,
  },
  quickActionButton: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  quickActionEmoji: {
    fontSize: 24,
    marginBottom: 8,
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
});