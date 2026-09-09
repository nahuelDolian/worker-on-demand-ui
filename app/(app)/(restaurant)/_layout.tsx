import { Redirect, Tabs } from 'expo-router';
import { useSessionStore } from '../../../src/store/useSessionStore';

export default function RestaurantTabsLayout() {
  // Si un WORKER/ADMIN llega acá a mano (URL directa), lo mandamos a su propio home en vez de
  // dejarlo ver pantallas de restaurante que no le corresponden.
  const role = useSessionStore((state) => state.user?.role);
  if (role !== 'RESTAURANT') return <Redirect href="/" />;

  return (
    <Tabs screenOptions={{ headerTitleAlign: 'center' }}>
      {/* esenciales/05-dashboard-restaurante.md (2026-09-08): Home reemplaza a "Turnos" (que en
          realidad era directo el formulario de crear turno) como landing tab. Publicar turno
          sigue alcanzable desde acá o desde el botón del home. */}
      <Tabs.Screen name="index" options={{ title: 'Inicio' }} />
      <Tabs.Screen name="new-shift" options={{ title: 'Nuevo turno' }} />
      <Tabs.Screen name="profile" options={{ title: 'Perfil' }} />
    </Tabs>
  );
}
