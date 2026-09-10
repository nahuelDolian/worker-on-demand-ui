/**
 * esenciales/02-mercadopago-oauth-webhooks.md, "Gap nuevo" (2026-09-09): el fee de plataforma
 * mostrado en `NewShiftScreen` dejó de ser un 10% hardcodeado — se calcula acá con el `%` que
 * viene de `GET /api/platform-commission`. El backend recalcula igual server-side
 * (`ShiftController.create` ignora `appFee` del body), así que esto es solo para el preview.
 */
export function computeAppFee(baseAmount: number, percentage: number): number {
  if (!(baseAmount > 0)) return 0;
  return Math.round((baseAmount * percentage) / 100);
}
