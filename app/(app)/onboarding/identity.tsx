import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IdentityUploadStep } from '../../../src/screens/onboarding/steps/IdentityUploadStep';

export default function IdentityUpload() {
  const router = useRouter();
  return (
    <SafeAreaView className="flex-1 bg-white" edges={['bottom']}>
      <IdentityUploadStep onDone={() => router.back()} />
    </SafeAreaView>
  );
}
