import React from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StepProgressBar } from '../../components/ui/StepProgressBar';
import { useOnboardingStore } from '../../store/useOnboardingStore';
import { PersonalInfoStep } from './steps/PersonalInfoStep';
import { IdentityUploadStep } from './steps/IdentityUploadStep';
import { MercadoPagoLinkStep } from './steps/MercadoPagoLinkStep';

const STEP_ORDER = ['personal-info', 'identity-upload', 'mercadopago-link'] as const;
const STEP_LABELS = ['Datos personales', 'Verificación de identidad', 'Mercado Pago'];

export function WorkerOnboardingScreen() {
  const step = useOnboardingStore((state) => state.step);
  const currentStepIndex = STEP_ORDER.indexOf(step);

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top', 'bottom']}>
      <View className="pt-4">
        <StepProgressBar
          currentStepIndex={currentStepIndex}
          totalSteps={STEP_ORDER.length}
          stepLabels={STEP_LABELS}
        />
      </View>
      {step === 'personal-info' ? <PersonalInfoStep /> : null}
      {step === 'identity-upload' ? <IdentityUploadStep /> : null}
      {step === 'mercadopago-link' ? <MercadoPagoLinkStep /> : null}
    </SafeAreaView>
  );
}
