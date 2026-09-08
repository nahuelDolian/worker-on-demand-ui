import { SafeAreaView } from 'react-native-safe-area-context';
import { LoginScreen } from '../../src/screens/auth/LoginScreen';

export default function Login() {
  return (
    <SafeAreaView className="flex-1 bg-white" edges={['bottom']}>
      <LoginScreen />
    </SafeAreaView>
  );
}
