import type { StoredUser } from './secureSession';

/** A dónde entra cada rol después de loguearse — usado en 3 lugares (`app/index.tsx`,
 * `app/(auth)/_layout.tsx`, `LoginScreen`) que necesitan la misma decisión, para no repetirla. */
export function roleHomeHref(role: StoredUser['role']): string {
  switch (role) {
    case 'RESTAURANT':
      return '/(app)/(restaurant)/shifts';
    case 'ADMIN':
      return '/(app)/admin-placeholder';
    case 'WORKER':
    default:
      return '/(app)/(tabs)/checkin';
  }
}
