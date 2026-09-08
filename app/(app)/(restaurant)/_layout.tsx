import { Redirect, Tabs } from 'expo-router';
import { useSessionStore } from '../../../src/store/useSessionStore';

export default function RestaurantTabsLayout() {
  // Si un WORKER/ADMIN llega acá a mano (URL directa), lo mandamos a su propio home en vez de
  // dejarlo ver pantallas de restaurante que no le corresponden.
  const role = useSessionStore((state) => state.user?.role);
  if (role !== 'RESTAURANT') return <Redirect href="/" />;

  return (
    <Tabs screenOptions={{ headerTitleAlign: 'center' }}>
      <Tabs.Screen name="shifts" options={{ title: 'Turnos' }} />
      <Tabs.Screen name="profile" options={{ title: 'Perfil' }} />
    </Tabs>
  );
}
