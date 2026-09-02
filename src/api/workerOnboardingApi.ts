import type { IdentityUploadValues, PersonalInfoValues } from '../screens/onboarding/schema';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:8080';

export interface RegisterWorkerResponse {
  workerId: string;
}

/**
 * TODO(backend): not implemented yet. Expected to create the `users` row (role=WORKER)
 * + `worker_profiles` row and return the generated id.
 */
export async function registerWorkerPersonalInfo(
  values: PersonalInfoValues
): Promise<RegisterWorkerResponse> {
  const response = await fetch(`${API_BASE_URL}/api/workers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(values),
  });

  if (!response.ok) {
    throw new Error(`No se pudo registrar el perfil (HTTP ${response.status})`);
  }

  return (await response.json()) as RegisterWorkerResponse;
}

/**
 * TODO(backend): not implemented yet. Expected to accept multipart/form-data with the
 * three identity images and persist/forward them to the KYC provider.
 */
export async function uploadIdentityDocuments(
  workerId: string,
  values: IdentityUploadValues
): Promise<void> {
  const formData = new FormData();
  formData.append('dniFront', toFormDataFile(values.dniFrontUri, 'dni-front.jpg'));
  formData.append('dniBack', toFormDataFile(values.dniBackUri, 'dni-back.jpg'));
  formData.append('selfie', toFormDataFile(values.selfieUri, 'selfie.jpg'));

  const response = await fetch(`${API_BASE_URL}/api/workers/${workerId}/identity-documents`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`No se pudieron subir los documentos (HTTP ${response.status})`);
  }
}

function toFormDataFile(uri: string, name: string): Blob {
  return { uri, name, type: 'image/jpeg' } as unknown as Blob;
}

/** Backend redirects here (302) straight into the Mercado Pago consent screen. */
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
