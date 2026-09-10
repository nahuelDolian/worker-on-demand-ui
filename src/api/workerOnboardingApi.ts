import { Platform } from 'react-native';
import { apiFetch, API_BASE_URL } from './httpClient';
import type { IdentityUploadValues } from '../screens/onboarding/schema';

/**
 * El registro (`registerWorker`) vive en `authApi.ts` — es parte del contrato de auth
 * (`esenciales/03-autenticacion-cliente.md`), no de este módulo.
 */

/**
 * `POST /api/workers/{workerId}/identity-documents` — requiere estar autenticado como ese mismo
 * `workerId` (WORKER); `apiFetch` adjunta el Bearer automáticamente. 204 en éxito.
 */
export interface WorkerProfileSummaryDto {
  skills: string[];
  trustScore: number;
  dniVerified: boolean;
}

/** `GET /api/workers/me` — esenciales/04-app-worker-marketplace-turnos.md, segunda vuelta.
 * Nunca incluye URLs de documentos (ADR-0001, mismo criterio que /identity-documents). */
export async function getMyWorkerProfile(): Promise<WorkerProfileSummaryDto> {
  return apiFetch<WorkerProfileSummaryDto>('/api/workers/me');
}

export async function uploadIdentityDocuments(workerId: string, values: IdentityUploadValues): Promise<void> {
  const formData = new FormData();
  formData.append('dniFront', await toFormDataFile(values.dniFrontUri), 'dni-front.jpg');
  formData.append('dniBack', await toFormDataFile(values.dniBackUri), 'dni-back.jpg');
  formData.append('selfie', await toFormDataFile(values.selfieUri), 'selfie.jpg');

  return apiFetch<void>(`/api/workers/${workerId}/identity-documents`, { method: 'POST', body: formData });
}

/**
 * BUG real encontrado (2026-09-08): en web, `FormData` es la implementación real del browser —
 * necesita un `Blob` de verdad. El objeto `{uri, name, type}` de abajo es el pseudo-Blob que
 * React Native (nativo) sabe leer directo del filesystem del device, pero el FormData del browser
 * no lo entiende: lo serializa como texto "[object Object]" en vez de mandar el archivo, así que
 * el backend nunca veía la part `dniFront`/`dniBack`/`selfie` (`MissingServletRequestPartException`
 * en los logs). expo-image-picker en web devuelve un `uri` tipo `blob:...`, fetcheable.
 */
async function toFormDataFile(uri: string): Promise<Blob> {
  if (Platform.OS === 'web') {
    const response = await fetch(uri);
    return response.blob();
  }
  return { uri, name: 'photo.jpg', type: 'image/jpeg' } as unknown as Blob;
}

/** Backend redirects here (302) straight into the Mercado Pago consent screen. Sigue pública
 * (gap conocido, `esenciales/02-mercadopago-oauth-webhooks.md` del backend) — no lleva Bearer. */
export function getMercadoPagoAuthorizeUrl(workerId: string): string {
  return `${API_BASE_URL}/api/mercadopago/oauth/authorize/${workerId}`;
}

/**
 * NOTE(backend contract): for WebBrowser.openAuthSessionAsync to resolve, the backend's
 * `/api/mercadopago/oauth/callback` must end by redirecting (302) to this app deep link
 * (Linking.createURL(MERCADOPAGO_MOBILE_REDIRECT_PATH)) with a `status` query param,
 * instead of returning JSON directly. Not implemented yet on the backend side.
 */
export const MERCADOPAGO_MOBILE_REDIRECT_PATH = 'oauth/mercadopago/callback';
