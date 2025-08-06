import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  Alert,
  RefreshControl,
} from 'react-native';
import Animated, { 
  FadeInDown, 
  FadeInLeft, 
  FadeInUp 
} from 'react-native-reanimated';
import { ThemedText } from './ThemedText';
import ModernCard from './layout/ModernCard';
import ModernButton from './modern/ModernButton';
import ModernTextInput from './modern/ModernTextInput';
import { databaseService } from '../services/database';
import { wordsApiService } from '../services/wordsApi';
import { useWordsApiKey } from '../hooks/useWordsApi';
import { Spacing, BorderRadius } from '../constants/ModernColors';

interface SavedWord {
  id: number;
  word: string;
  pos?: string;
  cefr_level: string;
  definition?: string;
  pronunciation?: string;
  example_sentence?: string;
  synonyms?: string;
  antonyms?: string;
  difficulty_score?: number;
  frequency_score?: number;
}

export default function SavedWordsScreen() {
  const { status: apiStatus } = useWordsApiKey();
  const [savedWords, setSavedWords] = useState<SavedWord[]>([]);
  const [filteredWords, setFilteredWords] = useState<SavedWord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLevel, setSelectedLevel] = useState<string>('all');
  const [enrichingWords, setEnrichingWords] = useState(false);

  const CEFR_LEVELS = ['all', 'A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

  useEffect(() => {
    loadSavedWords();
  }, []);

  useEffect(() => {
    filterWords();
  }, [savedWords, searchQuery, selectedLevel]);

  const loadSavedWords = async () => {
    try {
      setLoading(true);
      
      // Get all CEFR words that have additional data from API
      const allCefrWords = await databaseService.getAllCefrWords();
      
      // Filter words that have API enriched data
      const wordsWithDetails: SavedWord[] = [];
      
      for (const word of allCefrWords) {
        const details = await databaseService.getCefrWordById(word.id);
        if (details && (details.definition || details.pronunciation || details.example_sentence)) {
          wordsWithDetails.push(details);
        }
      }
      
      setSavedWords(wordsWithDetails);
    } catch (error) {
      console.error('Error loading saved words:', error);
      Alert.alert('Error', 'Failed to load saved words');
    } finally {
      setLoading(false);
    }
  };

  const filterWords = () => {
    let filtered = savedWords;

    // Filter by search query
    if (searchQuery.trim()) {
      filtered = filtered.filter(word =>
        word.word.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (word.definition && word.definition.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Filter by CEFR level
    if (selectedLevel !== 'all') {
      filtered = filtered.filter(word => word.cefr_level === selectedLevel);
    }

    setFilteredWords(filtered);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadSavedWords();
    setRefreshing(false);
  };

  const enrichAllWords = async () => {
    if (!apiStatus.configured) {
      Alert.alert(
        'API Key Required',
        'You need to configure your Words API key to enrich word data.',
        [
          { text: 'OK', style: 'cancel' }
        ]
      );
      return;
    }

    Alert.alert(
      'Enrich All Words',
      'This will fetch detailed information for all CEFR words using your API quota. This may take several minutes. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Continue', onPress: performEnrichment }
      ]
    );
  };

  const performEnrichment = async () => {
    try {
      setEnrichingWords(true);
      
      // Get words without details
      const allCefrWords = await databaseService.getAllCefrWords();
      const wordsToEnrich = [];
      
      for (const word of allCefrWords) {
        const details = await databaseService.getCefrWordById(word.id);
        if (!details || (!details.definition && !details.pronunciation)) {
          wordsToEnrich.push(word);
        }
      }

      if (wordsToEnrich.length === 0) {
        Alert.alert('Info', 'All words already have detailed information.');
        return;
      }

      let enrichedCount = 0;
      const batchSize = 10;
      
      for (let i = 0; i < wordsToEnrich.length; i += batchSize) {
        const batch = wordsToEnrich.slice(i, i + batchSize);
        
        const enrichPromises = batch.map(async (word) => {
          try {
            const enrichedData = await wordsApiService.enrichWordData(word.word);
            
            if (enrichedData.definition) {
              await databaseService.addWordDetails(word.id, enrichedData);
              enrichedCount++;
            }
          } catch (error) {
            console.warn(`Failed to enrich word ${word.word}:`, error);
          }
        });
        
        await Promise.all(enrichPromises);
        
        // Add delay between batches to respect API limits
        if (i + batchSize < wordsToEnrich.length) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
      
      Alert.alert(
        'Enrichment Complete',
        `Successfully enriched ${enrichedCount} words with detailed information.`
      );
      
      // Reload the saved words
      await loadSavedWords();
      
    } catch (error) {
      console.error('Error enriching words:', error);
      Alert.alert('Error', 'Failed to enrich words. Please try again.');
    } finally {
      setEnrichingWords(false);
    }
  };

  const clearWordData = async (wordId: number) => {
    try {
      // This would ideally remove the word details but keep the base word
      Alert.alert(
        'Clear Word Data',
        'Are you sure you want to clear the API data for this word?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Clear', style: 'destructive', onPress: async () => {
            // Implementation would depend on having a method to clear word details
            Alert.alert('Info', 'Clear functionality would be implemented here');
          }}
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to clear word data');
    }
  };

  const parseSynonymsAntonyms = (jsonString?: string): string[] => {
    if (!jsonString) return [];
    try {
      return JSON.parse(jsonString);
    } catch {
      return [];
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Animated.View entering={FadeInUp.delay(200)} style={styles.loadingContainer}>
          <ModernCard variant="primary" pressable={false} delay={0}>
            <ThemedText style={styles.loadingText}>Loading saved words...</ThemedText>
          </ModernCard>
        </Animated.View>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          tintColor="#ffffff"
        />
      }
    >
      {/* Header */}
      <Animated.View entering={FadeInUp.delay(200)}>
        <ModernCard variant="primary" pressable={false} delay={0}>
          <View style={styles.header}>
            <ThemedText style={styles.title}>📚 Saved Words</ThemedText>
            <ThemedText style={styles.subtitle}>
              Words enriched with API data ({savedWords.length} total)
            </ThemedText>
          </View>
        </ModernCard>
      </Animated.View>

      {/* Search and Filters */}
      <Animated.View entering={FadeInDown.delay(300)}>
        <ModernCard variant="secondary" pressable={false} delay={0}>
          <ThemedText style={styles.sectionTitle}>🔍 Search & Filter</ThemedText>
          
          <ModernTextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search words or definitions..."
            leftIcon="🔍"
            style={styles.searchInput}
          />
          
          <View style={styles.filterContainer}>
            <ThemedText style={styles.filterLabel}>CEFR Level:</ThemedText>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.levelFilters}>
                {CEFR_LEVELS.map((level) => (
                  <ModernButton
                    key={level}
                    title={level === 'all' ? 'All' : level}
                    onPress={() => setSelectedLevel(level)}
                    variant={selectedLevel === level ? 'success' : 'neutral'}
                    size="sm"
                    style={styles.levelFilterButton}
                  />
                ))}
              </View>
            </ScrollView>
          </View>
        </ModernCard>
      </Animated.View>

      {/* Actions */}
      <Animated.View entering={FadeInDown.delay(400)}>
        <ModernCard variant="warning" pressable={false} delay={0}>
          <ThemedText style={styles.sectionTitle}>⚡ Actions</ThemedText>
          
          <View style={styles.actionsContainer}>
            <ModernButton
              title={enrichingWords ? 'Enriching...' : 'Enrich All Words'}
              onPress={enrichAllWords}
              variant="primary"
              size="md"
              icon="✨"
              loading={enrichingWords}
              disabled={enrichingWords}
              style={styles.actionButton}
            />
            
            <ModernButton
              title="Refresh"
              onPress={handleRefresh}
              variant="neutral"
              size="md"
              icon="🔄"
              style={styles.actionButton}
            />
          </View>
          
          {!apiStatus.configured && (
            <View style={styles.warningContainer}>
              <ThemedText style={styles.warningText}>
                ⚠️ API key not configured. Set up your Words API key in Settings to enrich more words.
              </ThemedText>
            </View>
          )}
        </ModernCard>
      </Animated.View>

      {/* Words List */}
      <View style={styles.wordsContainer}>
        {filteredWords.length === 0 ? (
          <Animated.View entering={FadeInDown.delay(500)}>
            <ModernCard variant="neutral" pressable={false} delay={0}>
              <View style={styles.emptyState}>
                <ThemedText style={styles.emptyStateEmoji}>📭</ThemedText>
                <ThemedText style={styles.emptyStateTitle}>No saved words found</ThemedText>
                <ThemedText style={styles.emptyStateDescription}>
                  {savedWords.length === 0
                    ? 'Take some quizzes with API configured to see words here'
                    : 'Try adjusting your search or filter criteria'
                  }
                </ThemedText>
              </View>
            </ModernCard>
          </Animated.View>
        ) : (
          filteredWords.map((word, index) => (
            <Animated.View
              key={word.id}
              entering={FadeInLeft.delay(600 + index * 100)}
            >
              <ModernCard variant="glass" pressable={false} glassEffect delay={0}>
                <View style={styles.wordCard}>
                  <View style={styles.wordHeader}>
                    <View style={styles.wordTitleContainer}>
                      <ThemedText style={styles.wordText}>{word.word}</ThemedText>
                      <View style={styles.wordMeta}>
                        <ThemedText style={styles.levelBadge}>
                          {word.cefr_level}
                        </ThemedText>
                        {word.pos && (
                          <ThemedText style={styles.posBadge}>
                            {word.pos}
                          </ThemedText>
                        )}
                      </View>
                    </View>
                    {word.pronunciation && (
                      <ThemedText style={styles.pronunciation}>
                        /{word.pronunciation}/
                      </ThemedText>
                    )}
                  </View>

                  {word.definition && (
                    <View style={styles.definitionContainer}>
                      <ThemedText style={styles.definitionText}>
                        {word.definition}
                      </ThemedText>
                    </View>
                  )}

                  {word.example_sentence && (
                    <View style={styles.exampleContainer}>
                      <ThemedText style={styles.exampleLabel}>Example:</ThemedText>
                      <ThemedText style={styles.exampleText}>
                        "{word.example_sentence}"
                      </ThemedText>
                    </View>
                  )}

                  {(parseSynonymsAntonyms(word.synonyms).length > 0 || 
                    parseSynonymsAntonyms(word.antonyms).length > 0) && (
                    <View style={styles.relatedWordsContainer}>
                      {parseSynonymsAntonyms(word.synonyms).length > 0 && (
                        <View style={styles.synonymsContainer}>
                          <ThemedText style={styles.relatedLabel}>Synonyms:</ThemedText>
                          <View style={styles.relatedWordsRow}>
                            {parseSynonymsAntonyms(word.synonyms).slice(0, 3).map((synonym, idx) => (
                              <View key={idx} style={styles.relatedWordTag}>
                                <ThemedText style={styles.relatedWordText}>
                                  {synonym}
                                </ThemedText>
                              </View>
                            ))}
                          </View>
                        </View>
                      )}

                      {parseSynonymsAntonyms(word.antonyms).length > 0 && (
                        <View style={styles.antonymsContainer}>
                          <ThemedText style={styles.relatedLabel}>Antonyms:</ThemedText>
                          <View style={styles.relatedWordsRow}>
                            {parseSynonymsAntonyms(word.antonyms).slice(0, 3).map((antonym, idx) => (
                              <View key={idx} style={styles.relatedWordTag}>
                                <ThemedText style={styles.relatedWordText}>
                                  {antonym}
                                </ThemedText>
                              </View>
                            ))}
                          </View>
                        </View>
                      )}
                    </View>
                  )}

                  {(word.difficulty_score || word.frequency_score) && (
                    <View style={styles.scoresContainer}>
                      {word.difficulty_score && (
                        <ThemedText style={styles.scoreText}>
                          Difficulty: {word.difficulty_score.toFixed(1)}/10
                        </ThemedText>
                      )}
                      {word.frequency_score && (
                        <ThemedText style={styles.scoreText}>
                          Frequency: {word.frequency_score.toFixed(1)}
                        </ThemedText>
                      )}
                    </View>
                  )}
                </View>
              </ModernCard>
            </Animated.View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a0b2e',
  },
  contentContainer: {
    flexGrow: 1,
    padding: Spacing.lg,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '500',
    textAlign: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    fontWeight: '500',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: Spacing.md,
  },
  searchInput: {
    marginBottom: Spacing.md,
  },
  filterContainer: {
    marginBottom: Spacing.sm,
  },
  filterLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: Spacing.xs,
    fontWeight: '600',
  },
  levelFilters: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  levelFilterButton: {
    minWidth: 60,
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  actionButton: {
    flex: 1,
  },
  warningContainer: {
    backgroundColor: 'rgba(255, 193, 7, 0.2)',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 193, 7, 0.3)',
  },
  warningText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    fontWeight: '500',
  },
  wordsContainer: {
    gap: Spacing.md,
    marginTop: Spacing.md,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  emptyStateEmoji: {
    fontSize: 48,
    marginBottom: Spacing.md,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: Spacing.xs,
    textAlign: 'center',
  },
  emptyStateDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
    lineHeight: 20,
    fontWeight: '400',
  },
  wordCard: {
    gap: Spacing.sm,
  },
  wordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  wordTitleContainer: {
    flex: 1,
  },
  wordText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: Spacing.xs,
  },
  wordMeta: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  levelBadge: {
    backgroundColor: 'rgba(74, 144, 226, 0.3)',
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
    paddingHorizontal: Spacing.xs,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
    overflow: 'hidden',
  },
  posBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
    paddingHorizontal: Spacing.xs,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
    overflow: 'hidden',
  },
  pronunciation: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    fontStyle: 'italic',
    fontWeight: '500',
  },
  definitionContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: Spacing.sm,
    borderRadius: BorderRadius.sm,
  },
  definitionText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 20,
    fontWeight: '400',
  },
  exampleContainer: {
    borderLeftWidth: 3,
    borderLeftColor: 'rgba(46, 204, 113, 0.6)',
    paddingLeft: Spacing.sm,
  },
  exampleLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    fontWeight: '600',
    marginBottom: 2,
  },
  exampleText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 18,
    fontStyle: 'italic',
    fontWeight: '400',
  },
  relatedWordsContainer: {
    gap: Spacing.sm,
  },
  synonymsContainer: {
    gap: Spacing.xs,
  },
  antonymsContainer: {
    gap: Spacing.xs,
  },
  relatedLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    fontWeight: '600',
  },
  relatedWordsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  relatedWordTag: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  relatedWordText: {
    fontSize: 12,
    color: '#ffffff',
    fontWeight: '500',
  },
  scoresContainer: {
    flexDirection: 'row',
    gap: Spacing.md,
    paddingTop: Spacing.xs,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
  },
  scoreText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '500',
  },
});