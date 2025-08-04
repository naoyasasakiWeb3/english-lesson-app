import React, { useState } from 'react';
import { 
  StyleSheet, 
  View, 
  TouchableOpacity, 
  Switch, 
  Alert,
  ScrollView 
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';
import { useAppStore } from '@/store/useAppStore';
import { useAudio } from '@/hooks/useAudio';
import { LearningGoals, DifficultyLevel } from '@/types';

export default function SettingsForm() {
  const { userSettings, setUserSettings } = useAppStore();
  const { settings: audioSettings, updateSettings: updateAudioSettings, speakWord } = useAudio();
  // const [showTimeSelector, setShowTimeSelector] = useState(false);

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
    <ScrollView style={styles.container}>
      <ThemedView style={styles.section}>
        <ThemedText type="subtitle" style={styles.sectionTitle}>Learning Goals</ThemedText>
        
        {/* Daily Study Time */}
        <View style={styles.setting}>
          <ThemedText style={styles.label}>Daily Study Time</ThemedText>
          <Controller
            control={control}
            name="dailyStudyTimeMinutes"
            render={({ field: { value, onChange } }) => (
              <View style={styles.optionGrid}>
                {studyTimeOptions.map((time) => (
                  <TouchableOpacity
                    key={time}
                    style={[
                      styles.optionButton,
                      value === time && styles.optionButtonSelected
                    ]}
                    onPress={() => onChange(time)}
                  >
                    <ThemedText 
                      style={[
                        styles.optionText,
                        value === time && styles.optionTextSelected
                      ]}
                    >
                      {time}min
                    </ThemedText>
                  </TouchableOpacity>
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
                {wordCountOptions.map((count) => (
                  <TouchableOpacity
                    key={count}
                    style={[
                      styles.optionButton,
                      value === count && styles.optionButtonSelected
                    ]}
                    onPress={() => onChange(count)}
                  >
                    <ThemedText 
                      style={[
                        styles.optionText,
                        value === count && styles.optionTextSelected
                      ]}
                    >
                      {count}
                    </ThemedText>
                  </TouchableOpacity>
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
                {difficultyOptions.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.difficultyButton,
                      value === option.value && styles.difficultyButtonSelected
                    ]}
                    onPress={() => onChange(option.value)}
                  >
                    <ThemedText 
                      style={[
                        styles.difficultyText,
                        value === option.value && styles.difficultyTextSelected
                      ]}
                    >
                      {option.label}
                    </ThemedText>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          />
        </View>
      </ThemedView>

      <ThemedView style={styles.section}>
        <ThemedText type="subtitle" style={styles.sectionTitle}>Schedule</ThemedText>
        
        {/* Learning Days */}
        <View style={styles.setting}>
          <ThemedText style={styles.label}>Learning Days</ThemedText>
          <Controller
            control={control}
            name="learningDays"
            render={({ field: { value, onChange } }) => (
              <View style={styles.dayContainer}>
                {dayNames.map((day, index) => (
                  <View key={day} style={styles.dayRow}>
                    <ThemedText style={styles.dayLabel}>{day}</ThemedText>
                    <Switch
                      value={value[index]}
                      onValueChange={(enabled) => {
                        const newDays = [...value];
                        newDays[index] = enabled;
                        onChange(newDays);
                      }}
                      trackColor={{ false: '#767577', true: '#4CAF50' }}
                      thumbColor={value[index] ? '#ffffff' : '#f4f3f4'}
                    />
                  </View>
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
            render={({ field: { value, onChange } }) => (
              <TouchableOpacity
                style={styles.timeButton}
                onPress={() => Alert.alert('Time Picker', 'Time picker functionality would be implemented here')}
              >
                <ThemedText style={styles.timeText}>
                  {value || 'Set Reminder Time'}
                </ThemedText>
              </TouchableOpacity>
            )}
          />
        </View>
      </ThemedView>

      <ThemedView style={styles.section}>
        <ThemedText type="subtitle" style={styles.sectionTitle}>Audio Settings</ThemedText>
        
        {/* Accent Selection */}
        <View style={styles.setting}>
          <ThemedText style={styles.label}>Accent</ThemedText>
          <View style={styles.accentContainer}>
            {[
              { value: 'us' as const, label: 'American English' },
              { value: 'uk' as const, label: 'British English' }
            ].map((accent) => (
              <TouchableOpacity
                key={accent.value}
                style={[
                  styles.accentButton,
                  audioSettings.accent === accent.value && styles.accentButtonSelected
                ]}
                onPress={() => updateAudioSettings({ accent: accent.value })}
              >
                <ThemedText 
                  style={[
                    styles.accentText,
                    audioSettings.accent === accent.value && styles.accentTextSelected
                  ]}
                >
                  {accent.label}
                </ThemedText>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Speech Speed */}
        <View style={styles.setting}>
          <ThemedText style={styles.label}>Speech Speed: {audioSettings.speed}x</ThemedText>
          <View style={styles.speedContainer}>
            {[0.5, 0.75, 1.0, 1.25, 1.5].map((speed) => (
              <TouchableOpacity
                key={speed}
                style={[
                  styles.speedButton,
                  audioSettings.speed === speed && styles.speedButtonSelected
                ]}
                onPress={async () => {
                  await updateAudioSettings({ speed });
                  await speakWord('Beautiful', { speed });
                }}
              >
                <ThemedText 
                  style={[
                    styles.speedText,
                    audioSettings.speed === speed && styles.speedTextSelected
                  ]}
                >
                  {speed}x
                </ThemedText>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Auto-play Setting */}
        <View style={styles.setting}>
          <View style={styles.switchRow}>
            <ThemedText style={styles.label}>Auto-play Pronunciation</ThemedText>
            <Switch
              value={audioSettings.autoPlay}
              onValueChange={(value) => updateAudioSettings({ autoPlay: value })}
              trackColor={{ false: '#767577', true: '#4CAF50' }}
              thumbColor={audioSettings.autoPlay ? '#ffffff' : '#f4f3f4'}
            />
          </View>
          <ThemedText style={styles.settingDescription}>
            Automatically play word pronunciation when showing new questions
          </ThemedText>
        </View>

        {/* Volume Setting */}
        <View style={styles.setting}>
          <ThemedText style={styles.label}>Volume: {Math.round(audioSettings.volume * 100)}%</ThemedText>
          <View style={styles.volumeContainer}>
            {[0.3, 0.5, 0.7, 1.0].map((volume) => (
              <TouchableOpacity
                key={volume}
                style={[
                  styles.volumeButton,
                  audioSettings.volume === volume && styles.volumeButtonSelected
                ]}
                onPress={() => updateAudioSettings({ volume })}
              >
                <ThemedText 
                  style={[
                    styles.volumeText,
                    audioSettings.volume === volume && styles.volumeTextSelected
                  ]}
                >
                  {Math.round(volume * 100)}%
                </ThemedText>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Test Audio */}
        <TouchableOpacity
          style={styles.testAudioButton}
          onPress={() => speakWord('Hello, this is a pronunciation test')}
        >
          <ThemedText style={styles.testAudioText}>🔊 Test Audio Settings</ThemedText>
        </TouchableOpacity>
      </ThemedView>

      <ThemedView style={styles.section}>
        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleSubmit(onSubmit)}
        >
          <ThemedText style={styles.saveButtonText}>Save Settings</ThemedText>
        </TouchableOpacity>
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
  sectionTitle: {
    marginBottom: 20,
    textAlign: 'center',
  },
  setting: {
    marginBottom: 25,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  optionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    minWidth: 60,
    alignItems: 'center',
  },
  optionButtonSelected: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  optionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  optionTextSelected: {
    color: '#ffffff',
  },
  difficultyContainer: {
    gap: 10,
  },
  difficultyButton: {
    padding: 16,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    alignItems: 'center',
  },
  difficultyButtonSelected: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  difficultyText: {
    fontSize: 16,
    fontWeight: '500',
  },
  difficultyTextSelected: {
    color: '#ffffff',
  },
  dayContainer: {
    gap: 12,
  },
  dayRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  dayLabel: {
    fontSize: 16,
  },
  timeButton: {
    padding: 16,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    alignItems: 'center',
  },
  timeText: {
    fontSize: 16,
    fontWeight: '500',
  },
  saveButton: {
    backgroundColor: '#2196F3',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
  // Audio settings styles
  accentContainer: {
    gap: 10,
  },
  accentButton: {
    padding: 16,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    alignItems: 'center',
  },
  accentButtonSelected: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  accentText: {
    fontSize: 16,
    fontWeight: '500',
  },
  accentTextSelected: {
    color: '#ffffff',
  },
  speedContainer: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  speedButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    minWidth: 60,
    alignItems: 'center',
  },
  speedButtonSelected: {
    backgroundColor: '#2196F3',
    borderColor: '#2196F3',
  },
  speedText: {
    fontSize: 14,
    fontWeight: '500',
  },
  speedTextSelected: {
    color: '#ffffff',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  settingDescription: {
    fontSize: 14,
    opacity: 0.7,
    lineHeight: 18,
  },
  volumeContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  volumeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    minWidth: 60,
    alignItems: 'center',
  },
  volumeButtonSelected: {
    backgroundColor: '#FF9800',
    borderColor: '#FF9800',
  },
  volumeText: {
    fontSize: 14,
    fontWeight: '500',
  },
  volumeTextSelected: {
    color: '#ffffff',
  },
  testAudioButton: {
    backgroundColor: '#9C27B0',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  testAudioText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});