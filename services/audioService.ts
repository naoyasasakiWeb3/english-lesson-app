import { Audio } from 'expo-audio';
import * as Speech from 'expo-speech';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AudioSettings {
  accent: 'us' | 'uk';
  speed: number; // 0.5 to 1.5
  autoPlay: boolean;
  volume: number; // 0 to 1
}

interface CachedAudio {
  uri: string;
  timestamp: number;
}

class AudioService {
  private sound: Audio.AudioPlayer | null = null;
  private readonly AUDIO_CACHE_PREFIX = 'audio_cache_';
  private readonly CACHE_EXPIRY = 30 * 24 * 60 * 60 * 1000; // 30 days
  private settings: AudioSettings = {
    accent: 'us',
    speed: 1.0,
    autoPlay: false,
    volume: 1.0,
  };

  constructor() {
    this.initializeAudio();
    this.loadSettings();
  }

  private async initializeAudio(): Promise<void> {
    try {
      // expo-audio has different initialization
      // Basic setup is automatic
      console.log('Audio service initialized');
    } catch (error) {
      console.error('Error initializing audio:', error);
    }
  }

  private async loadSettings(): Promise<void> {
    try {
      const savedSettings = await AsyncStorage.getItem('audio_settings');
      if (savedSettings) {
        this.settings = { ...this.settings, ...JSON.parse(savedSettings) };
      }
    } catch (error) {
      console.error('Error loading audio settings:', error);
    }
  }

  async saveSettings(newSettings: Partial<AudioSettings>): Promise<void> {
    try {
      this.settings = { ...this.settings, ...newSettings };
      await AsyncStorage.setItem('audio_settings', JSON.stringify(this.settings));
    } catch (error) {
      console.error('Error saving audio settings:', error);
    }
  }

  getSettings(): AudioSettings {
    return { ...this.settings };
  }

  // Text-to-Speech functionality
  async speakWord(text: string, options?: { 
    accent?: 'us' | 'uk'; 
    speed?: number; 
    onDone?: () => void 
  }): Promise<void> {
    try {
      // Stop any current speech
      await this.stopSpeech();

      const accent = options?.accent || this.settings.accent;
      const speed = options?.speed || this.settings.speed;

      // Configure speech options
      const speechOptions: Speech.SpeechOptions = {
        language: accent === 'us' ? 'en-US' : 'en-GB',
        pitch: 1.0,
        rate: speed,
        volume: this.settings.volume,
        onDone: options?.onDone,
        onError: (error) => {
          console.error('Speech error:', error);
        },
      };

      await Speech.speak(text, speechOptions);
    } catch (error) {
      console.error('Error speaking word:', error);
    }
  }

  async stopSpeech(): Promise<void> {
    try {
      await Speech.stop();
    } catch (error) {
      console.error('Error stopping speech:', error);
    }
  }

  // Audio file playback functionality
  async playAudioFromUrl(url: string): Promise<void> {
    try {
      // Stop previous sound
      if (this.sound) {
        await this.sound.remove();
        this.sound = null;
      }

      // Check cache first
      const cachedAudio = await this.getCachedAudio(url);
      const audioUri = cachedAudio?.uri || url;

      // Create and load new sound with expo-audio
      this.sound = new Audio.AudioPlayer(audioUri);
      
      // Set volume
      this.sound.volume = this.settings.volume;
      
      // Play the audio
      await this.sound.play();

      // Set up completion handler
      this.sound.addListener('playbackStatusUpdate', (status) => {
        if (status.didJustFinish) {
          this.sound?.remove();
          this.sound = null;
        }
      });

      // Cache the audio if it's from a URL
      if (!cachedAudio && url.startsWith('http')) {
        this.cacheAudio(url, audioUri);
      }

    } catch (error) {
      console.error('Error playing audio:', error);
    }
  }

