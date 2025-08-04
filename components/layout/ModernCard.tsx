import { BorderRadius, ModernColors, ShadowStyles, Spacing } from '@/constants/ModernColors';
import { LinearGradient } from 'expo-linear-gradient';
import React, { ReactNode } from 'react';
import { Pressable, StyleSheet, ViewStyle } from 'react-native';
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming
} from 'react-native-reanimated';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface ModernCardProps {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'neutral' | 'glass';
  onPress?: () => void;
  style?: ViewStyle;
  contentStyle?: ViewStyle;
  pressable?: boolean;
  glassEffect?: boolean;
  delay?: number;
}

export default function ModernCard({
  children,
  variant = 'primary',
  onPress,
  style,
  contentStyle,
  pressable = true,
  glassEffect = false,
  delay = 0
}: ModernCardProps) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const handlePressIn = () => {
    if (pressable && onPress) {
      scale.value = withSpring(0.98);
      opacity.value = withTiming(0.9, { duration: 150 });
    }
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
    opacity.value = withTiming(1, { duration: 150 });
  };

  const getGradientColors = (): [string, string, ...string[]] => {
    switch (variant) {
      case 'primary':
        return ModernColors.gradients.primaryBlue as [string, string, ...string[]];
      case 'secondary':
        return ModernColors.gradients.primaryPurple as [string, string, ...string[]];
      case 'success':
        return ModernColors.gradients.success as [string, string, ...string[]];
      case 'warning':
        return ModernColors.gradients.warning as [string, string, ...string[]];
      case 'error':
        return ModernColors.gradients.error as [string, string, ...string[]];
      case 'neutral':
        return ModernColors.gradients.neutral as [string, string, ...string[]];
      case 'glass':
        return ModernColors.gradients.glass as [string, string, ...string[]];
      default:
        return ModernColors.gradients.primaryBlue as [string, string, ...string[]];
    }
  };

  const CardContent = (
    <Animated.View 
      style={[styles.card, animatedStyle, style]}
      entering={FadeInDown.delay(delay)}
    >
      <LinearGradient
        colors={getGradientColors()}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          styles.gradient,
          glassEffect && styles.glassEffect,
          contentStyle
        ]}
      >
        {children}
      </LinearGradient>
    </Animated.View>
  );

  if (pressable && onPress) {
    return (
      <AnimatedPressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={animatedStyle}
      >
        {CardContent}
      </AnimatedPressable>
    );
  }

  return CardContent;
}

const styles = StyleSheet.create({
  card: {
    borderRadius: BorderRadius.lg,
    marginVertical: Spacing.xs,
    overflow: 'hidden',
    ...ShadowStyles.medium,
  },
  gradient: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    minHeight: 60,
  },
  glassEffect: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    backdropFilter: 'blur(10px)',
  },
});