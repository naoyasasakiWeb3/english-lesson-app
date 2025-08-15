import { Spacing } from '@/constants/ModernColors';
import { useAudio } from '@/hooks/useAudio';

import { databaseService } from '@/services/database';
import { enrichedVocabularyService } from '@/services/enrichedVocabularyService';
import { useAppStore } from '@/store/useAppStore';
import { LearningGoals } from '@/types';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  View
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { ThemedText } from './ThemedText';
import ModernCard from './layout/ModernCard';
import ModernButton from './modern/ModernButton';

export default function SettingsForm() {
  const router = useRouter();
  const { userSettings, setUserSettings } = useAppStore();
  const { settings: audioSettings, updateSettings: updateAudioSettings, speakWord } = useAudio();

  const [userLevel, setUserLevel] = useState({ current_level: 'A1', target_level: 'B2' });
  const [levelStats, setLevelStats] = useState<{[level: string]: number}>({});
  const [enrichedVocabStats, setEnrichedVocabStats] = useState<{[level: string]: number}>({});
  const [bookmarkStats, setBookmarkStats] = useState({ legacy: 0, enriched: 0 });
  const [weakWordsStats, setWeakWordsStats] = useState({ legacy: 0, enriched: 0 });

  const { control, handleSubmit } = useForm<LearningGoals>({
    defaultValues: userSettings,
  });

  useEffect(() => {
    loadUserLevel();
    loadLevelStats();
    loadEnrichedVocabStats();
    loadBookmarkAndWeakStats();
  }, []);

  // 設定画面がフォーカスされたときにデータをリフレッシュ
  useFocusEffect(
    useCallback(() => {
      console.log('SettingsForm focused - checking database status');
      if (databaseService.isInitialized()) {
        console.log('Database initialized - refreshing settings data');
        loadUserLevel();
        loadLevelStats();
        loadEnrichedVocabStats();
        loadBookmarkAndWeakStats();
      } else {
        console.log('Database not yet initialized - skipping settings data refresh');
      }
    }, [])
  );

  const loadUserLevel = async () => {
    try {
      const level = await databaseService.getUserCefrLevel();
      setUserLevel(level);
    } catch (error) {
      console.error('Error loading user level:', error);
    }
  };

  const loadLevelStats = async () => {
    try {
      const stats = await databaseService.getCefrLevelStats();
      setLevelStats(stats);
    } catch (error) {
      console.error('Error loading level stats:', error);
    }
  };

  const loadEnrichedVocabStats = async () => {
    try {
      const levels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
      const stats: {[level: string]: number} = {};
      
      for (const level of levels) {
        try {
          const vocabData = await enrichedVocabularyService.getEnrichedVocabulary(level);
          stats[level] = vocabData.metadata.totalWords || 0;
        } catch (error) {
          console.warn(`Failed to load ${level} vocabulary stats:`, error);
          stats[level] = 0;
        }
      }
      
      setEnrichedVocabStats(stats);
    } catch (error) {
      console.error('Error loading enriched vocabulary stats:', error);
    }
  };

  const loadBookmarkAndWeakStats = async () => {
    try {
      // Bookmark統計を取得
      const legacyBookmarked = await databaseService.getBookmarkedWords();
      const enrichedBookmarked = await databaseService.getEnrichedBookmarkedWords();
      
      // Weak Words統計を取得
      const legacyWeak = await databaseService.getWeakWords();
      const enrichedWeak = await databaseService.getEnrichedWeakWords();
      
      setBookmarkStats({
        legacy: legacyBookmarked.length,
        enriched: enrichedBookmarked.length
      });
      
      setWeakWordsStats({
        legacy: legacyWeak.length,
        enriched: enrichedWeak.length
      });
      
      console.log(`Bookmark stats: ${legacyBookmarked.length} legacy, ${enrichedBookmarked.length} enriched`);
      console.log(`Weak words stats: ${legacyWeak.length} legacy, ${enrichedWeak.length} enriched`);
    } catch (error) {
      console.error('Error loading bookmark and weak words stats:', error);
    }
  };

  const onSubmit = (data: LearningGoals) => {
    setUserSettings(data);
    Alert.alert('Success', 'Settings saved successfully!');
  };

  const handleCefrLevelChange = async (currentLevel: string, targetLevel: string) => {
    try {
      await databaseService.updateUserCefrLevel(currentLevel, targetLevel);
      setUserLevel({ current_level: currentLevel, target_level: targetLevel });
      Alert.alert('Success', 'CEFR levels updated successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to update CEFR levels');
    }
  };

  const handleDeleteBookmarks = async () => {
    const totalBookmarks = bookmarkStats.legacy + bookmarkStats.enriched;
    
    Alert.alert(
      'Delete All Bookmarks',
      `Are you sure you want to delete all ${totalBookmarks} bookmarked words? This action cannot be undone.`,
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              // Legacy bookmarksを削除
              if (bookmarkStats.legacy > 0) {
                await databaseService.clearAllBookmarks();
              }
              
              // Enriched bookmarksを削除
              if (bookmarkStats.enriched > 0) {
                await databaseService.clearAllEnrichedBookmarks();
              }
              
              // 統計を更新
              setBookmarkStats({ legacy: 0, enriched: 0 });
              
              Alert.alert('Success', 'All bookmarks have been deleted successfully!');
            } catch (error) {
              console.error('Error deleting bookmarks:', error);
              Alert.alert('Error', 'Failed to delete bookmarks. Please try again.');
            }
          }
        }
      ]
    );
  };

  const handleDeleteWeakWords = async () => {
    const totalWeakWords = weakWordsStats.legacy + weakWordsStats.enriched;
    
    Alert.alert(
      'Clear Weak Words Progress',
      `Are you sure you want to clear progress for all ${totalWeakWords} weak words? This will reset their difficulty status.`,
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              // Legacy weak words progressを削除（mastery_levelをリセット）
              if (weakWordsStats.legacy > 0) {
                await databaseService.clearWeakWordsProgress();
              }
              
              // Enriched weak words progressを削除（is_weak = 0に設定）
              if (weakWordsStats.enriched > 0) {
                await databaseService.clearEnrichedWeakWordsProgress();
              }
              
              // 統計を更新
              setWeakWordsStats({ legacy: 0, enriched: 0 });
              
              Alert.alert('Success', 'Weak words progress has been cleared successfully!');
            } catch (error) {
              console.error('Error clearing weak words progress:', error);
              Alert.alert('Error', 'Failed to clear weak words progress. Please try again.');
            }
          }
        }
      ]
    );
  };



  const studyTimeOptions = [5, 10, 15, 20, 30, 45, 60, 90, 120];
  const wordCountOptions = [5, 10, 15, 20, 25, 30, 40, 50, 75, 100];
  const cefrLevels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
  const speedOptions = [0.5, 0.75, 1.0, 1.25, 1.5];
  const volumeOptions = [0.3, 0.5, 0.7, 1.0];

  const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  return (
    <View style={styles.container}>
      {/* Learning Goals Section */}
      <Animated.View entering={FadeInDown.delay(100)}>
        <ModernCard variant="primary" delay={0}>
          <ThemedText style={styles.sectionTitle}>🎯 Learning Goals</ThemedText>
          
          {/* Daily Study Time */}
          <View style={styles.setting}>
            <ThemedText style={styles.label}>Daily Study Time: {userSettings.dailyStudyTimeMinutes}min</ThemedText>
            <Controller
              control={control}
              name="dailyStudyTimeMinutes"
              render={({ field: { value, onChange } }) => (
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false}
                  style={styles.scrollContainer}
                  contentContainerStyle={styles.scrollContent}
                >
                  {studyTimeOptions.map((time, index) => (
                    <Animated.View key={time} entering={FadeInDown.delay(200 + index * 50)}>
                      <ModernButton
                        title={`${time}min`}
                        onPress={() => onChange(time)}
                        variant={value === time ? 'success' : 'secondary'}
                        size="sm"
                        style={styles.scrollOptionButton}
                      />
                    </Animated.View>
                  ))}
                </ScrollView>
              )}
            />
          </View>

          {/* Daily Word Count */}
          <View style={styles.setting}>
            <ThemedText style={styles.label}>Daily Word Count: {userSettings.dailyWordCount} words</ThemedText>
            <Controller
              control={control}
              name="dailyWordCount"
              render={({ field: { value, onChange } }) => (
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false}
                  style={styles.scrollContainer}
                  contentContainerStyle={styles.scrollContent}
                >
                  {wordCountOptions.map((count, index) => (
                    <Animated.View key={count} entering={FadeInDown.delay(300 + index * 50)}>
                      <ModernButton
                        title={count.toString()}
                        onPress={() => onChange(count)}
                        variant={value === count ? 'success' : 'secondary'}
                        size="sm"
                        style={styles.scrollOptionButton}
                      />
                    </Animated.View>
                  ))}
                </ScrollView>
              )}
            />
          </View>

        </ModernCard>
      </Animated.View>

      {/* CEFR Level Section */}
      <Animated.View entering={FadeInDown.delay(150)}>
        <ModernCard variant="secondary" delay={0}>
          <ThemedText style={styles.sectionTitle}>📚 CEFR Level</ThemedText>
          
          <View style={styles.setting}>
            <ThemedText style={styles.label}>Current Level: {userLevel.current_level}</ThemedText>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={styles.scrollContainer}
              contentContainerStyle={styles.scrollContent}
            >
              {cefrLevels.map((level, index) => (
                <Animated.View key={level} entering={FadeInDown.delay(400 + index * 100)}>
                  <ModernButton
                    title={level}
                    onPress={() => handleCefrLevelChange(level, level)}
                    variant={userLevel.current_level === level ? 'primary' : 'secondary'}
                    size="md"
                    style={styles.scrollOptionButton}
                  />
                </Animated.View>
              ))}
            </ScrollView>
          </View>
        </ModernCard>
      </Animated.View>

      {/* Schedule Section */}
      <Animated.View entering={FadeInDown.delay(200)}>
        <ModernCard variant="secondary" delay={0}>
          <ThemedText style={styles.sectionTitle}>📅 Schedule</ThemedText>
          
          {/* Learning Days */}
          <View style={styles.setting}>
            <ThemedText style={styles.label}>Learning Days</ThemedText>
            <Controller
              control={control}
              name="learningDays"
              render={({ field: { value, onChange } }) => (
                <View style={styles.dayContainer}>
                  {dayNames.map((day, index) => (
                    <Animated.View key={day} entering={FadeInDown.delay(500 + index * 100)}>
                      <ModernCard variant="glass" style={styles.dayCard}>
                        <View style={styles.dayRow}>
                          <ThemedText style={styles.dayLabel}>{day}</ThemedText>
                          <Switch
                            value={value[index]}
                            onValueChange={(enabled) => {
                              const newDays = [...value];
                              newDays[index] = enabled;
                              onChange(newDays);
                            }}
                            trackColor={{ false: 'rgba(255,255,255,0.3)', true: 'rgba(16,185,129,0.8)' }}
                            thumbColor={value[index] ? '#ffffff' : 'rgba(255,255,255,0.8)'}
                          />
                        </View>
                      </ModernCard>
                    </Animated.View>
                  ))}
                </View>
              )}
            />
          </View>

          {/* Reminder Time */}
          <View style={styles.setting}>
            <ThemedText style={styles.label}>Daily Reminder</ThemedText>
            <Controller
              control={control}
              name="reminderTime"
              render={({ field: { value } }) => (
                <ModernButton
                  title={value || 'Set Reminder Time'}
                  onPress={() => Alert.alert('Time Picker', 'Time picker functionality would be implemented here')}
                  variant="warning"
                  size="md"
                  icon="⏰"
                  style={styles.timeButton}
                />
              )}
            />
          </View>
        </ModernCard>
      </Animated.View>

      {/* Audio Settings Section */}
      <Animated.View entering={FadeInDown.delay(300)}>
        <ModernCard variant="warning" delay={0}>
          <ThemedText style={styles.sectionTitle}>🔊 Audio Settings</ThemedText>
          
          {/* Accent Selection */}
          <View style={styles.setting}>
            <ThemedText style={styles.label}>Accent</ThemedText>
            <View style={styles.accentContainer}>
              {[
                { value: 'us' as const, label: 'American English', flag: '🇺🇸' },
                { value: 'uk' as const, label: 'British English', flag: '🇬🇧' }
              ].map((accent, index) => (
                <Animated.View key={accent.value} entering={FadeInDown.delay(600 + index * 100)}>
                  <ModernButton
                    title={`${accent.flag} ${accent.label}`}
                    onPress={() => updateAudioSettings({ accent: accent.value })}
                    variant={audioSettings.accent === accent.value ? 'success' : 'secondary'}
                    size="md"
                    style={styles.accentButton}
                  />
                </Animated.View>
              ))}
            </View>
          </View>

          {/* Speech Speed */}
          <View style={styles.setting}>
            <ThemedText style={styles.label}>Speech Speed: {audioSettings.speed}x</ThemedText>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={styles.scrollContainer}
              contentContainerStyle={styles.scrollContent}
            >
              {speedOptions.map((speed, index) => (
                <Animated.View key={speed} entering={FadeInDown.delay(700 + index * 50)}>
                  <ModernButton
                    title={`${speed}x`}
                    onPress={async () => {
                      await updateAudioSettings({ speed });
                      await speakWord('Beautiful', { speed });
                    }}
                    variant={audioSettings.speed === speed ? 'primary' : 'secondary'}
                    size="sm"
                    style={styles.scrollOptionButton}
                  />
                </Animated.View>
              ))}
            </ScrollView>
          </View>

          {/* Auto-play Setting */}
          <View style={styles.setting}>
            <ModernCard variant="glass" style={styles.switchCard}>
              <View style={styles.switchRow}>
                <View>
                  <ThemedText style={styles.switchLabel}>Auto-play Pronunciation</ThemedText>
                  <ThemedText style={styles.switchDescription}>
                    Automatically play word pronunciation when showing new questions
                  </ThemedText>
                </View>
                <Switch
                  value={audioSettings.autoPlay}
                  onValueChange={(value) => updateAudioSettings({ autoPlay: value })}
                  trackColor={{ false: 'rgba(255,255,255,0.3)', true: 'rgba(16,185,129,0.8)' }}
                  thumbColor={audioSettings.autoPlay ? '#ffffff' : 'rgba(255,255,255,0.8)'}
                />
              </View>
            </ModernCard>
          </View>

          {/* Volume Setting */}
          <View style={styles.setting}>
            <ThemedText style={styles.label}>Volume: {Math.round(audioSettings.volume * 100)}%</ThemedText>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={styles.scrollContainer}
              contentContainerStyle={styles.scrollContent}
            >
              {volumeOptions.map((volume, index) => (
                <Animated.View key={volume} entering={FadeInDown.delay(800 + index * 50)}>
                  <ModernButton
                    title={`${Math.round(volume * 100)}%`}
                    onPress={() => updateAudioSettings({ volume })}
                    variant={audioSettings.volume === volume ? 'error' : 'secondary'}
                    size="sm"
                    style={styles.scrollOptionButton}
                  />
                </Animated.View>
              ))}
            </ScrollView>
          </View>

          {/* Test Audio */}
          <Animated.View entering={FadeInDown.delay(900)}>
            <ModernButton
              title="Test Audio Settings"
              onPress={() => speakWord('Hello, this is a pronunciation test')}
              variant="secondary"
              size="lg"
              icon="🔊"
              style={styles.testAudioButton}
            />
          </Animated.View>
        </ModernCard>
      </Animated.View>

      {/* CEFR Vocabulary Statistics */}
      <Animated.View entering={FadeInDown.delay(400)}>
        <ModernCard variant="warning" delay={0}>
          <ThemedText style={styles.sectionTitle}>📊 CEFR Vocabulary Stats</ThemedText>
          
          <View style={styles.setting}>
            <ThemedText style={styles.label}>Available Enriched Vocabulary</ThemedText>
            <View style={styles.levelContainer}>
              {Object.entries(enrichedVocabStats).map(([level, count]) => (
                <Animated.View key={level} entering={FadeInDown.delay(500 + parseInt(level.charAt(1)) * 50)}>
                  <View style={styles.levelRow}>
                    <View style={styles.levelInfo}>
                      <ThemedText style={styles.levelText}>{level}</ThemedText>
                      <ThemedText style={styles.levelCount}>{count.toLocaleString()} words</ThemedText>
                    </View>
                    <View style={[styles.levelIndicator, { backgroundColor: count > 0 ? '#10b981' : '#ef4444' }]} />
                  </View>
                </Animated.View>
              ))}
            </View>
            
            {Object.values(enrichedVocabStats).length > 0 && (
              <View style={styles.totalContainer}>
                <ThemedText style={styles.totalText}>
                  Total: {Object.values(enrichedVocabStats).reduce((sum, count) => sum + count, 0).toLocaleString()} words
                </ThemedText>
              </View>
            )}
          </View>
        </ModernCard>
      </Animated.View>

      {/* Data Management Section */}
      <Animated.View entering={FadeInDown.delay(450)}>
        <ModernCard variant="error" delay={0}>
          <ThemedText style={styles.sectionTitle}>🗑️ Data Management</ThemedText>
          
          {/* Bookmark Management */}
          <View style={styles.setting}>
            <ThemedText style={styles.label}>Bookmarked Words</ThemedText>
            <View style={styles.dataStatsContainer}>
              <View style={styles.dataStatsRow}>
                <ThemedText style={styles.dataStatsText}>
                  Legacy: {bookmarkStats.legacy} words
                </ThemedText>
                <ThemedText style={styles.dataStatsText}>
                  Enriched: {bookmarkStats.enriched} words
                </ThemedText>
              </View>
              <View style={styles.dataStatsTotal}>
                <ThemedText style={styles.dataStatsTotalText}>
                  Total: {bookmarkStats.legacy + bookmarkStats.enriched} words
                </ThemedText>
              </View>
            </View>
            
            <Animated.View entering={FadeInDown.delay(600)}>
              <ModernButton
                title="Delete All Bookmarks"
                onPress={handleDeleteBookmarks}
                variant="error"
                size="md"
                icon="🗑️"
                style={styles.deleteButton}
                disabled={bookmarkStats.legacy + bookmarkStats.enriched === 0}
              />
            </Animated.View>
          </View>

          {/* Weak Words Management */}
          <View style={styles.setting}>
            <ThemedText style={styles.label}>Challenging Words</ThemedText>
            <View style={styles.dataStatsContainer}>
              <View style={styles.dataStatsRow}>
                <ThemedText style={styles.dataStatsText}>
                  Legacy: {weakWordsStats.legacy} words
                </ThemedText>
                <ThemedText style={styles.dataStatsText}>
                  Enriched: {weakWordsStats.enriched} words
                </ThemedText>
              </View>
              <View style={styles.dataStatsTotal}>
                <ThemedText style={styles.dataStatsTotalText}>
                  Total: {weakWordsStats.legacy + weakWordsStats.enriched} words
                </ThemedText>
              </View>
            </View>
            
            <Animated.View entering={FadeInDown.delay(650)}>
              <ModernButton
                title="Clear Weak Words Progress"
                onPress={handleDeleteWeakWords}
                variant="error"
                size="md"
                icon="🧹"
                style={styles.deleteButton}
                disabled={weakWordsStats.legacy + weakWordsStats.enriched === 0}
              />
            </Animated.View>
          </View>
        </ModernCard>
      </Animated.View>



      {/* Save Button */}
      <Animated.View entering={FadeInDown.delay(400)}>
        <ModernButton
          title="Save Settings"
          onPress={handleSubmit(onSubmit)}
          variant="success"
          size="lg"
          icon="💾"
          style={styles.saveButton}
        />
      </Animated.View>


    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: Spacing.lg,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: Spacing.lg,
    textAlign: 'center',
  },
  setting: {
    marginBottom: Spacing.lg,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: Spacing.sm,
    color: '#ffffff',
  },
  optionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  optionButton: {
    minWidth: 60,
  },
  // Scroll container styles
  scrollContainer: {
    maxHeight: 60,
  },
  scrollContent: {
    gap: Spacing.xs,
    paddingHorizontal: Spacing.xs,
  },
  scrollOptionButton: {
    minWidth: 80,
    marginRight: Spacing.xs,
  },
  cefrContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  cefrButton: {
    minWidth: 60,
  },
  dayContainer: {
    gap: Spacing.xs,
  },
  dayCard: {
    marginVertical: 0,
    paddingVertical: Spacing.sm,
  },
  dayRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dayLabel: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '500',
  },
  timeButton: {
    width: '100%',
  },
  accentContainer: {
    gap: Spacing.sm,
  },
  accentButton: {
    width: '100%',
  },
  speedContainer: {
    flexDirection: 'row',
    gap: Spacing.xs,
    flexWrap: 'wrap',
  },
  speedButton: {
    minWidth: 60,
  },
  switchCard: {
    marginVertical: 0,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.md,
  },
  switchLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 4,
  },
  switchDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 18,
    flex: 1,
  },
  volumeContainer: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  volumeButton: {
    minWidth: 60,
  },
  testAudioButton: {
    width: '100%',
  },
  saveButton: {
    width: '100%',
  },
  // CEFR Level styles
  levelContainer: {
    marginBottom: Spacing.md,
    gap: Spacing.xs,
  },
  levelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    marginBottom: 4,
  },
  levelText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  levelCount: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    fontWeight: '400',
  },
  levelInfo: {
    flex: 1,
  },
  levelIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  totalContainer: {
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
  },
  totalText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
  },
  levelButton: {
    width: '100%',
  },
  // Data Management styles
  dataStatsContainer: {
    marginBottom: Spacing.md,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
  },
  dataStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  dataStatsText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 14,
    fontWeight: '500',
  },
  dataStatsTotal: {
    paddingTop: Spacing.xs,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
  },
  dataStatsTotalText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  deleteButton: {
    width: '100%',
  },

});