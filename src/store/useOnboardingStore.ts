import { create } from 'zustand';
import type { IdentityUploadValues, PersonalInfoValues } from '../screens/onboarding/schema';

export type OnboardingStep = 'personal-info' | 'identity-upload' | 'mercadopago-link';

interface OnboardingState {
  step: OnboardingStep;
  workerId: string | null;
  personalInfo: PersonalInfoValues | null;
  identityUpload: IdentityUploadValues | null;
  mercadoPagoLinked: boolean;
  setPersonalInfo: (values: PersonalInfoValues, workerId: string) => void;
  setIdentityUpload: (values: IdentityUploadValues) => void;
  setMercadoPagoLinked: (linked: boolean) => void;
  reset: () => void;
}

const initialState = {
  step: 'personal-info' as OnboardingStep,
  workerId: null,
  personalInfo: null,
  identityUpload: null,
  mercadoPagoLinked: false,
};

export const useOnboardingStore = create<OnboardingState>((set) => ({
  ...initialState,
  setPersonalInfo: (values, workerId) => set({ personalInfo: values, workerId, step: 'identity-upload' }),
  setIdentityUpload: (values) => set({ identityUpload: values, step: 'mercadopago-link' }),
  setMercadoPagoLinked: (linked) => set({ mercadoPagoLinked: linked }),
  reset: () => set(initialState),
}));
