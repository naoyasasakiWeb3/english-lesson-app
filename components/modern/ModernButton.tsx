import { ThemedText } from '@/components/ThemedText';
import { BorderRadius, ModernColors, ShadowStyles } from '@/constants/ModernColors';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, TextStyle, TouchableOpacity, ViewStyle } from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    withTiming
} from 'react-native-reanimated';

type ButtonVariant = 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ModernButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  icon?: string;
  style?: ViewStyle;
  textStyle?: TextStyle;
  gradientColors?: [string, string, ...string[]];
}

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export default function ModernButton({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  icon,
  style,
  textStyle,
  gradientColors
}: ModernButtonProps) {
  const scale = useSharedValue(1);
  const backgroundOpacity = useSharedValue(1);
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: backgroundOpacity.value,
  }));

  const handlePressIn = () => {
    if (!disabled && !loading) {
      scale.value = withSpring(0.98);
      backgroundOpacity.value = withTiming(0.8, { duration: 150 });
    }
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
    backgroundOpacity.value = withTiming(1, { duration: 150 });
  };

  const getVariantColors = () => {
    if (gradientColors) return gradientColors;
    
    switch (variant) {
      case 'primary':
        return ModernColors.gradients.primaryBlue;
      case 'secondary':
        return ModernColors.gradients.neutral;
      case 'success':
        return ModernColors.gradients.success;
      case 'warning':
        return ModernColors.gradients.warning;
      case 'error':
        return ModernColors.gradients.error;
      default:
        return ModernColors.gradients.primaryBlue;
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return { paddingVertical: 8, paddingHorizontal: 16, minHeight: 36 };
      case 'lg':
        return { paddingVertical: 16, paddingHorizontal: 32, minHeight: 56 };
      default:
        return { paddingVertical: 12, paddingHorizontal: 24, minHeight: 48 };
    }
  };

  const getTextSize = () => {
    switch (size) {
      case 'sm': return 14;
      case 'lg': return 18;
      default: return 16;
    }
  };

  const getTextColor = () => {
    if (variant === 'ghost') return ModernColors.primary[600];
    return '#ffffff';
  };

  const buttonContent = (
    <Animated.View style={[styles.button, getSizeStyles(), animatedStyle, style]}>
      {variant === 'ghost' ? (
        <Animated.View style={[styles.ghostButton, getSizeStyles()]}>
          <ThemedText style={[
            styles.buttonText, 
            { fontSize: getTextSize(), color: getTextColor() },
            textStyle
          ]}>
            {icon && `${icon} `}{title}
          </ThemedText>
        </Animated.View>
      ) : (
        <LinearGradient
          colors={getVariantColors() as [string, string, ...string[]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.gradient, getSizeStyles()]}
        >
          <ThemedText style={[
            styles.buttonText, 
            { fontSize: getTextSize(), color: getTextColor() },
            textStyle
          ]}>
            {icon && `${icon} `}{loading ? 'Loading...' : title}
          </ThemedText>
        </LinearGradient>
      )}
    </Animated.View>
  );

  return (
    <AnimatedTouchable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled || loading}
      activeOpacity={1}
      style={[disabled && styles.disabled]}
    >
      {buttonContent}
    </AnimatedTouchable>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    ...ShadowStyles.small,
  },
  gradient: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.md,
  },
  ghostButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: ModernColors.primary[200],
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.md,
  },
  buttonText: {
    fontWeight: '600',
    textAlign: 'center',
  },
  disabled: {
    opacity: 0.5,
  },
});