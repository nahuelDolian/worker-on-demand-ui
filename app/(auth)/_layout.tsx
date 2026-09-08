import { Redirect, Stack } from 'expo-router';
import { useSessionStore } from '../../src/store/useSessionStore';
import { roleHomeHref } from '../../src/lib/roleHome';

/** Stack público: registro → verificación de email → login. Si ya hay sesión (ej. se abrió la
 * app con un refreshToken todavía válido), no tiene sentido mostrar estas pantallas. */
export default function AuthLayout() {
  const status = useSessionStore((state) => state.status);
  const role = useSessionStore((state) => state.user?.role);
  if (status === 'signed-in' && role) return <Redirect href={roleHomeHref(role)} />;

  return (
    <Stack screenOptions={{ headerBackTitle: 'Atrás', headerTitleAlign: 'center' }}>
      <Stack.Screen name="login" options={{ title: 'Ingresar' }} />
      <Stack.Screen name="register" options={{ title: 'Crear cuenta' }} />
      <Stack.Screen name="verify-email" options={{ title: 'Verificar email' }} />
    </Stack>
  );
}
