import React from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

/**
 * Ruta que recibe el 302 del backend después del callback de MP (`MERCADOPAGO_MOBILE_REDIRECT_URL`,
 * `esenciales/01-cierre-oauth-mercadopago-deeplink.md`). En la práctica, `WebBrowser.openAuthSessionAsync`
 * (llamado desde `MercadoPagoLinkStep`, en la pestaña/ventana que abrió este popup) detecta la
 * navegación acá mismo y cierra el popup solo — este contenido solo llega a verse si eso tarda o
 * no ocurre, así que no deja a alguien mirando una pantalla en blanco sin explicación.
 */
export default function MercadoPagoOAuthCallback() {
  const { status } = useLocalSearchParams<{ status?: string; reason?: string }>();

  return (
    <View className="flex-1 items-center justify-center bg-white px-6">
      <ActivityIndicator className="mb-4" />
      <Text className="text-center text-base text-neutral-700">
        {status === 'success'
          ? 'Cuenta de Mercado Pago vinculada. Ya podés cerrar esta pestaña.'
          : 'Volviendo a la app...'}
      </Text>
    </View>
  );
}
