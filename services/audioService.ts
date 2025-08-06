import AsyncStorage from '@react-native-async-storage/async-storage';
import { Audio } from 'expo-av';
import * as Speech from 'expo-speech';

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
  private sound: Audio.Sound | null = null;
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
      // Set audio mode for playback
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        staysActiveInBackground: false,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });
      console.log('Audio service initialized with expo-av');
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
        await this.sound.stopAsync();
        await this.sound.unloadAsync();
        this.sound = null;
      }

      // Check cache first
      const cachedAudio = await this.getCachedAudio(url);
      const audioUri = cachedAudio?.uri || url;

      // Create and load new sound with expo-av
      this.sound = new Audio.Sound();
      
      // Load the audio first
      const loadResult = await this.sound.loadAsync({ uri: audioUri });
      
      // Check if load was successful
      if (!loadResult.isLoaded) {
        throw new Error('Failed to load audio file');
      }
      
      // Set volume
      await this.sound.setVolumeAsync(this.settings.volume);
      
      // Play the audio
      await this.sound.playAsync();

      // Set up completion handler
      this.sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          this.sound?.stopAsync();
          this.sound?.unloadAsync();
          this.sound = null;
        }
      });

      // Cache the audio if it's from a URL
      if (!cachedAudio && url.startsWith('http')) {
        this.cacheAudio(url, audioUri);
      }

    } catch (error) {
      console.error('Error playing audio:', error);
      // Cleanup on error
      if (this.sound) {
        try {
          await this.sound.unloadAsync();
        } catch (cleanupError) {
          console.error('Error cleaning up sound:', cleanupError);
        }
        this.sound = null;
      }
      throw error; // Re-throw to be handled by caller
    }
  }

  async stopAudio(): Promise<void> {
    try {
      if (this.sound) {
        await this.sound.stopAsync();
        await this.sound.unloadAsync();
        this.sound = null;
      }
    } catch (error) {
      console.error('Error stopping audio:', error);
    }
  }

  async pauseAudio(): Promise<void> {
    try {
      if (this.sound) {
        await this.sound.pauseAsync();
      }
    } catch (error) {
      console.error('Error pausing audio:', error);
    }
  }

  async resumeAudio(): Promise<void> {
    try {
      if (this.sound) {
        await this.sound.playAsync();
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
    try {
      // audioUrlの有効性をチェック
      if (audioUrl && audioUrl.trim().length > 0 && audioUrl !== 'undefined' && this.isValidAudioUrl(audioUrl)) {
        // Try to play from audio URL first
        console.log(`Playing pronunciation from URL: ${audioUrl}`);
        await this.playAudioFromUrl(audioUrl);
      } else {
        // 無効なURLまたはURL無しの場合は直接Text-to-Speechを使用
        console.log(`Using text-to-speech for word: ${word} (URL: ${audioUrl || 'none'})`);
        await this.speakWord(word);
      }
    } catch (error) {
      console.warn(`Audio URL failed for "${word}", falling back to text-to-speech:`, error);
      // If audio URL fails, fallback to text-to-speech
      try {
        await this.speakWord(word);
      } catch (ttsError) {
        console.error('Text-to-speech also failed:', ttsError);
        throw ttsError;
      }
    }
  }

  // URLの有効性をチェックするヘルパーメソッド
  private isValidAudioUrl(url: string): boolean {
    try {
      // HTTPまたはHTTPS URLかチェック
      if (url.startsWith('http://') || url.startsWith('https://')) {
        new URL(url);
        return true;
      }
      
      // ローカルファイルパスの場合
      if (url.startsWith('file://') || url.startsWith('./') || url.startsWith('/')) {
        return true;
      }
      
      // 音声ファイル拡張子をチェック
      const audioExtensions = ['.mp3', '.wav', '.m4a', '.aac', '.ogg'];
      if (audioExtensions.some(ext => url.toLowerCase().includes(ext))) {
        return true;
      }
      
      // 上記のいずれでもない場合（例: "laɪv"のような発音記号）は無効
      return false;
    } catch {
      return false;
    }
  }

  // Batch pronunciation for quiz mode
  async preloadPronunciations(words: { word: string; audioUrl?: string }[]): Promise<void> {
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
