import { computeAppFee } from '../commission';

// esenciales/02-mercadopago-oauth-webhooks.md, "Gap nuevo": el % de comisión dejó de ser un
// 10% fijo en el cliente — se lee de GET /api/platform-commission (NewShiftScreen). Extraído
// como función pura para no depender de renderizar toda la pantalla (react-hook-form +
// expo-location + TanStack Query) solo para probar una cuenta.
describe('computeAppFee', () => {
  it('applies the given percentage to the base amount, rounded to the nearest peso', () => {
    expect(computeAppFee(15000, 10)).toBe(1500);
  });

  it('reflects a percentage different from the old hardcoded 10%', () => {
    expect(computeAppFee(15000, 15)).toBe(2250);
  });

  it('returns 0 for a non-positive base amount', () => {
    expect(computeAppFee(0, 10)).toBe(0);
    expect(computeAppFee(-100, 10)).toBe(0);
  });
});
