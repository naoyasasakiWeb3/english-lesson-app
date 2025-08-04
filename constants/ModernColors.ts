// Modern Color Palette with Gradients and Shadows
export const ModernColors = {
  // Primary Gradients
  gradients: {
    primaryBlue: ['#667eea', '#764ba2'],
    primaryPurple: ['#f093fb', '#f5576c'],
    success: ['#4facfe', '#00f2fe'],
    warning: ['#f6d365', '#fda085'],
    error: ['#ff9a9e', '#fecfef'],
    neutral: ['#ffecd2', '#fcb69f'],
    dark: ['#2c3e50', '#34495e'],
    light: ['#ffffff', '#f8f9fa'],
  },

  // Solid Colors
  primary: {
    50: '#f0f4ff',
    100: '#e0e7ff',
    200: '#c7d2fe',
    300: '#a5b4fc',
    400: '#818cf8',
    500: '#6366f1',
    600: '#4f46e5',
    700: '#4338ca',
    800: '#3730a3',
    900: '#312e81',
  },

  // Semantic Colors
  success: {
    50: '#f0fdf4',
    100: '#dcfce7',
    200: '#bbf7d0',
    300: '#86efac',
    400: '#4ade80',
    500: '#22c55e',
    600: '#16a34a',
    700: '#15803d',
    800: '#166534',
    900: '#14532d',
  },

  warning: {
    50: '#fffbeb',
    100: '#fef3c7',
    200: '#fde68a',
    300: '#fcd34d',
    400: '#fbbf24',
    500: '#f59e0b',
    600: '#d97706',
    700: '#b45309',
    800: '#92400e',
    900: '#78350f',
  },

  error: {
    50: '#fef2f2',
    100: '#fee2e2',
    200: '#fecaca',
    300: '#fca5a5',
    400: '#f87171',
    500: '#ef4444',
    600: '#dc2626',
    700: '#b91c1c',
    800: '#991b1b',
    900: '#7f1d1d',
  },

  // Neutral Colors
  gray: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#111827',
    900: '#0f172a',
  },

  // Glass Effects
  glass: {
    light: 'rgba(255, 255, 255, 0.1)',
    medium: 'rgba(255, 255, 255, 0.15)',
    dark: 'rgba(0, 0, 0, 0.1)',
  },

  // Shadow Colors
  shadows: {
    light: 'rgba(0, 0, 0, 0.05)',
    medium: 'rgba(0, 0, 0, 0.1)',
    heavy: 'rgba(0, 0, 0, 0.2)',
    colored: 'rgba(99, 102, 241, 0.1)',
  },
};

// Gradient Styles for React Native
export const GradientStyles = {
  primaryCard: {
    colors: ModernColors.gradients.primaryBlue,
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },
  successCard: {
    colors: ModernColors.gradients.success,
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },
  warningCard: {
    colors: ModernColors.gradients.warning,
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },
  neutralCard: {
    colors: ModernColors.gradients.neutral,
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },
};

// Modern Shadow Styles
export const ShadowStyles = {
  small: {
    shadowColor: ModernColors.shadows.light,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 2,
  },
  medium: {
    shadowColor: ModernColors.shadows.medium,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 4,
  },
  large: {
    shadowColor: ModernColors.shadows.heavy,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 8,
  },
  colored: {
    shadowColor: ModernColors.shadows.colored,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 6,
  },
};

// Border Radius System
export const BorderRadius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  full: 9999,
};

// Spacing System
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
  '3xl': 64,
};