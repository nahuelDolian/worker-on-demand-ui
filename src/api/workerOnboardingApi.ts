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
export async function uploadIdentityDocuments(workerId: string, values: IdentityUploadValues): Promise<void> {
  const formData = new FormData();
  formData.append('dniFront', toFormDataFile(values.dniFrontUri, 'dni-front.jpg'));
  formData.append('dniBack', toFormDataFile(values.dniBackUri, 'dni-back.jpg'));
  formData.append('selfie', toFormDataFile(values.selfieUri, 'selfie.jpg'));

  return apiFetch<void>(`/api/workers/${workerId}/identity-documents`, { method: 'POST', body: formData });
}

function toFormDataFile(uri: string, name: string): Blob {
  return { uri, name, type: 'image/jpeg' } as unknown as Blob;
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
