import { BorderRadius, ModernColors, ShadowStyles } from '@/constants/ModernColors';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { ColorValue, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    withTiming
} from 'react-native-reanimated';

interface AnimatedCardProps {
  children: React.ReactNode;
  onPress?: () => void;
  gradientColors?: [ColorValue, ColorValue, ...ColorValue[]];
  style?: ViewStyle;
  pressable?: boolean;
  glassEffect?: boolean;
}

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export default function AnimatedCard({ 
  children, 
  onPress, 
  gradientColors,
  style,
  pressable = true,
  glassEffect = false
}: AnimatedCardProps) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.98);
    opacity.value = withTiming(0.9, { duration: 150 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
    opacity.value = withTiming(1, { duration: 150 });
  };

  const cardContent = (
    <Animated.View style={[styles.card, animatedStyle, style]}>
      {gradientColors ? (
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.gradient, glassEffect && styles.glassEffect]}
        >
          {children}
        </LinearGradient>
      ) : (
        <Animated.View style={[styles.content, glassEffect && styles.glassEffect]}>
          {children}
        </Animated.View>
      )}
    </Animated.View>
  );

  if (pressable && onPress) {
    return (
      <AnimatedTouchable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
        style={animatedStyle}
      >
        {cardContent}
      </AnimatedTouchable>
    );
  }

  return cardContent;
}

const styles = StyleSheet.create({
  card: {
    borderRadius: BorderRadius.lg,
    marginVertical: 8,
    overflow: 'hidden',
    ...ShadowStyles.medium,
  },
  gradient: {
    borderRadius: BorderRadius.lg,
    padding: 20,
  },
  content: {
    backgroundColor: ModernColors.gray[50],
    borderRadius: BorderRadius.lg,
    padding: 20,
  },
  glassEffect: {
    backgroundColor: ModernColors.glass.light,
    backdropFilter: 'blur(10px)',
  },
});