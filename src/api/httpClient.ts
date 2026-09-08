import { useSessionStore } from '../store/useSessionStore';
import type { StoredUser } from '../lib/secureSession';

export const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:8080';

/**
 * Cliente HTTP centralizado (`esenciales/03-autenticacion-cliente.md`): agrega el header
 * `Authorization: Bearer` a cada request protegido, y maneja 401 → refresh → reintento en un
 * solo lugar en vez de repetirlo en cada función de `api/*.ts`.
 */

export interface BlockInfo {
  reasonCode: string;
  description: string;
  remediationHint: string;
  selfResolvable: boolean;
}

/** Error tipado con el `error` code estable que devuelve el backend (ver GlobalExceptionHandler),
 * para que las pantallas puedan matchear casos puntuales (`invalid_credentials`, `email_not_verified`, ...)
 * en vez de parsear mensajes de texto libre. */
export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly blockInfo?: BlockInfo;

  constructor(status: number, code: string, blockInfo?: BlockInfo) {
    super(code);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.blockInfo = blockInfo;
  }
}

/** Se lanza cuando un request protegido no se pudo autenticar ni siquiera después de refrescar
 * (no había refreshToken, o el refresh también falló). La sesión ya quedó limpiada en el store —
 * el layout raíz reacciona a `status === 'signed-out'` y redirige al login; esto es solo para que
 * la mutation que originó el request no quede "colgada" en loading. */
export class SessionExpiredError extends Error {
  constructor() {
    super('session_expired');
    this.name = 'SessionExpiredError';
  }
}

interface ApiFetchOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
  /** Rutas públicas (login, registro, verify-email, refresh) no adjuntan Bearer ni disparan refresh. */
  skipAuth?: boolean;
}

async function parseErrorBody(response: Response): Promise<{ code: string; blockInfo?: BlockInfo }> {
  try {
    const data = await response.json();
    if (data && typeof data.error === 'string') {
      if (data.error === 'account_blocked') {
        return {
          code: data.error,
          blockInfo: {
            reasonCode: data.reasonCode,
            description: data.description,
            remediationHint: data.remediationHint,
            selfResolvable: data.selfResolvable,
          },
        };
      }
      return { code: data.error };
    }
  } catch {
    // body no era JSON (ej. 500 con página de error de Tomcat) — cae al código genérico de abajo.
  }
  return { code: `http_${response.status}` };
}

async function rawRequest(path: string, options: ApiFetchOptions, accessToken: string | null): Promise<Response> {
  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;
  const headers: Record<string, string> = { ...(options.headers as Record<string, string>) };

  if (options.body !== undefined && !isFormData) {
    headers['Content-Type'] = 'application/json';
  }
  if (accessToken && !options.skipAuth) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  return fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
    body: isFormData ? (options.body as FormData) : options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });
}

// Single-flight: si varios requests reciben 401 en paralelo, todos esperan el mismo refresh
// en vez de disparar N llamadas a /api/auth/refresh (una de las cuales rotaría el token bajo los pies de las otras).
let inFlightRefresh: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  if (inFlightRefresh) return inFlightRefresh;

  inFlightRefresh = (async () => {
    const { refreshToken } = useSessionStore.getState();
    if (!refreshToken) return null;

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });
      if (!response.ok) return null;

      const data = await response.json();
      const nextUser: StoredUser = {
        id: data.user.id,
        fullName: data.user.fullName,
        email: data.user.email,
        role: data.user.role,
        blockInfo: data.user.blockInfo ?? null,
      };
      await useSessionStore.getState().setSession({
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        user: nextUser,
      });
      return data.accessToken as string;
    } catch {
      return null;
    }
  })();

  try {
    return await inFlightRefresh;
  } finally {
    inFlightRefresh = null;
  }
}

/**
 * `T = void` para respuestas 204 (sin body). Lanza `ApiError` para cualquier respuesta no-2xx que
 * sí trajo un `error` code, o `SessionExpiredError` si un 401 no se pudo resolver ni con refresh.
 */
export async function apiFetch<T = void>(path: string, options: ApiFetchOptions = {}): Promise<T> {
  const { accessToken } = useSessionStore.getState();
  let response = await rawRequest(path, options, accessToken);

  if (response.status === 401 && !options.skipAuth) {
    const newAccessToken = await refreshAccessToken();
    if (!newAccessToken) {
      await useSessionStore.getState().clear();
      throw new SessionExpiredError();
    }
    response = await rawRequest(path, options, newAccessToken);
  }

  if (!response.ok) {
    const { code, blockInfo } = await parseErrorBody(response);
    if (code === 'account_blocked' && blockInfo) {
      useSessionStore.getState().setBlockInfo(blockInfo);
    }
    throw new ApiError(response.status, code, blockInfo);
  }

  if (response.status === 204) {
    return undefined as T;
  }
  return (await response.json()) as T;
}
