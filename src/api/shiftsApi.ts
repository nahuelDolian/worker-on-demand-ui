import { apiFetch } from './httpClient';
import type { ShiftResponseDto, ShiftStatus } from './restaurantApi';

/**
 * `GET /api/shifts` (`ShiftController.listByStatus`) — esenciales/04-app-worker-marketplace-turnos.md
 * (worker: turnos cerca/mis turnos) y esenciales/05-dashboard-restaurante.md (restaurant: buckets del
 * home). Un RESTAURANT siempre ve solo los propios; un WORKER ve el mercado completo solo en
 * `status: 'BROADCASTING'` (ahí aplican los filtros de abajo) — para cualquier otro status ve solo
 * los propios ("mis turnos"), automático del lado backend, no hace falta pasar nada especial acá.
 */
export interface ListShiftsParams {
  status: ShiftStatus;
  skill?: string;
  lat?: number;
  lng?: number;
  radiusKm?: number;
  startTimeFrom?: string;
  startTimeTo?: string;
  minAmount?: number;
  maxAmount?: number;
  /** esenciales/04, segunda vuelta: para WORKER + status=BROADCASTING, filtra a solo las
   * postulaciones propias todavía sin resolver en vez del mercado completo. */
  mine?: boolean;
}

export async function listShifts(params: ListShiftsParams): Promise<ShiftResponseDto[]> {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      query.set(key, String(value));
    }
  });
  return apiFetch<ShiftResponseDto[]>(`/api/shifts?${query.toString()}`);
}

export async function getShift(shiftId: string): Promise<ShiftResponseDto> {
  return apiFetch<ShiftResponseDto>(`/api/shifts/${shiftId}`);
}

/** `POST /api/shifts/{id}/applications` — 202, sin body. 409 `shift_not_accepting_applications` si
 * ya llegó al cupo de 3, 409 `worker_has_active_shift` si el worker ya tiene un turno activo
 * (regla de negocio resuelta 2026-09-08 — no se permiten turnos simultáneos). */
export async function applyToShift(shiftId: string): Promise<void> {
  return apiFetch<void>(`/api/shifts/${shiftId}/applications`, { method: 'POST' });
}
