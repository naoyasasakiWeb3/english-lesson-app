import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  StyleSheet,
  Alert,
  Linking,
  KeyboardAvoidingView,
  Platform,
  ScrollView
} from 'react-native';
import { Spacing, BorderRadius } from '../constants/ModernColors';
import { ThemedText } from './ThemedText';
import ModernCard from './layout/ModernCard';
import ModernButton from './modern/ModernButton';
import { useWordsApiKey } from '../hooks/useWordsApi';
import ModernTextInput from './modern/ModernTextInput';

interface ApiKeyModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  title?: string;
  skipable?: boolean;
}

export default function ApiKeyModal({ 
  visible, 
  onClose, 
  onSuccess, 
  title = 'Words API Configuration',
  skipable = false 
}: ApiKeyModalProps) {
  const { status, setApiKey, removeApiKey, validateApiKey } = useWordsApiKey();
  const [inputKey, setInputKey] = useState('');
  const [isValidating, setIsValidating] = useState(false);

  useEffect(() => {
    if (!visible) {
      setInputKey('');
    }
  }, [visible]);

  const handleSetApiKey = async () => {
    if (!inputKey.trim()) {
      Alert.alert('Error', 'Please enter an API key');
      return;
    }

    setIsValidating(true);
    
    try {
      const success = await setApiKey(inputKey.trim());
      
      if (success) {
        Alert.alert(
          'Success!', 
          'API key has been configured and validated successfully.',
          [
            {
              text: 'OK',
              onPress: () => {
                onSuccess?.();
                onClose();
              }
            }
          ]
        );
      } else {
        Alert.alert(
          'Invalid API Key',
          'The provided API key is not valid. Please check your key and try again.'
        );
      }
    } catch (error) {
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Failed to set API key'
      );
    } finally {
      setIsValidating(false);
    }
  };

  const handleRemoveApiKey = () => {
    Alert.alert(
      'Remove API Key',
      'Are you sure you want to remove the configured API key? This will disable Words API features.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await removeApiKey();
              Alert.alert('Success', 'API key removed successfully');
            } catch (error) {
              Alert.alert('Error', 'Failed to remove API key');
            }
          }
        }
      ]
    );
  };

  const handleValidateApiKey = async () => {
    setIsValidating(true);
    try {
      const isValid = await validateApiKey();
      Alert.alert(
        isValid ? 'Valid API Key' : 'Invalid API Key',
        isValid 
          ? 'Your API key is working correctly!' 
          : 'Your API key is not working. Please check your configuration.'
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to validate API key');
    } finally {
      setIsValidating(false);
    }
  };

  const openRapidApiSignup = () => {
    Linking.openURL('https://rapidapi.com/dpventures/api/wordsapi/pricing');
  };

  const openApiDocsLink = () => {
    Linking.openURL('https://rapidapi.com/dpventures/api/wordsapi');
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView 
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={styles.header}>
            <ThemedText style={styles.title}>{title}</ThemedText>
            {skipable && (
              <ModernButton
                title="Skip"
                onPress={onClose}
                variant="neutral"
                size="sm"
                style={styles.skipButton}
              />
            )}
          </View>

          {/* API Status */}
          <ModernCard 
            variant={status.configured ? 'success' : 'warning'} 
            pressable={false}
            style={styles.statusCard}
          >
            <View style={styles.statusHeader}>
              <ThemedText style={styles.statusEmoji}>
                {status.configured ? '✅' : '⚠️'}
              </ThemedText>
              <ThemedText style={styles.statusTitle}>
                API Status: {status.configured ? 'Configured' : 'Not Configured'}
              </ThemedText>
            </View>
            
            {status.configured && (
              <View style={styles.statusDetails}>
                <ThemedText style={styles.statusText}>
                  Status: {status.valid === true ? '✅ Valid' : status.valid === false ? '❌ Invalid' : '🔄 Checking...'}
                </ThemedText>
                {status.error && (
                  <ThemedText style={styles.errorText}>
                    Error: {status.error}
                  </ThemedText>
                )}
              </View>
            )}
          </ModernCard>

          {/* Instructions */}
          <ModernCard variant="primary" pressable={false}>
            <ThemedText style={styles.sectionTitle}>📋 How to get your API key:</ThemedText>
            
            <View style={styles.instructionsList}>
              <ThemedText style={styles.instructionItem}>
                1. Go to RapidAPI and create a free account
              </ThemedText>
              <ThemedText style={styles.instructionItem}>
                2. Subscribe to the Words API (free tier available)
              </ThemedText>
              <ThemedText style={styles.instructionItem}>
                3. Copy your X-RapidAPI-Key from the dashboard
              </ThemedText>
              <ThemedText style={styles.instructionItem}>
                4. Paste it below and tap "Set API Key"
              </ThemedText>
            </View>

            <View style={styles.linkButtons}>
              <ModernButton
                title="Get API Key"
                onPress={openRapidApiSignup}
                variant="secondary"
                size="sm"
                icon="🔗"
                style={styles.linkButton}
              />
              <ModernButton
                title="API Docs"
                onPress={openApiDocsLink}
                variant="neutral"
                size="sm"
                icon="📖"
                style={styles.linkButton}
              />
            </View>
          </ModernCard>

          {/* API Key Input */}
          <ModernCard variant="neutral" pressable={false}>
            <ThemedText style={styles.sectionTitle}>🔑 Enter your API key:</ThemedText>
            
            <ModernTextInput
              value={inputKey}
              onChangeText={setInputKey}
              placeholder="Paste your RapidAPI key here..."
              secureTextEntry
              multiline={false}
              autoCapitalize="none"
              autoCorrect={false}
              style={styles.textInput}
            />

            <View style={styles.actionButtons}>
              <ModernButton
                title="Set API Key"
                onPress={handleSetApiKey}
                variant="success"
                size="lg"
                icon="💾"
                loading={isValidating}
                disabled={!inputKey.trim() || isValidating}
                style={styles.actionButton}
              />
            </View>
          </ModernCard>

          {/* Current API Key Actions */}
          {status.configured && (
            <ModernCard variant="error" pressable={false}>
              <ThemedText style={styles.sectionTitle}>⚙️ API Key Management:</ThemedText>
              
              <View style={styles.actionButtons}>
                <ModernButton
                  title="Validate Key"
                  onPress={handleValidateApiKey}
                  variant="secondary"
                  size="md"
                  icon="🔍"
                  loading={isValidating}
                  disabled={isValidating}
                  style={styles.actionButton}
                />
                
                <ModernButton
                  title="Remove Key"
                  onPress={handleRemoveApiKey}
                  variant="error"
                  size="md"
                  icon="🗑️"
                  disabled={isValidating}
                  style={styles.actionButton}
                />
              </View>
            </ModernCard>
          )}

          {/* Information */}
          <ModernCard variant="glass" pressable={false} glassEffect>
            <ThemedText style={styles.sectionTitle}>ℹ️ About Words API:</ThemedText>
            
            <ThemedText style={styles.infoText}>
              The Words API provides detailed word information including definitions, 
              pronunciations, synonyms, antonyms, and examples. This enhances your 
              learning experience with rich vocabulary data.
            </ThemedText>
            
            <ThemedText style={styles.infoText}>
              Free tier: 2,500 requests/month
            </ThemedText>
          </ModernCard>

          {/* Close Button */}
          <ModernButton
            title="Close"
            onPress={onClose}
            variant="neutral"
            size="lg"
            style={styles.closeButton}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a0b2e',
  },
  scrollContainer: {
    flexGrow: 1,
    padding: Spacing.lg,
    paddingTop: Spacing.xl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#ffffff',
    textAlign: 'center',
    flex: 1,
  },
  skipButton: {
    minWidth: 80,
  },
  statusCard: {
    marginBottom: Spacing.lg,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  statusEmoji: {
    fontSize: 24,
    marginRight: Spacing.sm,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
  },
  statusDetails: {
    marginTop: Spacing.xs,
  },
  statusText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: Spacing.xs,
    fontWeight: '500',
  },
  errorText: {
    fontSize: 14,
    color: '#ff6b6b',
    fontWeight: '500',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: Spacing.md,
  },
  instructionsList: {
    marginBottom: Spacing.lg,
  },
  instructionItem: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: Spacing.sm,
    lineHeight: 24,
    fontWeight: '400',
  },
  linkButtons: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  linkButton: {
    flex: 1,
  },
  textInput: {
    marginBottom: Spacing.lg,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    color: '#ffffff',
    fontSize: 16,
    minHeight: 50,
  },
  actionButtons: {
    gap: Spacing.sm,
  },
  actionButton: {
    width: '100%',
  },
  infoText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 24,
    marginBottom: Spacing.sm,
    fontWeight: '400',
  },
  closeButton: {
    marginTop: Spacing.xl,
    marginBottom: Spacing.xl,
  },
});