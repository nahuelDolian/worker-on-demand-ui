import React from 'react';
import { ScrollView, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PrimaryButton } from '../../src/components/ui/PrimaryButton';
import { SkillEmojiAdminScreen } from '../../src/screens/admin/SkillEmojiAdminScreen';
import { logout as logoutRequest } from '../../src/api/authApi';
import { useSessionStore } from '../../src/store/useSessionStore';

/**
 * extensiones/08-emojis-configurables-por-skill.md: primera pieza real de interfaz ADMIN — el
 * resto del panel (`extensiones/03-panel-administracion-ops.md` del backend) sigue sin arrancar,
 * ver nota cruzada agregada ahí. Nombre de archivo se mantiene por ahora (ruta ya registrada);
 * el nombre deja de describir el contenido, pero renombrarla es un cambio de ruta aparte, no de
 * esta spec.
 */
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
      <ScrollView className="flex-1" keyboardShouldPersistTaps="handled">
        <Text className="mb-4 text-2xl font-bold text-neutral-900">Hola, {user?.fullName ?? 'admin'}</Text>
        <SkillEmojiAdminScreen />
      </ScrollView>
      <PrimaryButton label="Cerrar sesión" onPress={handleLogout} />
    </SafeAreaView>
  );
}
