import { create } from 'zustand';
import { clearSession, loadSession, saveSession, StoredSession, StoredUser } from '../lib/secureSession';

/**
 * `loading`: todavía no se leyó el storage seguro (splash/arranque).
 * `signed-out`: no hay sesión válida — mostrar el stack de auth.
 * `signed-in`: hay accessToken/refreshToken/user — mostrar el área autenticada.
 */
export type SessionStatus = 'loading' | 'signed-out' | 'signed-in';

interface SessionState {
  status: SessionStatus;
  accessToken: string | null;
  refreshToken: string | null;
  user: StoredUser | null;
  /** Hidrata el estado desde el storage seguro al abrir la app. Se llama una sola vez, desde el root layout. */
  hydrate: () => Promise<void>;
  /** Login/registro de refresh exitoso: persiste y actualiza el estado en memoria. */
  setSession: (session: StoredSession) => Promise<void>;
  /** Logout, o refresh fallido: borra todo, local y en el storage seguro. */
  clear: () => Promise<void>;
  /**
   * Actualiza solo `blockInfo` del user en memoria (no persiste un round-trip completo) — usado
   * por el cliente HTTP cuando cualquier acción devuelve `error: "account_blocked"`, para que la
   * pantalla de bloqueo se muestre sin depender de que haya sido el login el que lo informó.
   */
  setBlockInfo: (blockInfo: StoredUser['blockInfo']) => void;
}

export const useSessionStore = create<SessionState>((set, get) => ({
  status: 'loading',
  accessToken: null,
  refreshToken: null,
  user: null,

  hydrate: async () => {
    const stored = await loadSession();
    if (stored) {
      set({
        status: 'signed-in',
        accessToken: stored.accessToken,
        refreshToken: stored.refreshToken,
        user: stored.user,
      });
    } else {
      set({ status: 'signed-out', accessToken: null, refreshToken: null, user: null });
    }
  },

  setSession: async (session) => {
    await saveSession(session);
    set({
      status: 'signed-in',
      accessToken: session.accessToken,
      refreshToken: session.refreshToken,
      user: session.user,
    });
  },

  clear: async () => {
    await clearSession();
    set({ status: 'signed-out', accessToken: null, refreshToken: null, user: null });
  },

  setBlockInfo: (blockInfo) => {
    const { user } = get();
    if (!user) return;
    set({ user: { ...user, blockInfo } });
  },
}));
