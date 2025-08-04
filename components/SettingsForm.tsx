import React from 'react';
import { 
  StyleSheet, 
  View, 
  Switch, 
  Alert
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useForm, Controller } from 'react-hook-form';
import { ThemedText } from './ThemedText';
import ModernCard from './layout/ModernCard';
import ModernButton from './modern/ModernButton';
import { useAppStore } from '@/store/useAppStore';
import { useAudio } from '@/hooks/useAudio';
import { LearningGoals, DifficultyLevel } from '@/types';
import { Spacing } from '@/constants/ModernColors';

export default function SettingsForm() {
  const { userSettings, setUserSettings } = useAppStore();
  const { settings: audioSettings, updateSettings: updateAudioSettings, speakWord } = useAudio();

  const { control, handleSubmit } = useForm<LearningGoals>({
    defaultValues: userSettings,
  });

  const onSubmit = (data: LearningGoals) => {
    setUserSettings(data);
    Alert.alert('Success', 'Settings saved successfully!');
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
});