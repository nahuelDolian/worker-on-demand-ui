import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

/**
 * Encapsula el guardado/lectura/borrado de la sesión en el almacenamiento seguro del SO
 * (Keychain en iOS, Keystore-backed en Android) — `seguridad/01-almacenamiento-seguro-sesion.md`.
 * Guarda el bundle completo que devuelve login/refresh (tokens + user) para poder hidratar la
 * sesión al abrir la app sin pegarle a ningún endpoint extra.
 *
 * `expo-secure-store` no tiene implementación en web (decisión explícita, fuera de alcance de
 * este incremento: la sesión no persiste entre recargas de página en web, pero el login sigue
 * funcionando durante esa sesión de navegador). Cada función es un no-op seguro en esa plataforma.
 */

const STORAGE_KEY = 'wod.session.v1';

export interface StoredUser {
  id: string;
  fullName: string | null;
  email: string;
  role: 'WORKER' | 'RESTAURANT' | 'ADMIN';
  blockInfo: {
    reasonCode: string;
    description: string;
    remediationHint: string;
    selfResolvable: boolean;
  } | null;
}

export interface StoredSession {
  accessToken: string;
  refreshToken: string;
  user: StoredUser;
}

const isWeb = Platform.OS === 'web';

export async function saveSession(session: StoredSession): Promise<void> {
  if (isWeb) return;
  await SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify(session));
}

export async function loadSession(): Promise<StoredSession | null> {
  if (isWeb) return null;
  const raw = await SecureStore.getItemAsync(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StoredSession;
  } catch {
    // Contenido corrupto/de un formato viejo — mejor tratarlo como "sin sesión" que romper el arranque.
    await clearSession();
    return null;
  }
}

export async function clearSession(): Promise<void> {
  if (isWeb) return;
  await SecureStore.deleteItemAsync(STORAGE_KEY);
}
