# Project Structure

## Root Directory Organization

### Configuration Files
- `package.json` - Project dependencies and scripts
- `tsconfig.json` - TypeScript configuration with path mapping
- `eslint.config.js` - ESLint rules and Expo configuration
- `app.json` - Expo app configuration and metadata
- `eas.json` - Expo Application Services build configuration
- `expo-env.d.ts` - TypeScript environment declarations

### Core Directories
- `app/` - Expo Router file-based routing system
- `components/` - Reusable React Native components
- `services/` - Business logic and external API integrations
- `store/` - Zustand state management
- `hooks/` - Custom React hooks
- `types/` - TypeScript type definitions
- `constants/` - App-wide constants and configuration
- `assets/` - Static assets (images, fonts)
- `scripts/` - Development and build scripts

## Detailed Directory Structure

### App Router (`app/`)
```
app/
├── _layout.tsx              # Root layout with providers
├── +not-found.tsx          # 404 error page
└── (tabs)/                 # Tab navigation group
    ├── _layout.tsx         # Tab layout configuration
    ├── index.tsx           # Dashboard/Home screen
    ├── quiz.tsx            # Quiz functionality screen
    ├── review.tsx          # Review and bookmarks screen
    └── settings.tsx        # App settings screen
```

### Components (`components/`)
```
components/
├── [Feature Components]     # Main app functionality
│   ├── QuizComponent.tsx   # Core quiz logic and UI
│   ├── QuizModeSelector.tsx # Quiz mode selection
│   ├── ReviewSection.tsx   # Review functionality
│   ├── SettingsForm.tsx    # Settings form handling
│   └── DashboardStats.tsx  # Progress statistics
├── [Progress Components]    # Progress tracking
│   ├── LevelProgress.tsx   # Level progression display
│   └── WeeklyProgress.tsx  # Weekly statistics
├── [UI Foundation]         # Base UI components
│   ├── ThemedText.tsx      # Themed text component
│   ├── ThemedView.tsx      # Themed view container
│   └── ExternalLink.tsx    # External link handler
├── layout/                 # Layout components
│   ├── ModernCard.tsx      # Card layout component
│   └── ModernScreenLayout.tsx # Screen layout wrapper
├── modern/                 # Modern UI components
│   ├── ModernButton.tsx    # Styled button component
│   ├── ModernTextInput.tsx # Styled text input
│   └── AnimatedCard.tsx    # Animated card component
├── onboarding/             # Onboarding flow
│   ├── OnboardingFlow.tsx  # Main onboarding coordinator
│   ├── WelcomeScreen.tsx   # Welcome screen
│   ├── LevelSelectionScreen.tsx # Level selection
│   ├── CefrIntroScreen.tsx # CEFR introduction
│   ├── OnboardingProgress.tsx # Progress indicator
│   └── OnboardingCompleteScreen.tsx # Completion screen
└── ui/                     # Platform-specific UI
    ├── IconSymbol.tsx      # Cross-platform icons
    ├── IconSymbol.ios.tsx  # iOS-specific icons
    ├── TabBarBackground.tsx # Tab bar styling
    └── TabBarBackground.ios.tsx # iOS tab bar
```

### Services (`services/`)
```
services/
├── database.ts             # SQLite database operations
├── dictionaryApi.ts        # Dictionary API integration
├── audioService.ts         # Audio playback and TTS
├── enrichedVocabularyService.ts # Vocabulary management
├── enrichedQuizService.ts  # Quiz logic and scoring
└── [Vocabulary Data]       # Vocabulary JSON files
    ├── vocabulary.json     # Base vocabulary data
    ├── enriched_vocabulary_A1.json # Beginner level
    ├── enriched_vocabulary_A2.json # Pre-intermediate
    ├── enriched_vocabulary_B1.json # Intermediate
    ├── enriched_vocabulary_B2.json # Upper-intermediate
    ├── enriched_vocabulary_C1.json # Advanced
    └── enriched_vocabulary_C2.json # Proficient
```

### Store (`store/`)
```
store/
└── useAppStore.ts          # Zustand state management store
```

