# VocabMaster - English Word Learning App

A comprehensive English vocabulary learning application built with React Native and Expo, featuring interactive quizzes, progress tracking, and offline capabilities.

## Features

### 🎯 Core Learning Features
- **Interactive Quizzes**: Multiple-choice questions with instant feedback
- **Adaptive Difficulty**: Beginner, Intermediate, and Advanced levels
- **Smart Review System**: Focus on weak words and bookmarked terms
- **Progress Tracking**: Detailed statistics and learning analytics

### 🔊 Audio Features
- **Text-to-Speech**: Built-in pronunciation with US/UK accents
- **Audio Playback**: Native pronunciation when available
- **Speed Control**: Adjustable speech rate (0.5x - 1.5x)
- **Auto-play**: Optional automatic pronunciation

### 📊 Progress Analytics
- **Daily Stats**: Study time, words learned, accuracy tracking
- **Weekly Progress**: Visual charts and heat maps
- **Level System**: XP-based progression with achievements
- **Streak Counters**: Motivation through consistency

### 💾 Offline Capabilities
- **Local Database**: SQLite for word storage and progress
- **Dictionary Cache**: Offline API response caching
- **Audio Cache**: Downloaded pronunciations for offline use

## Technical Stack

### Frontend
- **React Native** with Expo
- **TypeScript** for type safety
- **Zustand** for state management
- **React Hook Form** for form handling

### Audio & Media
- **Expo AV** for audio playback
- **Expo Speech** for text-to-speech

### Data Management
- **Expo SQLite** for local database
- **AsyncStorage** for settings and cache
- **Free Dictionary API** for word definitions

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- Expo CLI
- iOS Simulator or Android Emulator

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm start
```

3. Run on your preferred platform:
```bash
npm run ios     # iOS Simulator
npm run android # Android Emulator
npm run web     # Web browser
```

## App Structure

### Screens
- **Dashboard**: Overview of progress and quick actions
- **Quiz**: Interactive learning with multiple question modes
- **Review**: Manage bookmarked and challenging words
- **Settings**: Customize learning goals and audio preferences

### Learning Modes
- **Random Quiz**: Mixed difficulty based on user level
- **Review Mode**: Focus on previously incorrect answers
- **Bookmarked**: Practice saved words
- **Challenge Mode**: Difficult words only

## Database Schema

### Words Table
- `id`: Primary key
- `word`: English word
- `definition`: Word definition
- `pronunciation`: Phonetic representation
- `difficulty`: 1-3 (Beginner to Advanced)
- `category`: Word category (general, academic, etc.)

### User Progress Table
- `word_id`: Foreign key to words
- `attempts`: Total practice attempts
- `correct_attempts`: Successful answers
- `mastery_level`: Percentage (0-100)
- `is_bookmarked`: User bookmarked status

### Study Sessions Table
- `date`: Session date
- `duration_minutes`: Study time
- `words_studied`: Number of words practiced
- `correct_answers`: Correct responses
- `total_questions`: Total questions answered

## Customization

### Adding New Words
Words can be added through the database service or by integrating with external word lists.

### Difficulty Levels
The app supports three difficulty levels with automatic progression based on user performance.

### Audio Settings
- Accent: American English (US) or British English (UK)
- Speed: 0.5x to 1.5x playback speed
- Volume: Adjustable audio levels
- Auto-play: Automatic pronunciation on new questions

## Performance Features

### Caching Strategy
- **Dictionary API**: 7-day cache for word definitions
- **Audio Files**: 30-day cache for pronunciations
- **Offline First**: Always check cache before API calls

### Database Optimization
- Indexed tables for fast queries
- Efficient word selection algorithms
- Spaced repetition scheduling

## Architecture

Built following the VocabMaster specification with:
- SQLite database for local storage
- Zustand for state management with persistence
- Dictionary API integration with offline caching
- Comprehensive audio system with Expo AV/Speech
- Visual progress tracking and analytics
- Responsive design for mobile devices

## License

This project is built as a learning application following the detailed VocabMaster specification.
