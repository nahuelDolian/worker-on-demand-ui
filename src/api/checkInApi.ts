export type CheckMode = 'CHECK_IN' | 'CHECK_OUT';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:8080';

export interface ShiftLocation {
  shiftId: string;
  latitude: number;
  longitude: number;
}

/** TODO(backend): not implemented yet. Expected to return the shift's authoritative location. */
export async function fetchShiftLocation(shiftId: string): Promise<ShiftLocation> {
  const response = await fetch(`${API_BASE_URL}/api/shifts/${shiftId}/location`);

  if (!response.ok) {
    throw new Error(`No se pudo obtener la ubicación del turno (HTTP ${response.status})`);
  }

  return (await response.json()) as ShiftLocation;
}

export interface SubmitCheckPayload {
  shiftId: string;
  mode: CheckMode;
  latitude: number;
  longitude: number;
  scannedAt: string;
}

/** TODO(backend): not implemented yet. Expected to apply shift.checked_in / shift.checked_out. */
export async function submitCheck(payload: SubmitCheckPayload): Promise<void> {
  const endpoint = payload.mode === 'CHECK_IN' ? 'check-in' : 'check-out';

  const response = await fetch(`${API_BASE_URL}/api/shifts/${payload.shiftId}/${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      latitude: payload.latitude,
      longitude: payload.longitude,
      scannedAt: payload.scannedAt,
    }),
  });

  if (!response.ok) {
    throw new Error(`No se pudo registrar el ${endpoint} (HTTP ${response.status})`);
  }
}
