/**
 * extensiones/09-geocoding-direcciones-new-shift.md — ver ADR-0001 del repo (docs/adr/, dentro de
 * DOCS/adr/ en disco): sin mapa nativo, sin Google Places. LocationIQ (compatible con la API de
 * Nominatim) resuelto en la sesión de grilling del 2026-09-10.
 */
export interface AddressSuggestion {
  placeId: string;
  displayName: string;
  lat: number;
  lon: number;
}

interface LocationIqRawResult {
  place_id: string;
  display_name: string;
  lat: string;
  lon: string;
}

export function parseLocationIqResults(raw: LocationIqRawResult[]): AddressSuggestion[] {
  return raw.map((result) => ({
    placeId: result.place_id,
    displayName: result.display_name,
    lat: Number(result.lat),
    lon: Number(result.lon),
  }));
}

const LOCATIONIQ_API_KEY = process.env.EXPO_PUBLIC_LOCATIONIQ_API_KEY ?? '';

/** `GET /v1/autocomplete` — https://docs.locationiq.com/reference/autocomplete-2.
 * `countrycodes=ar`: el negocio opera en Argentina (SPEC.md), reduce ruido en los resultados. */
export async function searchAddress(query: string): Promise<AddressSuggestion[]> {
  if (!LOCATIONIQ_API_KEY) {
    throw new Error(
      'Falta EXPO_PUBLIC_LOCATIONIQ_API_KEY — ver worker-on-demand-ui/.env.example para configurarla.'
    );
  }
  const url =
    `https://api.locationiq.com/v1/autocomplete?key=${LOCATIONIQ_API_KEY}` +
    `&q=${encodeURIComponent(query)}&format=json&limit=5&countrycodes=ar`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`LocationIQ autocomplete respondió ${response.status}`);
  }
  const raw = (await response.json()) as LocationIqRawResult[];
  return parseLocationIqResults(raw);
}

/** `GET /v1/reverse` — best-effort: usado al tocar "Usar mi ubicación actual"; si falla, `null` y
 * el turno se publica igual con `shiftAddress` en blanco (no bloquea, spec 09). */
export async function reverseGeocode(lat: number, lon: number): Promise<AddressSuggestion | null> {
  if (!LOCATIONIQ_API_KEY) return null;
  try {
    const url = `https://us1.locationiq.com/v1/reverse?key=${LOCATIONIQ_API_KEY}&lat=${lat}&lon=${lon}&format=json`;
    const response = await fetch(url);
    if (!response.ok) return null;
    const raw = (await response.json()) as LocationIqRawResult;
    return parseLocationIqResults([raw])[0] ?? null;
  } catch {
    return null;
  }
}
