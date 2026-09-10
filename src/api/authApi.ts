import { apiFetch } from './httpClient';
import type { StoredSession, StoredUser } from '../lib/secureSession';

/** Contrato de API: `worker-on-demand/DOCS/specs/esenciales/01-autenticacion-autorizacion.md`
 * (backend, ya implementado) + `DOCS/specs/esenciales/03-autenticacion-cliente.md` (este repo). */

interface UserResponseDto {
  id: string;
  fullName: string | null;
  email: string;
  role: 'WORKER' | 'RESTAURANT' | 'ADMIN';
  blockInfo: StoredUser['blockInfo'];
}

interface TokenResponseDto {
  accessToken: string;
  refreshToken: string;
  expiresInSeconds: number;
  user: UserResponseDto;
}

function toSession(dto: TokenResponseDto): StoredSession {
  return {
    accessToken: dto.accessToken,
    refreshToken: dto.refreshToken,
    user: dto.user,
  };
}

export interface RegisterWorkerPayload {
  fullName: string;
  email: string;
  cuitCuil: string;
  password: string;
  skills: string[];
}

/** `POST /api/workers` — 201, deja la cuenta con `emailVerified=false` y dispara el código de verificación. */
export async function registerWorker(payload: RegisterWorkerPayload): Promise<UserResponseDto> {
  return apiFetch<UserResponseDto>('/api/workers', { method: 'POST', body: payload, skipAuth: true });
}

export interface RegisterRestaurantPayload {
  fullName: string;
  email: string;
  cuitCuil: string;
  password: string;
}

/** `POST /api/restaurants` — mismo flujo que `registerWorker`, sin `skills` (SPEC.md Domain 1 B2B). */
export async function registerRestaurant(payload: RegisterRestaurantPayload): Promise<UserResponseDto> {
  return apiFetch<UserResponseDto>('/api/restaurants', { method: 'POST', body: payload, skipAuth: true });
}

/** `POST /api/auth/verify-email` — 204. `ApiError.code` puede ser `invalid_or_expired_verification_code` o `email_already_verified`. */
export async function verifyEmail(email: string, code: string): Promise<void> {
  return apiFetch<void>('/api/auth/verify-email', { method: 'POST', body: { email, code }, skipAuth: true });
}

/** `POST /api/auth/resend-verification-code` — siempre 202, nunca revela si el email existe. */
export async function resendVerificationCode(email: string): Promise<void> {
  return apiFetch<void>('/api/auth/resend-verification-code', { method: 'POST', body: { email }, skipAuth: true });
}

/** `POST /api/auth/login` — `ApiError.code` puede ser `invalid_credentials` (401) o `email_not_verified` (403). */
export async function login(email: string, password: string): Promise<StoredSession> {
  const dto = await apiFetch<TokenResponseDto>('/api/auth/login', {
    method: 'POST',
    body: { email, password },
    skipAuth: true,
  });
  return toSession(dto);
}

/** `POST /api/auth/logout` — siempre 204 (revocación idempotente), no hace falta chequear el resultado. */
export async function logout(refreshToken: string): Promise<void> {
  return apiFetch<void>('/api/auth/logout', { method: 'POST', body: { refreshToken }, skipAuth: true });
}

/** `POST /api/auth/logout-all` (seguridad/03-gestion-sesiones-tokens.md) — a diferencia de `logout`,
 * requiere sesión activa (la identidad sale del Bearer, no de un refreshToken en el body). Cierra
 * todas las sesiones del caller, no solo la de este dispositivo. */
export async function logoutAllSessions(): Promise<void> {
  return apiFetch<void>('/api/auth/logout-all', { method: 'POST' });
}
