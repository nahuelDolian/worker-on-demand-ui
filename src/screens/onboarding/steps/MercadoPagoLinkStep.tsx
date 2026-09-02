import React, { useCallback, useState } from 'react';
import { Text, View } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { PrimaryButton } from '../../../components/ui/PrimaryButton';
import { getMercadoPagoAuthorizeUrl, MERCADOPAGO_MOBILE_REDIRECT_PATH } from '../../../api/workerOnboardingApi';
import { useOnboardingStore } from '../../../store/useOnboardingStore';

export function MercadoPagoLinkStep() {
  const workerId = useOnboardingStore((state) => state.workerId);
  const mercadoPagoLinked = useOnboardingStore((state) => state.mercadoPagoLinked);
  const setMercadoPagoLinked = useOnboardingStore((state) => state.setMercadoPagoLinked);
  const [error, setError] = useState<string | null>(null);
  const [isLinking, setIsLinking] = useState(false);

  const handleLinkPress = useCallback(async () => {
    if (!workerId) {
      setError('Falta completar los pasos anteriores.');
      return;
    }

    setError(null);
    setIsLinking(true);

    try {
      const redirectUri = Linking.createURL(MERCADOPAGO_MOBILE_REDIRECT_PATH);
      const result = await WebBrowser.openAuthSessionAsync(getMercadoPagoAuthorizeUrl(workerId), redirectUri);

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
  }, [workerId, setMercadoPagoLinked]);

  return (
    <View className="flex-1 px-5">
      <Text className="mb-1 text-2xl font-bold text-neutral-900">Vinculá tu cuenta de Mercado Pago</Text>
      <Text className="mb-6 text-base text-neutral-500">
        Vas a cobrar tus turnos directamente en tu cuenta de Mercado Pago apenas se liquide el pago.
      </Text>

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