  async stopAudio(): Promise<void> {
    try {
      if (this.sound) {
        await this.sound.stop();
        await this.sound.remove();
        this.sound = null;
      }
    } catch (error) {
      console.error('Error stopping audio:', error);
    }
  }

  async pauseAudio(): Promise<void> {
    try {
      if (this.sound) {
        await this.sound.pause();
      }
    } catch (error) {
      console.error('Error pausing audio:', error);
    }
  }

  async resumeAudio(): Promise<void> {
    try {
      if (this.sound) {
        await this.sound.play();
      }
    } catch (error) {
      console.error('Error resuming audio:', error);
    }
  }

  // Audio caching functionality
  private async getCacheKey(url: string): Promise<string> {
    // Create a simple hash of the URL for the cache key
    let hash = 0;
    for (let i = 0; i < url.length; i++) {
      const char = url.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return `${this.AUDIO_CACHE_PREFIX}${Math.abs(hash)}`;
  }

  private async getCachedAudio(url: string): Promise<CachedAudio | null> {
    try {
      const cacheKey = await this.getCacheKey(url);
      const cachedData = await AsyncStorage.getItem(cacheKey);
      
      if (!cachedData) return null;

      const parsed: CachedAudio = JSON.parse(cachedData);
      const now = Date.now();
      
      // Check if cache is expired
      if (now - parsed.timestamp > this.CACHE_EXPIRY) {
        await AsyncStorage.removeItem(cacheKey);
        return null;
      }

      return parsed;
    } catch (error) {
      console.error('Error reading audio cache:', error);
      return null;
    }
  }

  private async cacheAudio(url: string, uri: string): Promise<void> {
    try {
      const cacheKey = await this.getCacheKey(url);
      const cacheData: CachedAudio = {
        uri,
        timestamp: Date.now(),
      };
      
      await AsyncStorage.setItem(cacheKey, JSON.stringify(cacheData));
    } catch (error) {
      console.error('Error caching audio:', error);
    }
  }

  // Pronunciation helper methods
  async playWordPronunciation(word: string, audioUrl?: string): Promise<void> {
    if (audioUrl) {
      await this.playAudioFromUrl(audioUrl);
    } else {
      // Fallback to text-to-speech
      await this.speakWord(word);
    }
  }

  // Batch pronunciation for quiz mode
  async preloadPronunciations(words: Array<{ word: string; audioUrl?: string }>): Promise<void> {
    console.log(`Preloading pronunciations for ${words.length} words...`);
    
    for (const { word, audioUrl } of words) {
      try {
        if (audioUrl) {
          // Just cache the audio URL, don't play it
          await this.getCachedAudio(audioUrl);
        }
        // Small delay to avoid overwhelming the system
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.error(`Failed to preload pronunciation for ${word}:`, error);
      }
    }
  }

  // Cleanup methods
  async clearAudioCache(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith(this.AUDIO_CACHE_PREFIX));
      await AsyncStorage.multiRemove(cacheKeys);
      console.log(`Cleared ${cacheKeys.length} cached audio files`);
    } catch (error) {
      console.error('Error clearing audio cache:', error);
    }
  }

  async getAudioCacheStats(): Promise<{ count: number; size: string }> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith(this.AUDIO_CACHE_PREFIX));
      
      let totalSize = 0;
      for (const key of cacheKeys) {
        const data = await AsyncStorage.getItem(key);
        if (data) {
          totalSize += data.length;
        }
      }
      
      const sizeInKB = (totalSize / 1024).toFixed(2);
      
      return {
        count: cacheKeys.length,
        size: `${sizeInKB} KB`
      };
    } catch (error) {
      console.error('Error getting audio cache stats:', error);
      return { count: 0, size: '0 KB' };
    }
  }

  // Cleanup on app termination
  async cleanup(): Promise<void> {
    try {
      await this.stopAudio();
      await this.stopSpeech();
    } catch (error) {
      console.error('Error during audio cleanup:', error);
    }
  }
}

export const audioService = new AudioService();

// Export types for use in components
export type { AudioSettings };