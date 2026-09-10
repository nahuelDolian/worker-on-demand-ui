import { apiFetch } from './httpClient';

/** Contrato ya implementado del lado backend — ver `ShiftController.kt` /
 * `worker-on-demand/DOCS/specs/esenciales/05-dashboard-restaurante.md`. `restaurantId` nunca va
 * en el body, sale del token (spec 01). */

export type ShiftStatus =
  | 'DRAFT'
  | 'AWAITING_HOLD'
  | 'BROADCASTING'
  | 'SELECTION_PENDING'
  | 'MATCHED'
  | 'IN_PROGRESS'
  | 'RECTIFICATION'
  | 'COMPLETED'
  | 'SETTLED'
  | 'DISPUTED'
  | 'CANCELLED_BY_REST'
  | 'NO_SHOW_WORKER'
  | 'SETTLEMENT_FAILED';

export interface ShiftResponseDto {
  id: string;
  restaurantId: string;
  workerId: string | null;
  requiredSkill: string;
  status: ShiftStatus;
  baseAmount: number;
  appFee: number;
  startTime: string;
  endTime: string;
  shiftLat: number;
  shiftLng: number;
  mpPreauthId: string | null;
  /** esenciales/05-dashboard-restaurante.md, segunda vuelta: null salvo MATCHED con <1h para el inicio. */
  cancellationPenaltyPreview: number | null;
}

export interface CreateShiftPayload {
  requiredSkill: string;
  baseAmount: number;
  appFee: number;
  startTime: string;
  endTime: string;
  shiftLat: number;
  shiftLng: number;
}

/** `POST /api/shifts` — 201, crea el turno en DRAFT. 400 si `startTime` ya pasó o está a más de
 * 48h; 403 `account_blocked` si el restaurante tiene un bloqueo operativo activo. */
export async function createShift(payload: CreateShiftPayload): Promise<ShiftResponseDto> {
  return apiFetch<ShiftResponseDto>('/api/shifts', { method: 'POST', body: payload });
}

/** `POST /api/shifts/{id}/request-hold` — DRAFT -> AWAITING_HOLD -> BROADCASTING. Pide el hold
 * (pre-autorización) a Mercado Pago usando el `mp_access_token` vinculado del restaurante — 502
 * si Mercado Pago lo rechaza. */
export async function requestHold(shiftId: string): Promise<ShiftResponseDto> {
  return apiFetch<ShiftResponseDto>(`/api/shifts/${shiftId}/request-hold`, { method: 'POST' });
}

export interface PlatformCommissionDto {
  applicationFeePercentage: number;
}

/** `GET /api/platform-commission` — esenciales/02-mercadopago-oauth-webhooks.md, "Gap nuevo":
 * público (sin restricción de rol, el % no es sensible), reemplaza el 10% que `NewShiftScreen`
 * tenía hardcodeado. */
export async function getPlatformCommission(): Promise<PlatformCommissionDto> {
  return apiFetch<PlatformCommissionDto>('/api/platform-commission');
}
