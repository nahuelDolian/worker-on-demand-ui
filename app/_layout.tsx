import '../global.css';
import React, { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { QueryClientProvider } from '@tanstack/react-query';
import { Slot } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { queryClient } from '../src/lib/queryClient';
import { useSessionStore } from '../src/store/useSessionStore';

/**
 * Root layout (`esenciales/02-navegacion-y-enrutamiento.md`): providers globales + el gate de
 * hidratación de sesión. Mientras `status === 'loading'` (leyendo el storage seguro) no se monta
 * ningún grupo de rutas todavía, para que `(auth)/_layout` y `(app)/_layout` decidan su redirect
 * ya con la sesión resuelta, nunca a mitad de camino.
 */
export default function RootLayout() {
  const status = useSessionStore((state) => state.status);
  const hydrate = useSessionStore((state) => state.hydrate);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        {status === 'loading' ? (
          <View className="flex-1 items-center justify-center bg-white">
            <ActivityIndicator />
          </View>
        ) : (
          <Slot />
        )}
        <StatusBar style="auto" />
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
