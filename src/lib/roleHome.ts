import type { StoredUser } from './secureSession';

/** A dónde entra cada rol después de loguearse — usado en 3 lugares (`app/index.tsx`,
 * `app/(auth)/_layout.tsx`, `LoginScreen`) que necesitan la misma decisión, para no repetirla.
 *
 * esenciales/04-app-worker-marketplace-turnos.md / esenciales/05-dashboard-restaurante.md
 * (2026-09-08): antes esto mandaba directo a Check-in (worker) o al form de crear turno
 * (restaurant) — cero contexto de qué estaba pasando. Ahora ambos entran por su home. */
export function roleHomeHref(role: StoredUser['role']): string {
  switch (role) {
    case 'RESTAURANT':
      return '/(app)/(restaurant)';
    case 'ADMIN':
      return '/(app)/admin-placeholder';
    case 'WORKER':
    default:
      return '/(app)/(tabs)';
  }
}
