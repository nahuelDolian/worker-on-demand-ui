import { SafeAreaView } from 'react-native-safe-area-context';
import { MercadoPagoLinkStep } from '../../../src/screens/onboarding/steps/MercadoPagoLinkStep';

export default function MercadoPagoLink() {
  return (
    <SafeAreaView className="flex-1 bg-white" edges={['bottom']}>
      <MercadoPagoLinkStep />
    </SafeAreaView>
  );
}