### Hooks (`hooks/`)
```
hooks/
├── useAudio.ts             # Audio playback hook
├── useDictionary.ts        # Dictionary API hook
├── useThemeColor.ts        # Theme color hook
├── useColorScheme.ts       # Color scheme detection
└── useColorScheme.web.ts   # Web-specific color scheme
```

### Types (`types/`)
```
types/
└── index.ts                # Global TypeScript definitions
```

### Constants (`constants/`)
```
constants/
├── Colors.ts               # Color palette definitions
└── ModernColors.ts         # Modern UI color scheme
```

## Code Organization Patterns

### Component Structure
```typescript
// Standard component structure
import React from 'react';
import { StyleSheet } from 'react-native';
import { ThemedView } from '@/components/ThemedView';

interface ComponentProps {
  // Props interface
}

export function ComponentName({ prop }: ComponentProps) {
  // Component logic
  return (
    <ThemedView style={styles.container}>
      {/* JSX content */}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  // Styles object
});
```

### Service Layer Pattern
```typescript
// Service structure for external integrations
class ServiceName {
  private static instance: ServiceName;
  
  public static getInstance(): ServiceName {
    // Singleton pattern for services
  }
  
  public async methodName(): Promise<ReturnType> {
    // Service methods
  }
}

export default ServiceName.getInstance();
```

### Hook Pattern
```typescript
// Custom hook structure
import { useState, useEffect } from 'react';

export function useCustomHook(parameter: Type) {
  const [state, setState] = useState<StateType>();
  
  useEffect(() => {
    // Effect logic
  }, [parameter]);
  
  return {
    // Return object with state and methods
  };
}
```

## File Naming Conventions

### Components
- **PascalCase** for component files: `QuizComponent.tsx`
- **Descriptive names** indicating functionality
- **Platform suffixes** for platform-specific files: `.ios.tsx`, `.android.tsx`

### Services
- **camelCase** for service files: `audioService.ts`
- **Descriptive names** indicating purpose
- **Consistent suffix** for related services: `Service.ts`

### Hooks
- **camelCase** starting with "use": `useAudio.ts`
- **Descriptive names** indicating functionality
- **Platform suffixes** when needed: `.web.ts`

### Types
- **camelCase** for type files: `index.ts`
- **Interface names** in PascalCase: `UserProgress`
- **Type names** in PascalCase: `QuizMode`

## Import Organization

### Import Order
1. **React and React Native** imports
2. **Third-party library** imports
3. **Local component** imports (using @/ alias)
4. **Service and utility** imports
5. **Type** imports (with `type` keyword)

### Path Aliases
```typescript
// Using @ alias for root imports
import { ThemedView } from '@/components/ThemedView';
import { useAppStore } from '@/store/useAppStore';
import type { WordData } from '@/types';
```

### Relative vs Absolute Imports
- **Use @/ alias** for imports from root directories
- **Use relative paths** only for same-directory imports
- **Avoid deep relative paths** (../../..)

## Key Architectural Principles

### Separation of Concerns
- **Components**: UI rendering and user interaction
- **Services**: Business logic and external API calls
- **Store**: Application state management
- **Hooks**: Reusable stateful logic

### Expo Router Conventions
- **File-based routing** in `app/` directory
- **Layout files** for shared navigation structure
- **Route groups** using parentheses: `(tabs)/`
- **Dynamic routes** using brackets: `[id].tsx`

### Component Composition
- **Themed components** for consistent styling
- **Layout components** for screen structure
- **Feature components** for specific functionality
- **UI components** for reusable elements

### State Management Strategy
- **Zustand store** for global application state
- **React Hook Form** for form state management
- **Local state** for component-specific data
- **React Query** for server state and caching

### Platform-Specific Adaptations
- **Platform files** for iOS/Android differences
- **Conditional rendering** for minor variations
- **Platform-specific hooks** for web adaptations
- **Expo modules** for native functionality

### Performance Considerations
- **Lazy loading** for route components where beneficial
- **Memoization** for expensive calculations
- **Optimized images** using Expo Image
- **Efficient re-renders** with proper dependency arrays