import React, { useState } from 'react';
import { 
  TextInput, 
  View, 
  StyleSheet, 
  TextInputProps,
  ViewStyle,
  Pressable 
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withTiming,
  FadeInDown
} from 'react-native-reanimated';
import { BorderRadius, ModernColors, Spacing } from '../../constants/ModernColors';
import { ThemedText } from '../ThemedText';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface ModernTextInputProps extends TextInputProps {
  label?: string;
  error?: string;
  leftIcon?: string;
  rightIcon?: string;
  onRightIconPress?: () => void;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'neutral';
  size?: 'sm' | 'md' | 'lg';
  containerStyle?: ViewStyle;
  showCharacterCount?: boolean;
  maxLength?: number;
}

export default function ModernTextInput({
  label,
  error,
  leftIcon,
  rightIcon,
  onRightIconPress,
  variant = 'primary',
  size = 'md',
  containerStyle,
  showCharacterCount = false,
  maxLength,
  style,
  onFocus,
  onBlur,
  value,
  ...props
}: ModernTextInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const scale = useSharedValue(1);
  const borderOpacity = useSharedValue(0.3);

  const handleFocus = (e: any) => {
    setIsFocused(true);
    scale.value = withTiming(1.02, { duration: 200 });
    borderOpacity.value = withTiming(1, { duration: 200 });
    onFocus?.(e);
  };

  const handleBlur = (e: any) => {
    setIsFocused(false);
    scale.value = withTiming(1, { duration: 200 });
    borderOpacity.value = withTiming(0.3, { duration: 200 });
    onBlur?.(e);
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const borderAnimatedStyle = useAnimatedStyle(() => ({
    opacity: borderOpacity.value,
  }));

  const getGradientColors = (): [string, string, ...string[]] => {
    if (error) {
      return ModernColors.gradients.error as [string, string, ...string[]];
    }
    
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
      default:
        return ModernColors.gradients.primaryBlue as [string, string, ...string[]];
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return {
          height: 45,
          fontSize: 14,
          paddingHorizontal: Spacing.md,
        };
      case 'lg':
        return {
          height: 60,
          fontSize: 18,
          paddingHorizontal: Spacing.lg,
        };
      default:
        return {
          height: 50,
          fontSize: 16,
          paddingHorizontal: Spacing.md,
        };
    }
  };

  const sizeStyles = getSizeStyles();

  return (
    <Animated.View 
      style={[styles.container, containerStyle]} 
      entering={FadeInDown.delay(100)}
    >
      {label && (
        <ThemedText style={[styles.label, error && styles.labelError]}>
          {label}
        </ThemedText>
      )}
      
      <Animated.View style={[animatedStyle]}>
        <View style={[styles.inputContainer, { height: sizeStyles.height }]}>
          {/* Background Gradient */}
          <LinearGradient
            colors={['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)']}
            style={styles.backgroundGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
          
          {/* Border Gradient */}
          <Animated.View style={[styles.borderGradientContainer, borderAnimatedStyle]}>
            <LinearGradient
              colors={getGradientColors()}
              style={styles.borderGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            />
          </Animated.View>

          <View style={styles.contentContainer}>
            {leftIcon && (
              <View style={styles.iconContainer}>
                <ThemedText style={styles.icon}>{leftIcon}</ThemedText>
              </View>
            )}

            <TextInput
              {...props}
              style={[
                styles.input,
                {
                  fontSize: sizeStyles.fontSize,
                  paddingHorizontal: leftIcon || rightIcon ? Spacing.xs : sizeStyles.paddingHorizontal,
                },
                style
              ]}
              placeholderTextColor="rgba(255, 255, 255, 0.5)"
              onFocus={handleFocus}
              onBlur={handleBlur}
              value={value}
              maxLength={maxLength}
            />

            {rightIcon && (
              <AnimatedPressable
                style={styles.iconContainer}
                onPress={onRightIconPress}
              >
                <ThemedText style={styles.icon}>{rightIcon}</ThemedText>
              </AnimatedPressable>
            )}
          </View>
        </View>
      </Animated.View>

      {/* Character Count */}
      {showCharacterCount && maxLength && (
        <ThemedText style={styles.characterCount}>
          {(value?.length || 0)} / {maxLength}
        </ThemedText>
      )}

      {/* Error Message */}
      {error && (
        <Animated.View entering={FadeInDown.delay(50)}>
          <ThemedText style={styles.errorText}>{error}</ThemedText>
        </Animated.View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: Spacing.xs,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: Spacing.xs,
  },
  labelError: {
    color: '#ff6b6b',
  },
  inputContainer: {
    position: 'relative',
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  backgroundGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  borderGradientContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    padding: 2,
  },
  borderGradient: {
    flex: 1,
    borderRadius: BorderRadius.lg,
  },
  contentContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(26, 11, 46, 0.8)',
    margin: 2,
    borderRadius: BorderRadius.lg - 2,
  },
  input: {
    flex: 1,
    color: '#ffffff',
    fontWeight: '500',
    paddingVertical: 0,
  },
  iconContainer: {
    paddingHorizontal: Spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    fontSize: 20,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  characterCount: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'right',
    marginTop: Spacing.xs,
    fontWeight: '500',
  },
  errorText: {
    fontSize: 14,
    color: '#ff6b6b',
    marginTop: Spacing.xs,
    fontWeight: '500',
  },
});