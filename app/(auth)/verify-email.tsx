import { SafeAreaView } from 'react-native-safe-area-context';
import { VerifyEmailScreen } from '../../src/screens/auth/VerifyEmailScreen';

export default function VerifyEmail() {
  return (
    <SafeAreaView className="flex-1 bg-white" edges={['bottom']}>
      <VerifyEmailScreen />
    </SafeAreaView>
  );
}
