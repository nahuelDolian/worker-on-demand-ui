import { Redirect, Tabs } from 'expo-router';
import { useSessionStore } from '../../../src/store/useSessionStore';

export default function TabsLayout() {
  // Si un RESTAURANT/ADMIN llega acá a mano, lo mandamos a su propio home.
  const role = useSessionStore((state) => state.user?.role);
  if (role !== 'WORKER') return <Redirect href="/" />;

  return (
    <Tabs screenOptions={{ headerTitleAlign: 'center' }}>
      {/* esenciales/04-app-worker-marketplace-turnos.md (2026-09-08): Home reemplaza a Check-in
          como landing tab — antes el login caía directo en la cámara, sin contexto de qué estaba
          pasando. Check-in sigue alcanzable, ya no es lo primero que se ve. */}
      <Tabs.Screen name="index" options={{ title: 'Inicio' }} />
      <Tabs.Screen name="browse" options={{ title: 'Turnos' }} />
      {/* Sin header nativo: CheckInScreen ya maneja su propia safe area para el banner
          sobre la cámara a pantalla completa — un header acá le agregaría espacio duplicado. */}
      <Tabs.Screen name="checkin" options={{ title: 'Check-in', headerShown: false }} />
      <Tabs.Screen name="profile" options={{ title: 'Perfil' }} />
    </Tabs>
  );
}
