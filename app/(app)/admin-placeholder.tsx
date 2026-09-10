import React from 'react';
import { Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PrimaryButton } from '../../src/components/ui/PrimaryButton';
import { logout as logoutRequest } from '../../src/api/authApi';
import { useSessionStore } from '../../src/store/useSessionStore';

/** No hay ninguna spec de panel ADMIN todavía (`extensiones/03-panel-administracion-ops.md`,
 * sin arrancar) — esto es solo para que un login ADMIN no caiga en las tabs de otro rol. */
export default function AdminPlaceholder() {
  const router = useRouter();
  const user = useSessionStore((state) => state.user);
  const refreshToken = useSessionStore((state) => state.refreshToken);
  const clear = useSessionStore((state) => state.clear);

  async function handleLogout() {
    if (refreshToken) await logoutRequest(refreshToken).catch(() => undefined);
    await clear();
    router.replace('/(auth)/login');
  }

  return (
    <SafeAreaView className="flex-1 bg-white px-5 pt-10" edges={['bottom']}>
      <View className="flex-1">
        <Text className="mb-2 text-2xl font-bold text-neutral-900">Hola, {user?.fullName ?? 'admin'}</Text>
        <Text className="text-base text-neutral-500">
          Todavía no hay una interfaz para el rol ADMIN en esta app. Usá Swagger (`/swagger-ui.html`) o el
          endpoint directo para operar mientras tanto.
        </Text>
      </View>
      <PrimaryButton label="Cerrar sesión" onPress={handleLogout} />
    </SafeAreaView>
  );
}
