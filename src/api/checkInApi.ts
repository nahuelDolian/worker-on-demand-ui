import { apiFetch } from './httpClient';

export type CheckMode = 'CHECK_IN' | 'CHECK_OUT';

export interface ShiftLocation {
  shiftId: string;
  latitude: number;
  longitude: number;
}

/** `GET /api/shifts/{id}/location` — requiere ser RESTAURANT o WORKER parte del turno. */
export async function fetchShiftLocation(shiftId: string): Promise<ShiftLocation> {
  return apiFetch<ShiftLocation>(`/api/shifts/${shiftId}/location`);
}

export interface SubmitCheckPayload {
  shiftId: string;
  mode: CheckMode;
  latitude: number;
  longitude: number;
  scannedAt: string;
}

/** `POST /api/shifts/{id}/check-in` o `/check-out` — requiere ser el WORKER asignado al turno. */
export async function submitCheck(payload: SubmitCheckPayload): Promise<void> {
  const endpoint = payload.mode === 'CHECK_IN' ? 'check-in' : 'check-out';

  return apiFetch<void>(`/api/shifts/${payload.shiftId}/${endpoint}`, {
    method: 'POST',
    body: {
      latitude: payload.latitude,
      longitude: payload.longitude,
      scannedAt: payload.scannedAt,
    },
  });
}
