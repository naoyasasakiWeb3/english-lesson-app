import { Spacing } from '@/constants/ModernColors';
import { useAudio } from '@/hooks/useAudio';
import { useWordsApiKey } from '@/hooks/useWordsApi';
import { databaseService } from '@/services/database';
import { useAppStore } from '@/store/useAppStore';
import { DifficultyLevel, LearningGoals } from '@/types';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
    Alert,
    StyleSheet,
    Switch,
    View
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import ApiKeyModal from './ApiKeyModal';
import { ThemedText } from './ThemedText';
import ModernCard from './layout/ModernCard';
import ModernButton from './modern/ModernButton';

export default function SettingsForm() {
  const router = useRouter();
  const { userSettings, setUserSettings } = useAppStore();
  const { settings: audioSettings, updateSettings: updateAudioSettings, speakWord } = useAudio();
  const { status: apiStatus } = useWordsApiKey();
  
  const [showApiModal, setShowApiModal] = useState(false);
  const [userLevel, setUserLevel] = useState({ current_level: 'A1', target_level: 'B2' });
  const [levelStats, setLevelStats] = useState<{[level: string]: number}>({});

  const { control, handleSubmit } = useForm<LearningGoals>({
    defaultValues: userSettings,
  });

  useEffect(() => {
    loadUserLevel();
    loadLevelStats();
  }, []);

  // 設定画面がフォーカスされたときにデータをリフレッシュ
  useFocusEffect(
    useCallback(() => {
      console.log('SettingsForm focused - checking database status');
      if (databaseService.isInitialized()) {
        console.log('Database initialized - refreshing settings data');
        loadUserLevel();
        loadLevelStats();
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

  const handleApiKeySuccess = () => {
    setShowApiModal(false);
    Alert.alert('Success', 'API key configured successfully!');
  };

  const navigateToSavedWords = () => {
    router.push('/saved-words' as any);
  };

  const studyTimeOptions = [5, 10, 15, 20, 30, 45, 60, 90, 120];
  const wordCountOptions = [5, 10, 15, 20, 25, 30, 40, 50, 75, 100];
  const difficultyOptions: { value: DifficultyLevel; label: string }[] = [
    { value: 'beginner', label: 'Beginner' },
    { value: 'intermediate', label: 'Intermediate' },
    { value: 'advanced', label: 'Advanced' },
  ];

  const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  return (
    <View style={styles.container}>
      {/* Learning Goals Section */}
      <Animated.View entering={FadeInDown.delay(100)}>
        <ModernCard variant="primary" delay={0}>
          <ThemedText style={styles.sectionTitle}>🎯 Learning Goals</ThemedText>
          
          {/* Daily Study Time */}
          <View style={styles.setting}>
            <ThemedText style={styles.label}>Daily Study Time</ThemedText>
            <Controller
              control={control}
              name="dailyStudyTimeMinutes"
              render={({ field: { value, onChange } }) => (
                <View style={styles.optionGrid}>
                  {studyTimeOptions.map((time, index) => (
                    <Animated.View key={time} entering={FadeInDown.delay(200 + index * 50)}>
                      <ModernButton
                        title={`${time}min`}
                        onPress={() => onChange(time)}
                        variant={value === time ? 'success' : 'neutral'}
                        size="sm"
                        style={styles.optionButton}
                      />
                    </Animated.View>
                  ))}
                </View>
              )}
            />
          </View>

          {/* Daily Word Count */}
          <View style={styles.setting}>
            <ThemedText style={styles.label}>Daily Word Count</ThemedText>
            <Controller
              control={control}
              name="dailyWordCount"
              render={({ field: { value, onChange } }) => (
                <View style={styles.optionGrid}>
                  {wordCountOptions.map((count, index) => (
                    <Animated.View key={count} entering={FadeInDown.delay(300 + index * 50)}>
                      <ModernButton
                        title={count.toString()}
                        onPress={() => onChange(count)}
                        variant={value === count ? 'success' : 'neutral'}
                        size="sm"
                        style={styles.optionButton}
                      />
                    </Animated.View>
                  ))}
                </View>
              )}
            />
          </View>

          {/* Difficulty Level */}
          <View style={styles.setting}>
            <ThemedText style={styles.label}>Difficulty Level</ThemedText>
            <Controller
              control={control}
              name="difficultyLevel"
              render={({ field: { value, onChange } }) => (
                <View style={styles.difficultyContainer}>
                  {difficultyOptions.map((option, index) => (
                    <Animated.View key={option.value} entering={FadeInDown.delay(400 + index * 100)}>
                      <ModernButton
                        title={option.label}
                        onPress={() => onChange(option.value)}
                        variant={value === option.value ? 'primary' : 'neutral'}
                        size="md"
                        style={styles.difficultyButton}
                      />
                    </Animated.View>
                  ))}
                </View>
              )}
            />
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
                    variant={audioSettings.accent === accent.value ? 'success' : 'neutral'}
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
            <View style={styles.speedContainer}>
              {[0.5, 0.75, 1.0, 1.25, 1.5].map((speed, index) => (
                <Animated.View key={speed} entering={FadeInDown.delay(700 + index * 50)}>
                  <ModernButton
                    title={`${speed}x`}
                    onPress={async () => {
                      await updateAudioSettings({ speed });
                      await speakWord('Beautiful', { speed });
                    }}
                    variant={audioSettings.speed === speed ? 'primary' : 'neutral'}
                    size="sm"
                    style={styles.speedButton}
                  />
                </Animated.View>
              ))}
            </View>
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
            <View style={styles.volumeContainer}>
              {[0.3, 0.5, 0.7, 1.0].map((volume, index) => (
                <Animated.View key={volume} entering={FadeInDown.delay(800 + index * 50)}>
                  <ModernButton
                    title={`${Math.round(volume * 100)}%`}
                    onPress={() => updateAudioSettings({ volume })}
                    variant={audioSettings.volume === volume ? 'error' : 'neutral'}
                    size="sm"
                    style={styles.volumeButton}
                  />
                </Animated.View>
              ))}
            </View>
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

      {/* CEFR Level Settings */}
      <Animated.View entering={FadeInDown.delay(400)}>
        <ModernCard variant="secondary" delay={0}>
          <ThemedText style={styles.sectionTitle}>📚 CEFR Levels</ThemedText>
          
          <View style={styles.setting}>
            <ThemedText style={styles.label}>Current Level: {userLevel.current_level}</ThemedText>
            <ThemedText style={styles.label}>Target Level: {userLevel.target_level}</ThemedText>
            
            <View style={styles.levelContainer}>
              {Object.entries(levelStats).map(([level, count]) => (
                <View key={level} style={styles.levelRow}>
                  <ThemedText style={styles.levelText}>
                    {level}: {count} words
                  </ThemedText>
                </View>
              ))}
            </View>
            
            <ModernButton
              title="Change CEFR Levels"
              onPress={() => {
                Alert.alert(
                  'Change Levels',
                  'Select your current and target CEFR levels',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Update Levels', onPress: () => {
                      // This would ideally open a level selection modal
                      Alert.prompt(
                        'Current Level',
                        'Enter your current CEFR level (A1, A2, B1, B2, C1, C2)',
                        (currentLevel) => {
                          if (currentLevel) {
                            Alert.prompt(
                              'Target Level',
                              'Enter your target CEFR level',
                              (targetLevel) => {
                                if (targetLevel) {
                                  handleCefrLevelChange(currentLevel.toUpperCase(), targetLevel.toUpperCase());
                                }
                              }
                            );
                          }
                        }
                      );
                    }}
                  ]
                );
              }}
              variant="primary"
              size="md"
              icon="🎯"
              style={styles.levelButton}
            />
          </View>
        </ModernCard>
      </Animated.View>

      {/* API Settings */}
      <Animated.View entering={FadeInDown.delay(500)}>
        <ModernCard variant={apiStatus.configured ? 'success' : 'warning'} delay={0}>
          <ThemedText style={styles.sectionTitle}>🔑 Words API</ThemedText>
          
          <View style={styles.setting}>
            <View style={styles.apiStatusRow}>
              <View style={styles.apiStatusInfo}>
                <ThemedText style={styles.apiStatusTitle}>
                  Status: {apiStatus.configured ? 'Configured' : 'Not Set'}
                </ThemedText>
                <ThemedText style={styles.apiStatusDescription}>
                  {apiStatus.configured 
                    ? 'API key is configured and provides enhanced word data'
                    : 'Configure API key for detailed word information'
                  }
                </ThemedText>
                {apiStatus.configured && (
                  <ThemedText style={styles.apiValidationText}>
                    {apiStatus.valid === true ? '✅ Valid' : apiStatus.valid === false ? '❌ Invalid' : '🔄 Checking...'}
                  </ThemedText>
                )}
              </View>
              <ThemedText style={styles.apiEmoji}>
                {apiStatus.configured ? '✅' : '⚠️'}
              </ThemedText>
            </View>
            
            <View style={styles.apiButtons}>
              <ModernButton
                title={apiStatus.configured ? 'Update API Key' : 'Setup API Key'}
                onPress={() => setShowApiModal(true)}
                variant={apiStatus.configured ? 'neutral' : 'primary'}
                size="md"
                icon="🔑"
                style={styles.apiButton}
              />
              
              <ModernButton
                title="View Saved Words"
                onPress={navigateToSavedWords}
                variant="secondary"
                size="md"
                icon="📚"
                style={styles.apiButton}
              />
            </View>
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

      <ApiKeyModal
        visible={showApiModal}
        onClose={() => setShowApiModal(false)}
        onSuccess={handleApiKeySuccess}
        title="Configure Words API"
        skipable={true}
      />
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
  difficultyContainer: {
    gap: Spacing.sm,
  },
  difficultyButton: {
    width: '100%',
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
    fontSize: 14,
    fontWeight: '500',
  },
  levelButton: {
    width: '100%',
  },
  // API Settings styles
  apiStatusRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  apiStatusInfo: {
    flex: 1,
  },
  apiStatusTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: Spacing.xs,
  },
  apiStatusDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 18,
    marginBottom: Spacing.xs,
  },
  apiValidationText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.9)',
  },
  apiEmoji: {
    fontSize: 28,
    marginLeft: Spacing.sm,
  },
  apiButtons: {
    gap: Spacing.sm,
  },
  apiButton: {
    width: '100%',
  },
});