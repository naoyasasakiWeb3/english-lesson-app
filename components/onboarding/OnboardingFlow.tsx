import React, { useState } from 'react';
import {
  Modal,
  View,
  StyleSheet,
  Dimensions,
  StatusBar,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS
} from 'react-native-reanimated';
import PagerView from 'react-native-pager-view';
import { Spacing } from '../../constants/ModernColors';
import WelcomeScreen from './WelcomeScreen';
import CefrIntroScreen from './CefrIntroScreen';
import LevelSelectionScreen from './LevelSelectionScreen';
import ApiKeySetupScreen from './ApiKeySetupScreen';
import OnboardingCompleteScreen from './OnboardingCompleteScreen';
import OnboardingProgress from './OnboardingProgress';

const { width: screenWidth } = Dimensions.get('window');

interface OnboardingFlowProps {
  visible: boolean;
  onComplete: (data: OnboardingData) => void;
}

export interface OnboardingData {
  currentLevel: string;
  targetLevel: string;
  apiKeyConfigured: boolean;
  completedAt: Date;
}

const ONBOARDING_STEPS = [
  { id: 'welcome', title: 'Welcome', component: WelcomeScreen },
  { id: 'cefr-intro', title: 'CEFR Levels', component: CefrIntroScreen },
  { id: 'level-selection', title: 'Your Level', component: LevelSelectionScreen },
  { id: 'api-setup', title: 'API Setup', component: ApiKeySetupScreen },
  { id: 'complete', title: 'Ready!', component: OnboardingCompleteScreen },
];

export default function OnboardingFlow({ visible, onComplete }: OnboardingFlowProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [onboardingData, setOnboardingData] = useState<Partial<OnboardingData>>({});
  const pagerRef = React.useRef<PagerView>(null);
  
  const progress = useSharedValue(0);

  const updateProgress = (step: number) => {
    progress.value = withSpring((step / (ONBOARDING_STEPS.length - 1)) * 100);
  };

  const goToNextStep = () => {
    const nextStep = Math.min(currentStep + 1, ONBOARDING_STEPS.length - 1);
    setCurrentStep(nextStep);
    updateProgress(nextStep);
    pagerRef.current?.setPage(nextStep);
  };

  const goToPreviousStep = () => {
    const prevStep = Math.max(currentStep - 1, 0);
    setCurrentStep(prevStep);
    updateProgress(prevStep);
    pagerRef.current?.setPage(prevStep);
  };

  const skipToStep = (stepIndex: number) => {
    setCurrentStep(stepIndex);
    updateProgress(stepIndex);
    pagerRef.current?.setPage(stepIndex);
  };

  const updateOnboardingData = (data: Partial<OnboardingData>) => {
    setOnboardingData(prev => ({ ...prev, ...data }));
  };

  const handleComplete = () => {
    const finalData: OnboardingData = {
      currentLevel: onboardingData.currentLevel || 'A1',
      targetLevel: onboardingData.targetLevel || 'B2',
      apiKeyConfigured: onboardingData.apiKeyConfigured || false,
      completedAt: new Date(),
    };
    
    onComplete(finalData);
  };

  const handlePageSelected = (e: any) => {
    const page = e.nativeEvent.position;
    setCurrentStep(page);
    updateProgress(page);
  };

  React.useEffect(() => {
    if (visible) {
      updateProgress(0);
    }
  }, [visible]);

  if (!visible) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      animationType="fade"
      statusBarTranslucent
      presentationStyle="fullScreen"
    >
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <View style={styles.container}>
        <OnboardingProgress 
          progress={progress} 
          currentStep={currentStep}
          totalSteps={ONBOARDING_STEPS.length}
          stepTitles={ONBOARDING_STEPS.map(step => step.title)}
        />

        <PagerView
          ref={pagerRef}
          style={styles.pagerView}
          initialPage={0}
          onPageSelected={handlePageSelected}
          scrollEnabled={false} // Control navigation programmatically
        >
          <WelcomeScreen
            key="welcome"
            onNext={goToNextStep}
            onSkip={() => skipToStep(2)}
          />
          
          <CefrIntroScreen
            key="cefr-intro"
            onNext={goToNextStep}
            onBack={goToPreviousStep}
            onSkip={() => skipToStep(2)}
          />
          
          <LevelSelectionScreen
            key="level-selection"
            onNext={goToNextStep}
            onBack={goToPreviousStep}
            currentLevel={onboardingData.currentLevel}
            targetLevel={onboardingData.targetLevel}
            onLevelsSelected={(currentLevel, targetLevel) => 
              updateOnboardingData({ currentLevel, targetLevel })
            }
          />
          
          <ApiKeySetupScreen
            key="api-setup"
            onNext={goToNextStep}
            onBack={goToPreviousStep}
            onSkip={goToNextStep}
            onApiKeyConfigured={(configured) => 
              updateOnboardingData({ apiKeyConfigured: configured })
            }
          />
          
          <OnboardingCompleteScreen
            key="complete"
            onComplete={handleComplete}
            onBack={goToPreviousStep}
            onboardingData={onboardingData as OnboardingData}
          />
        </PagerView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a0b2e',
  },
  pagerView: {
    flex: 1,
  },
});