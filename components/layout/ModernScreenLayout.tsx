import React, { ReactNode } from 'react';
import { StyleSheet, ScrollView, ViewStyle } from 'react-native';
import Animated, { 
  FadeIn, 
  useAnimatedScrollHandler, 
  useSharedValue,
  useAnimatedStyle,
  interpolate,
  Extrapolate
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ModernColors, Spacing } from '@/constants/ModernColors';
import { ThemedText } from '@/components/ThemedText';

interface ModernScreenLayoutProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  showScrollIndicator?: boolean;
  contentStyle?: ViewStyle;
  headerStyle?: ViewStyle;
}

const AnimatedScrollView = Animated.createAnimatedComponent(ScrollView);

export default function ModernScreenLayout({
  children,
  title,
  subtitle,
  showScrollIndicator = false,
  contentStyle,
  headerStyle
}: ModernScreenLayoutProps) {
  const scrollY = useSharedValue(0);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  const headerAnimatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      scrollY.value,
      [0, 50, 100],
      [1, 0.8, 0.6],
      Extrapolate.CLAMP
    );
    
    const translateY = interpolate(
      scrollY.value,
      [0, 100],
      [0, -20],
      Extrapolate.CLAMP
    );

    const scale = interpolate(
      scrollY.value,
      [0, 100],
      [1, 0.95],
      Extrapolate.CLAMP
    );

    return {
      opacity,
      transform: [{ translateY }, { scale }],
    };
  });

  const backgroundAnimatedStyle = useAnimatedStyle(() => {
    const translateY = interpolate(
      scrollY.value,
      [0, 200],
      [0, -50],
      Extrapolate.CLAMP
    );

    return {
      transform: [{ translateY }],
    };
  });

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <Animated.View style={[styles.backgroundContainer, backgroundAnimatedStyle]}>
        <LinearGradient
          colors={ModernColors.gradients.background as [string, string, ...string[]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradientBackground}
        />
      </Animated.View>
      
      <AnimatedScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.contentContainer, contentStyle]}
        showsVerticalScrollIndicator={showScrollIndicator}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
      >
        {(title || subtitle) && (
          <Animated.View 
            entering={FadeIn.delay(100)} 
            style={[styles.header, headerStyle, headerAnimatedStyle]}
          >
            {title && (
              <ThemedText type="title" style={styles.title}>
                {title}
              </ThemedText>
            )}
            {subtitle && (
              <ThemedText style={styles.subtitle}>
                {subtitle}
              </ThemedText>
            )}
          </Animated.View>
        )}
        
        <Animated.View entering={FadeIn.delay(200)} style={styles.content}>
          {children}
        </Animated.View>
      </AnimatedScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  backgroundContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: -1,
  },
  gradientBackground: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    flexGrow: 1,
    padding: Spacing.lg,
    paddingBottom: Spacing.xl * 2,
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
    paddingVertical: Spacing.md,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#ffffff',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginTop: Spacing.sm,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  content: {
    flex: 1,
  },
});