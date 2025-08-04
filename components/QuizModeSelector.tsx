import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';

interface Props {
  selectedMode: 'random' | 'review' | 'bookmarked' | 'weak';
  onModeSelect: (mode: 'random' | 'review' | 'bookmarked' | 'weak') => void;
  onStartQuiz: () => void;
}

export default function QuizModeSelector({ selectedMode, onModeSelect, onStartQuiz }: Props) {
  const modes = [
    {
      id: 'random' as const,
      title: 'Random Quiz',
      subtitle: 'Mixed difficulty words',
      emoji: '🎲',
      color: '#4CAF50',
      description: 'Practice with a random selection of words based on your difficulty level'
    },
    {
      id: 'review' as const,
      title: 'Review Mode',
      subtitle: 'Focus on weak words',
      emoji: '📚',
      color: '#FF9800',
      description: 'Review words you\'ve struggled with in the past'
    },
    {
      id: 'bookmarked' as const,
      title: 'Bookmarked',
      subtitle: 'Your saved words',
      emoji: '⭐',
      color: '#9C27B0',
      description: 'Practice words you\'ve bookmarked for review'
    },
    {
      id: 'weak' as const,
      title: 'Challenge Mode',
      subtitle: 'Difficult words only',
      emoji: '🔥',
      color: '#F44336',
      description: 'Focus on your most challenging vocabulary'
    }
  ];

  return (
    <ThemedView style={styles.container}>
      <View style={styles.modesContainer}>
        {modes.map((mode) => (
          <TouchableOpacity
            key={mode.id}
            style={[
              styles.modeCard,
              selectedMode === mode.id && styles.selectedModeCard,
              { borderLeftColor: mode.color }
            ]}
            onPress={() => onModeSelect(mode.id)}
            activeOpacity={0.7}
          >
            <View style={styles.modeHeader}>
              <View style={styles.modeIcon}>
                <ThemedText style={styles.emoji}>{mode.emoji}</ThemedText>
              </View>
              <View style={styles.modeInfo}>
                <ThemedText type="defaultSemiBold" style={styles.modeTitle}>
                  {mode.title}
                </ThemedText>
                <ThemedText style={styles.modeSubtitle}>
                  {mode.subtitle}
                </ThemedText>
              </View>
              {selectedMode === mode.id && (
                <View style={styles.selectedIndicator}>
                  <ThemedText style={styles.checkmark}>✓</ThemedText>
                </View>
              )}
            </View>
            <ThemedText style={styles.modeDescription}>
              {mode.description}
            </ThemedText>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.selectedModeInfo}>
        {selectedMode && (
          <>
            <ThemedText style={styles.selectedModeText}>
              Selected: {modes.find(m => m.id === selectedMode)?.title}
            </ThemedText>
            <TouchableOpacity
              style={[
                styles.startButton,
                { backgroundColor: modes.find(m => m.id === selectedMode)?.color }
              ]}
              onPress={onStartQuiz}
            >
              <ThemedText style={styles.startButtonText}>
                Start Quiz
              </ThemedText>
            </TouchableOpacity>
          </>
        )}
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  modesContainer: {
    gap: 16,
    marginBottom: 30,
  },
  modeCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderLeftWidth: 4,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  selectedModeCard: {
    borderWidth: 2,
    borderColor: '#2196F3',
    backgroundColor: '#f3f9ff',
  },
  modeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  modeIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  emoji: {
    fontSize: 24,
  },
  modeInfo: {
    flex: 1,
  },
  modeTitle: {
    fontSize: 18,
    marginBottom: 4,
  },
  modeSubtitle: {
    fontSize: 14,
    opacity: 0.7,
  },
  selectedIndicator: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmark: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modeDescription: {
    fontSize: 14,
    lineHeight: 20,
    opacity: 0.8,
  },
  selectedModeInfo: {
    alignItems: 'center',
    gap: 16,
  },
  selectedModeText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  startButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 40,
    paddingVertical: 16,
    borderRadius: 8,
    minWidth: 200,
    alignItems: 'center',
  },
  startButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
});