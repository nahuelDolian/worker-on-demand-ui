const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Accepts either a raw shift UUID or a URL carrying a `shiftId` query param. */
export function parseShiftIdFromQrData(data: string): string | null {
  const trimmed = data.trim();
  if (UUID_REGEX.test(trimmed)) return trimmed;

  try {
    const shiftId = new URL(trimmed).searchParams.get('shiftId');
    return shiftId && UUID_REGEX.test(shiftId) ? shiftId : null;
  } catch {
    return null;
  }
}
