import { isValidCuit, normalizeCuit } from '../cuit';

// Primer test de este repo (esenciales/07-testing-linting-frontend.md sigue sin aprobar/armar
// del todo — esto es solo la infraestructura mínima de Jest + Testing Library que hizo falta
// para desarrollar #1/#3/#4 con /tdd, no la spec completa de testing).
describe('cuit', () => {
  it('normalizes dashes and spaces out of a raw CUIT', () => {
    expect(normalizeCuit('20-11111111-2')).toBe('20111111112');
  });

  it('validates a real CUIT via the AFIP mod-11 checksum', () => {
    expect(isValidCuit('20111111112')).toBe(true);
  });

  it('rejects a CUIT with a wrong check digit', () => {
    expect(isValidCuit('20111111119')).toBe(false);
  });
});
