import { Redirect } from 'expo-router';
import { useSessionStore } from '../src/store/useSessionStore';
import { roleHomeHref } from '../src/lib/roleHome';

/** Puerta de entrada única: para cuando llega acá, `RootLayout` ya garantizó que la sesión
 * terminó de hidratarse (nunca `status === 'loading'` en este punto). */
export default function Index() {
  const status = useSessionStore((state) => state.status);
  const role = useSessionStore((state) => state.user?.role);
  return <Redirect href={status === 'signed-in' && role ? roleHomeHref(role) : '/(auth)/login'} />;
}
