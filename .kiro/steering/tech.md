# Technology Stack

## Architecture

### Mobile-First Cross-Platform
- **React Native 0.79.5** with Expo managed workflow
- **Expo SDK ~53.0.20** for streamlined mobile development
- **TypeScript ~5.8.3** for type safety and development efficiency
- **Expo Router ~5.1.4** for file-based navigation system

### State Management & Data Flow
- **Zustand ^5.0.7** for lightweight, scalable state management
- **React Hook Form ^7.62.0** for efficient form handling and validation
- **TanStack React Query ^5.84.1** for server state management and caching

### Local Data Storage
- **Expo SQLite ^15.2.14** for local database with offline-first architecture
- **AsyncStorage** for settings and simple key-value storage
- **Expo Secure Store ^14.2.3** for sensitive data storage

## Frontend Technologies

### UI Framework & Components
- **React 19.0.0** with latest features and optimizations
- **React Native** with native platform integrations
- **Expo Vector Icons ^14.1.0** for consistent iconography
- **Expo Symbols ~0.4.5** for iOS SF Symbols integration
- **React Native Vector Icons ^10.3.0** for extended icon libraries

### Navigation & Layout
- **React Navigation** ecosystem:
  - `@react-navigation/native ^7.1.6`
  - `@react-navigation/bottom-tabs ^7.3.10`
  - `@react-navigation/elements ^2.3.8`
- **React Native Safe Area Context ^5.4.0** for safe area handling
- **React Native Screens ~4.11.1** for optimized screen management

### Visual & Animation
- **React Native Reanimated ~3.17.4** for smooth animations
- **React Native Gesture Handler ~2.24.0** for advanced touch handling
- **Expo Linear Gradient ^14.1.5** for gradient backgrounds
- **Expo Blur ~14.1.5** for blur effects
- **Lottie React Native ^7.2.5** for vector animations

### Media & Audio
- **Expo AV ^15.1.7** for audio/video playback capabilities
- **Expo Audio ^0.4.8** for audio recording and playback
- **Expo Speech ^13.1.7** for text-to-speech functionality
- **Expo Image ~2.4.0** for optimized image handling

## Development Environment

### Prerequisites
- **Node.js v16+** (recommended: latest LTS)
- **Expo CLI** for development workflow
- **iOS Simulator** or **Android Emulator** for testing
- **Expo Go app** for device testing

### Build Tools & Linting
- **ESLint ^9.25.0** with Expo configuration
- **eslint-config-expo ~9.2.0** for Expo-specific rules
- **Babel ^7.25.2** for JavaScript transformation
- **TypeScript compiler** for type checking

### Platform Integrations
- **Expo Haptics ~14.1.4** for tactile feedback
- **Expo System UI ~5.0.10** for system-level UI control
- **Expo Status Bar ~2.2.3** for status bar customization
- **Expo Constants ~17.1.7** for app constants and device info

## Common Commands

### Development
```bash
npm start          # Start Expo development server
npm run ios        # Launch iOS simulator
npm run android    # Launch Android emulator
npm run web        # Start web development
npm run lint       # Run ESLint code analysis
```

### Project Management
```bash
npm install        # Install all dependencies
npm run reset-project  # Reset project to clean state
expo install       # Install Expo-compatible packages
expo doctor        # Check project health
```

### Build & Deploy
```bash
expo build:ios     # Build iOS app bundle
expo build:android # Build Android APK/AAB
expo publish       # Publish over-the-air update
```

## Environment Variables

### Development Configuration
- `EXPO_PUBLIC_API_URL` - Dictionary API base URL
- `EXPO_PUBLIC_DEBUG_MODE` - Enable/disable debug features
- `EXPO_PUBLIC_ANALYTICS` - Analytics tracking configuration

### Build Configuration
- `NODE_ENV` - Environment (development/production)
- `EXPO_PUBLIC_VERSION` - App version for tracking

## Port Configuration

### Development Servers
- **Expo Dev Server**: Port 8081 (default)
- **Metro Bundler**: Port 19000/19001 (default)
- **Tunnel Service**: Expo tunnel for device testing

### Database
- **SQLite**: Local file-based database (no network ports)
- **Dictionary API**: External HTTPS API calls

## Performance Optimizations

### Bundle Optimization
- **Expo tree-shaking** for reduced bundle size
- **Hermes engine** for improved JavaScript performance
- **Component lazy loading** where appropriate

### Database Performance
- **Indexed SQLite tables** for fast queries
- **Connection pooling** for database efficiency
- **Optimized query patterns** for vocabulary lookups

### Caching Strategy
- **7-day dictionary API cache** for offline functionality
- **30-day audio file cache** for pronunciation data
- **Progressive image loading** with Expo Image
- **State persistence** with Zustand middleware

## Platform-Specific Features

### iOS Integration
- **SF Symbols** via Expo Symbols
- **iOS-specific haptics** via Expo Haptics
- **Native audio session** management
- **iOS accessibility** features

### Android Integration
- **Material Design** components where applicable
- **Android-specific haptics** and feedback
- **Background audio** handling
- **Android accessibility** features

## Security Considerations

### Data Protection
- **Expo Secure Store** for sensitive authentication data
- **Local SQLite encryption** for user progress data
- **HTTPS-only** API communications
- **No sensitive data logging** in production

### Privacy
- **Offline-first architecture** minimizes data transmission
- **Local storage** for user progress and settings
- **Optional analytics** with user consent
- **No personal data** collection beyond app usage