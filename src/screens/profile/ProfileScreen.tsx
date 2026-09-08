import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { PrimaryButton } from '../../components/ui/PrimaryButton';
import { logout as logoutRequest } from '../../api/authApi';
import { useSessionStore } from '../../store/useSessionStore';
import { useOnboardingStore } from '../../store/useOnboardingStore';

const ROLE_LABEL: Record<string, string> = {
  WORKER: 'Trabajador',
  RESTAURANT: 'Restaurante',
  ADMIN: 'Administrador',
};

/**
 * No hay todavía spec de "perfil editable" (`extensiones/01-perfil-trabajador-editable.md`, fuera
 * de alcance acá) — esta pantalla es la mínima necesaria para que el logout y el resto del
 * onboarding (identidad + Mercado Pago, que ahora corren autenticados) tengan un lugar desde
 * donde llegar.
 */
export function ProfileScreen() {
  const router = useRouter();
  const user = useSessionStore((state) => state.user);
  const refreshToken = useSessionStore((state) => state.refreshToken);
  const clear = useSessionStore((state) => state.clear);
  const identityUploaded = useOnboardingStore((state) => state.identityUpload !== null);
  const mercadoPagoLinked = useOnboardingStore((state) => state.mercadoPagoLinked);
  const isRestaurant = user?.role === 'RESTAURANT';

  async function handleLogout() {
    if (refreshToken) {
      await logoutRequest(refreshToken).catch(() => undefined);
    }
    await clear();
    router.replace('/(auth)/login');
  }

  return (
    <ScrollView className="flex-1 bg-white px-5 pt-6">
      <Text className="mb-1 text-2xl font-bold text-neutral-900">{user?.fullName ?? 'Mi cuenta'}</Text>
      <Text className="mb-1 text-base text-neutral-500">{user?.email}</Text>
      <Text className="mb-8 text-sm text-neutral-400">{user ? ROLE_LABEL[user.role] : ''}</Text>

      <Text className="mb-2 text-sm font-medium text-neutral-700">Verificación de cuenta</Text>
      {isRestaurant ? null : (
        <ProfileRow
          title="Verificación de identidad"
          subtitle={identityUploaded ? 'Documentos enviados' : 'Subí tu DNI y una selfie'}
          onPress={() => router.push('/(app)/onboarding/identity')}
        />
      )}
      <ProfileRow
        title="Mercado Pago"
        subtitle={
          mercadoPagoLinked
            ? 'Cuenta vinculada'
            : isRestaurant
              ? 'Vinculá tu cuenta para poder publicar turnos'
              : 'Vinculá tu cuenta para poder cobrar'
        }
        onPress={() => router.push('/(app)/onboarding/mercadopago')}
      />

      <View className="mt-8">
        <PrimaryButton label="Cerrar sesión" onPress={handleLogout} />
      </View>
    </ScrollView>
  );
}

function ProfileRow({ title, subtitle, onPress }: { title: string; subtitle: string; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      className="mb-3 rounded-xl border border-neutral-200 px-4 py-3"
    >
      <Text className="text-base font-medium text-neutral-900">{title}</Text>
      <Text className="mt-0.5 text-sm text-neutral-500">{subtitle}</Text>
    </Pressable>
  );
}
