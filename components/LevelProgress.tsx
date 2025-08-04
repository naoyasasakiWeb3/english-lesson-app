import React from 'react';
import { StyleSheet, View } from 'react-native';
import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';

interface Props {
  level: number;
  xp: number;
}

export default function LevelProgress({ level, xp }: Props) {
  const currentLevelXP = (level - 1) * 100;
  const nextLevelXP = level * 100;
  const progressXP = xp - currentLevelXP;
  const requiredXP = nextLevelXP - currentLevelXP;
  const progressPercentage = (progressXP / requiredXP) * 100;

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="subtitle" style={styles.title} lightColor="#000000" darkColor="#FFFFFF">Level Progress</ThemedText>
      
      <View style={styles.levelInfo}>
        <View style={styles.levelBadge}>
          <ThemedText type="title" style={styles.levelNumber}>{level}</ThemedText>
          <ThemedText style={styles.levelLabel}>Level</ThemedText>
        </View>
        
        <View style={styles.progressInfo}>
          <ThemedText style={styles.xpText} lightColor="#000000" darkColor="#FFFFFF">{progressXP} / {requiredXP} XP</ThemedText>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { width: `${Math.min(progressPercentage, 100)}%` }
              ]} 
            />
          </View>
          <ThemedText style={styles.nextLevelText} lightColor="#666666" darkColor="#CCCCCC">
            {requiredXP - progressXP} XP to Level {level + 1}
          </ThemedText>
        </View>
      </View>

      <View style={styles.achievements}>
        <ThemedText style={styles.achievementsTitle} lightColor="#000000" darkColor="#FFFFFF">Recent Achievements</ThemedText>
        <View style={styles.badgeContainer}>
          {level >= 2 && (
            <View style={styles.achievementBadge}>
              <ThemedText style={styles.badgeEmoji}>🎯</ThemedText>
              <ThemedText style={styles.badgeText} lightColor="#000000" darkColor="#000000">First Steps</ThemedText>
            </View>
          )}
          {level >= 5 && (
            <View style={styles.achievementBadge}>
              <ThemedText style={styles.badgeEmoji}>🔥</ThemedText>
              <ThemedText style={styles.badgeText} lightColor="#000000" darkColor="#000000">Getting Hot</ThemedText>
            </View>
          )}
          {level >= 10 && (
            <View style={styles.achievementBadge}>
              <ThemedText style={styles.badgeEmoji}>⭐</ThemedText>
              <ThemedText style={styles.badgeText} lightColor="#000000" darkColor="#000000">Star Learner</ThemedText>
            </View>
          )}
        </View>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 25,
    padding: 20,
    borderRadius: 12,
    backgroundColor: '#f8f9fa',
  },
  title: {
    textAlign: 'center',
    marginBottom: 20,
  },
  levelInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  levelBadge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#2196F3',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 20,
  },
  levelNumber: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  levelLabel: {
    color: '#ffffff',
    fontSize: 12,
  },
  progressInfo: {
    flex: 1,
  },
  xpText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  progressBar: {
    height: 12,
    backgroundColor: '#e0e0e0',
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 6,
  },
  nextLevelText: {
    fontSize: 14,
    opacity: 0.7,
  },
  achievements: {
    marginTop: 15,
  },
  achievementsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
  },
  badgeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  achievementBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  badgeEmoji: {
    fontSize: 16,
    marginRight: 6,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
});