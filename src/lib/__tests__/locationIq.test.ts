import { parseLocationIqResults } from '../locationIq';

// extensiones/09-geocoding-direcciones-new-shift.md: normaliza la respuesta cruda de LocationIQ
// (snake_case, lat/lon como string) al shape que usa el resto de la app.
describe('parseLocationIqResults', () => {
  it('normalizes raw LocationIQ results into AddressSuggestion', () => {
    const raw = [
      { place_id: '123', display_name: 'Av. Corrientes 1234, CABA, Argentina', lat: '-34.603722', lon: '-58.381592' },
    ];

    const result = parseLocationIqResults(raw);

    expect(result).toEqual([
      { placeId: '123', displayName: 'Av. Corrientes 1234, CABA, Argentina', lat: -34.603722, lon: -58.381592 },
    ]);
  });

  it('returns an empty list for an empty response', () => {
    expect(parseLocationIqResults([])).toEqual([]);
  });
});
