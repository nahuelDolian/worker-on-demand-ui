import { Redirect, Stack } from 'expo-router';
import { useSessionStore } from '../../src/store/useSessionStore';
import { BlockedAccountScreen } from '../../src/screens/auth/BlockedAccountScreen';

/**
 * Guard del área autenticada (`esenciales/03-autenticacion-cliente.md`, último criterio: "las
 * pantallas protegidas verifican la sesión antes de renderizar contenido"):
 * - Sin sesión → redirect a login.
 * - Con `blockInfo` no nulo → se reemplaza todo el contenido por la pantalla de cuenta bloqueada,
 *   sin importar a qué ruta se intentaba entrar (login sigue funcionando estando bloqueado, spec
 *   01 decisión de negocio #3; lo que no se muestra es el resto de la app hasta resolverlo).
 * `(tabs)`/`(restaurant)` son el home autenticado de cada rol (WORKER/RESTAURANT respectivamente
 * — cada `_layout` interno redirige si el rol no matchea, ver esos archivos); `onboarding/*` son
 * pantallas que se empujan por encima (con back nativo) en vez de vivir como tabs, compartidas
 * por ambos roles — `mercadopago` es el mismo vínculo OAuth genérico para cualquiera de los dos
 * (SPEC.md Domain 1), `identity` es solo del lado worker pero no hace falta bloquearla acá,
 * `ProfileScreen` ya no la ofrece a un RESTAURANT.
 */
export default function AppLayout() {
  const status = useSessionStore((state) => state.status);
  const blockInfo = useSessionStore((state) => state.user?.blockInfo);

  if (status !== 'signed-in') return <Redirect href="/(auth)/login" />;
  if (blockInfo) return <BlockedAccountScreen />;

  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="(restaurant)" options={{ headerShown: false }} />
      <Stack.Screen name="admin-placeholder" options={{ headerShown: false }} />
      <Stack.Screen name="onboarding/identity" options={{ title: 'Verificación de identidad' }} />
      <Stack.Screen name="onboarding/mercadopago" options={{ title: 'Mercado Pago' }} />
    </Stack>
  );
}
