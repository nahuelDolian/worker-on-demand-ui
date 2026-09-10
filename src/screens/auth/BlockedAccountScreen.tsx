import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { PrimaryButton } from '../../components/ui/PrimaryButton';
import { logout as logoutRequest } from '../../api/authApi';
import { useSessionStore } from '../../store/useSessionStore';

/**
 * `blockInfo` no nulo (login) o `error === "account_blocked"` (cualquier acción) — spec 01
 * decisión de negocio #3: estar bloqueado NO impide loguearse, solo se explica el motivo acá.
 * Hoy los dos motivos existentes (`SETTLEMENT_FAILURE`, `ADMIN_MANUAL`) son siempre
 * `selfResolvable: false`, así que la única acción disponible es cerrar sesión / contactar soporte.
 */
export function BlockedAccountScreen() {
  const router = useRouter();
  const user = useSessionStore((state) => state.user);
  const refreshToken = useSessionStore((state) => state.refreshToken);
  const clear = useSessionStore((state) => state.clear);

  async function handleLogout() {
    if (refreshToken) {
      await logoutRequest(refreshToken).catch(() => undefined); // logout es idempotente/siempre 204 — un fallo de red no debería trabar el logout local.
    }
    await clear();
    router.replace('/(auth)/login');
  }

  const blockInfo = user?.blockInfo;

  return (
    <ScrollView className="flex-1 px-5 pt-10" contentContainerStyle={{ flexGrow: 1 }}>
      <View className="flex-1">
        <Text className="mb-2 text-2xl font-bold text-neutral-900">Tu cuenta está bloqueada</Text>
        <Text className="mb-6 text-base text-neutral-600">
          {blockInfo?.description ?? 'Tu cuenta quedó bloqueada preventivamente.'}
        </Text>

        <View className="mb-6 rounded-xl bg-amber-50 p-4">
          <Text className="text-sm font-medium text-amber-800">¿Qué podés hacer?</Text>
          <Text className="mt-1 text-sm text-amber-700">
            {blockInfo?.remediationHint ?? 'Contactá a soporte de Worker On Demand para más información.'}
          </Text>
        </View>
      </View>

      <PrimaryButton label="Cerrar sesión" onPress={handleLogout} />
    </ScrollView>
  );
}
