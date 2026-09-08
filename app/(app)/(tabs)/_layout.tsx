import { Redirect, Tabs } from 'expo-router';
import { useSessionStore } from '../../../src/store/useSessionStore';

export default function TabsLayout() {
  // Si un RESTAURANT/ADMIN llega acá a mano, lo mandamos a su propio home.
  const role = useSessionStore((state) => state.user?.role);
  if (role !== 'WORKER') return <Redirect href="/" />;

  return (
    <Tabs screenOptions={{ headerTitleAlign: 'center' }}>
      {/* Sin header nativo: CheckInScreen ya maneja su propia safe area para el banner
          sobre la cámara a pantalla completa — un header acá le agregaría espacio duplicado. */}
      <Tabs.Screen name="checkin" options={{ title: 'Check-in', headerShown: false }} />
      <Tabs.Screen name="profile" options={{ title: 'Perfil' }} />
    </Tabs>
  );
}
