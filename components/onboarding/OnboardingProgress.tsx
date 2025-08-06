import React from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  SharedValue,
  FadeInDown
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { ThemedText } from '../ThemedText';
import { Spacing, BorderRadius, ModernColors } from '../../constants/ModernColors';

interface OnboardingProgressProps {
  progress: SharedValue<number>;
  currentStep: number;
  totalSteps: number;
  stepTitles: string[];
}

export default function OnboardingProgress({ 
  progress, 
  currentStep, 
  totalSteps, 
  stepTitles 
}: OnboardingProgressProps) {
  const progressAnimatedStyle = useAnimatedStyle(() => ({
    width: `${progress.value}%`,
  }));

  return (
    <Animated.View 
      style={styles.container}
      entering={FadeInDown.delay(300)}
    >
      {/* Step Indicator */}
      <View style={styles.stepIndicator}>
        <ThemedText style={styles.stepText}>
          {currentStep + 1} of {totalSteps}
        </ThemedText>
        <ThemedText style={styles.stepTitle}>
          {stepTitles[currentStep]}
        </ThemedText>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressBarContainer}>
        <View style={styles.progressBarBackground}>
          <Animated.View style={[styles.progressBarFill, progressAnimatedStyle]}>
            <LinearGradient
              colors={ModernColors.gradients.primaryBlue as [string, string, ...string[]]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.progressGradient}
            />
          </Animated.View>
        </View>
      </View>

      {/* Step Dots */}
      <View style={styles.dotsContainer}>
        {Array.from({ length: totalSteps }, (_, index) => (
          <View
            key={index}
            style={[
              styles.dot,
              index === currentStep && styles.activeDot,
              index < currentStep && styles.completedDot,
            ]}
          >
            {index < currentStep ? (
              <ThemedText style={styles.completedIcon}>✓</ThemedText>
            ) : (
              <View style={styles.dotInner} />
            )}
          </View>
        ))}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 60, // Account for status bar
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
    backgroundColor: 'rgba(26, 11, 46, 0.95)',
  },
  stepIndicator: {
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  stepText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  stepTitle: {
    fontSize: 20,
    color: '#ffffff',
    fontWeight: '700',
  },
  progressBarContainer: {
    marginBottom: Spacing.lg,
  },
  progressBarBackground: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: BorderRadius.sm,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: BorderRadius.sm,
    minWidth: 4,
  },
  progressGradient: {
    flex: 1,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.md,
  },
  dot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  activeDot: {
    backgroundColor: 'rgba(74, 144, 226, 0.3)',
    borderColor: '#4a90e2',
    transform: [{ scale: 1.1 }],
  },
  completedDot: {
    backgroundColor: 'rgba(46, 204, 113, 0.3)',
    borderColor: '#2ecc71',
  },
  dotInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  completedIcon: {
    fontSize: 16,
    color: '#2ecc71',
    fontWeight: '700',
  },
});