import React, { useCallback, useState } from 'react';
import { Text, View } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { PrimaryButton } from '../../../components/ui/PrimaryButton';
import { getMercadoPagoAuthorizeUrl, MERCADOPAGO_MOBILE_REDIRECT_PATH } from '../../../api/workerOnboardingApi';
import { useOnboardingStore } from '../../../store/useOnboardingStore';
import { useSessionStore } from '../../../store/useSessionStore';

/**
 * Vínculo OAuth con Mercado Pago — reutilizado tal cual para WORKER y RESTAURANT (SPEC.md
 * Domain 1: "mandatory linking" para ambos roles, mismo flujo genérico del lado backend,
 * `MercadoPagoOAuthController`/`Service` no distinguen rol). Solo cambia el copy según para qué
 * usa cada rol el vínculo: el worker cobra (90% split), el restaurante autoriza los holds.
 */
export function MercadoPagoLinkStep() {
  // Corre autenticado (después del login) — el userId sale de la sesión.
  const userId = useSessionStore((state) => state.user?.id ?? null);
  const role = useSessionStore((state) => state.user?.role);
  const mercadoPagoLinked = useOnboardingStore((state) => state.mercadoPagoLinked);
  const setMercadoPagoLinked = useOnboardingStore((state) => state.setMercadoPagoLinked);
  const [error, setError] = useState<string | null>(null);
  const [isLinking, setIsLinking] = useState(false);

  const handleLinkPress = useCallback(async () => {
    if (!userId) {
      setError('Falta completar los pasos anteriores.');
      return;
    }

    setError(null);
    setIsLinking(true);

    try {
      const redirectUri = Linking.createURL(MERCADOPAGO_MOBILE_REDIRECT_PATH);
      const result = await WebBrowser.openAuthSessionAsync(getMercadoPagoAuthorizeUrl(userId), redirectUri);

      if (result.type === 'success') {
        const { queryParams } = Linking.parse(result.url);
        if (queryParams?.status === 'success') {
          setMercadoPagoLinked(true);
        } else {
          setError('Mercado Pago rechazó la vinculación. Intentá de nuevo.');
        }
      }
    } catch {
      setError('No pudimos abrir Mercado Pago. Revisá tu conexión e intentá de nuevo.');
    } finally {
      setIsLinking(false);
    }
  }, [userId, setMercadoPagoLinked]);

  const subtitle =
    role === 'RESTAURANT'
      ? 'Lo necesitamos para autorizar el hold de cada turno que publiques y liberar el pago al trabajador cuando termine.'
      : 'Vas a cobrar tus turnos directamente en tu cuenta de Mercado Pago apenas se liquide el pago.';

  return (
    <View className="flex-1 px-5">
      <Text className="mb-1 text-2xl font-bold text-neutral-900">Vinculá tu cuenta de Mercado Pago</Text>
      <Text className="mb-6 text-base text-neutral-500">{subtitle}</Text>

      {mercadoPagoLinked ? (
        <View accessibilityRole="alert" className="mb-6 rounded-xl bg-emerald-50 p-4">
          <Text className="font-medium text-emerald-700">¡Tu cuenta de Mercado Pago quedó vinculada!</Text>
        </View>
      ) : null}

      {error ? (
        <Text accessibilityRole="alert" className="mb-4 text-sm text-red-600">
          {error}
        </Text>
      ) : null}

      <PrimaryButton
        label={mercadoPagoLinked ? 'Volver a vincular' : 'Vincular con Mercado Pago'}
        onPress={handleLinkPress}
        loading={isLinking}
        accessibilityHint="Abre el navegador para autorizar a Mercado Pago"
      />
    </View>
  );
}
