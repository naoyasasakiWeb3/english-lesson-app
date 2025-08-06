import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import Animated, { 
  FadeInDown, 
  FadeInUp 
} from 'react-native-reanimated';
import { ThemedText } from '../ThemedText';
import ModernCard from '../layout/ModernCard';
import ModernButton from '../modern/ModernButton';
import ApiKeyModal from '../ApiKeyModal';
import { useWordsApiKey } from '../../hooks/useWordsApi';
import { Spacing } from '../../constants/ModernColors';

interface ApiKeySetupScreenProps {
  onNext: () => void;
  onBack: () => void;
  onSkip: () => void;
  onApiKeyConfigured: (configured: boolean) => void;
}

export default function ApiKeySetupScreen({ 
  onNext, 
  onBack, 
  onSkip,
  onApiKeyConfigured 
}: ApiKeySetupScreenProps) {
  const [showApiModal, setShowApiModal] = useState(false);
  const { status } = useWordsApiKey();

  React.useEffect(() => {
    onApiKeyConfigured(status.configured);
  }, [status.configured, onApiKeyConfigured]);

  const handleSetupApiKey = () => {
    setShowApiModal(true);
  };

  const handleApiKeySuccess = () => {
    setShowApiModal(false);
    onApiKeyConfigured(true);
  };

  const handleContinue = () => {
    onNext();
  };

  const handleSkipApiSetup = () => {
    onApiKeyConfigured(false);
    onSkip();
  };

  return (
    <>
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        {/* Title Section */}
        <Animated.View 
          style={styles.titleSection}
          entering={FadeInUp.delay(200)}
        >
          <ThemedText style={styles.titleEmoji}>🔐</ThemedText>
          <ThemedText style={styles.title}>API Key Setup</ThemedText>
          <ThemedText style={styles.subtitle}>
            Enhance your learning with rich word data
          </ThemedText>
        </Animated.View>

        {/* API Status Card */}
        <Animated.View entering={FadeInDown.delay(400)}>
          <ModernCard 
            variant={status.configured ? 'success' : 'warning'} 
            pressable={false}
            delay={0}
          >
            <View style={styles.statusContent}>
              <ThemedText style={styles.statusEmoji}>
                {status.configured ? '✅' : '⚠️'}
              </ThemedText>
              <View style={styles.statusInfo}>
                <ThemedText style={styles.statusTitle}>
                  {status.configured ? 'API Key Configured' : 'API Key Not Set'}
                </ThemedText>
                <ThemedText style={styles.statusDescription}>
                  {status.configured 
                    ? 'You can access detailed word information including pronunciations, examples, and more.'
                    : 'Set up your Words API key to unlock detailed word information.'
                  }
                </ThemedText>
                {status.configured && (
                  <ThemedText style={styles.validationStatus}>
                    Status: {status.valid === true ? '✅ Valid' : status.valid === false ? '❌ Invalid' : '🔄 Checking...'}
                  </ThemedText>
                )}
              </View>
            </View>
          </ModernCard>
        </Animated.View>

        {/* Features Explanation */}
        <Animated.View entering={FadeInDown.delay(600)}>
          <ModernCard variant="primary" pressable={false} delay={0}>
            <ThemedText style={styles.sectionTitle}>
              🌟 What you get with API access:
            </ThemedText>
            
            <View style={styles.featuresList}>
              <View style={styles.featureItem}>
                <ThemedText style={styles.featureEmoji}>🔊</ThemedText>
                <View style={styles.featureContent}>
                  <ThemedText style={styles.featureTitle}>Pronunciations</ThemedText>
                  <ThemedText style={styles.featureDescription}>
                    Learn correct pronunciation for every word
                  </ThemedText>
                </View>
              </View>

              <View style={styles.featureItem}>
                <ThemedText style={styles.featureEmoji}>📝</ThemedText>
                <View style={styles.featureContent}>
                  <ThemedText style={styles.featureTitle}>Rich Definitions</ThemedText>
                  <ThemedText style={styles.featureDescription}>
                    Detailed explanations with multiple meanings
                  </ThemedText>
                </View>
              </View>

              <View style={styles.featureItem}>
                <ThemedText style={styles.featureEmoji}>📚</ThemedText>
                <View style={styles.featureContent}>
                  <ThemedText style={styles.featureTitle}>Example Sentences</ThemedText>
                  <ThemedText style={styles.featureDescription}>
                    See words used in context for better understanding
                  </ThemedText>
                </View>
              </View>

              <View style={styles.featureItem}>
                <ThemedText style={styles.featureEmoji}>🔗</ThemedText>
                <View style={styles.featureContent}>
                  <ThemedText style={styles.featureTitle}>Synonyms & Antonyms</ThemedText>
                  <ThemedText style={styles.featureDescription}>
                    Expand your vocabulary with related words
                  </ThemedText>
                </View>
              </View>
            </View>
          </ModernCard>
        </Animated.View>

        {/* Cost Information */}
        <Animated.View entering={FadeInDown.delay(800)}>
          <ModernCard variant="glass" pressable={false} glassEffect delay={0}>
            <ThemedText style={styles.sectionTitle}>💡 Good to know:</ThemedText>
            
            <View style={styles.infoList}>
              <ThemedText style={styles.infoItem}>
                🆓 <ThemedText style={styles.infoText}>Free tier includes 2,500 requests per month</ThemedText>
              </ThemedText>
              <ThemedText style={styles.infoItem}>
                🔒 <ThemedText style={styles.infoText}>Your API key is stored securely on your device</ThemedText>
              </ThemedText>
              <ThemedText style={styles.infoItem}>
                ⚡ <ThemedText style={styles.infoText}>The app works without API key, but with limited features</ThemedText>
              </ThemedText>
              <ThemedText style={styles.infoItem}>
                🔧 <ThemedText style={styles.infoText}>You can add or change your API key later in Settings</ThemedText>
              </ThemedText>
            </View>
          </ModernCard>
        </Animated.View>

        {/* Action Buttons */}
        <Animated.View 
          style={styles.actionsContainer}
          entering={FadeInDown.delay(1000)}
        >
          {!status.configured ? (
            <>
              <ModernButton
                title="Setup API Key"
                onPress={handleSetupApiKey}
                variant="primary"
                size="lg"
                icon="🔑"
                style={styles.primaryButton}
              />
              
              <ModernButton
                title="Skip for Now"
                onPress={handleSkipApiSetup}
                variant="secondary"
                size="md"
                style={styles.secondaryButton}
              />
            </>
          ) : (
            <>
              <ModernButton
                title="Continue"
                onPress={handleContinue}
                variant="success"
                size="lg"
                icon="✨"
                style={styles.primaryButton}
              />
              
              <ModernButton
                title="Reconfigure API Key"
                onPress={handleSetupApiKey}
                variant="neutral"
                size="md"
                style={styles.secondaryButton}
              />
            </>
          )}
          
          <ModernButton
            title="Back"
            onPress={onBack}
            variant="neutral"
            size="md"
            style={styles.backButton}
          />
        </Animated.View>
      </ScrollView>

      <ApiKeyModal
        visible={showApiModal}
        onClose={() => setShowApiModal(false)}
        onSuccess={handleApiKeySuccess}
        title="Setup Words API"
        skipable={false}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    flexGrow: 1,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  titleSection: {
    alignItems: 'center',
    paddingVertical: Spacing.lg,
  },
  titleEmoji: {
    fontSize: 48,
    marginBottom: Spacing.md,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    lineHeight: 22,
    fontWeight: '500',
  },
  statusContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  statusEmoji: {
    fontSize: 32,
    marginRight: Spacing.md,
  },
  statusInfo: {
    flex: 1,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: Spacing.xs,
  },
  statusDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 20,
    marginBottom: Spacing.xs,
    fontWeight: '400',
  },
  validationStatus: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: Spacing.md,
  },
  featuresList: {
    gap: Spacing.md,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  featureEmoji: {
    fontSize: 20,
    marginRight: Spacing.sm,
    marginTop: 2,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 2,
  },
  featureDescription: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 18,
    fontWeight: '400',
  },
  infoList: {
    gap: Spacing.sm,
  },
  infoItem: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 20,
    fontWeight: '600',
  },
  infoText: {
    fontWeight: '400',
  },
  actionsContainer: {
    marginTop: Spacing.xl,
    gap: Spacing.md,
  },
  primaryButton: {
    marginBottom: Spacing.sm,
  },
  secondaryButton: {
    marginBottom: Spacing.xs,
  },
  backButton: {
    opacity: 0.8,
  },
});