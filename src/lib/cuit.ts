const CUIT_WEIGHTS = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2] as const;

/** Strips everything but digits (dashes, spaces, etc.). */
export function normalizeCuit(rawValue: string): string {
  return rawValue.replace(/\D/g, '');
}

/** AFIP mod-11 checksum for CUIT/CUIL: the 11th digit must match the computed check digit. */
export function isValidCuit(rawValue: string): boolean {
  const digits = normalizeCuit(rawValue);
  if (digits.length !== 11) return false;

  const nums = digits.split('').map(Number);
  const sum = CUIT_WEIGHTS.reduce((acc, weight, index) => acc + weight * nums[index], 0);
  const remainder = sum % 11;
  const checkDigit = remainder === 0 ? 0 : 11 - remainder;

  if (checkDigit === 10) return false;
  return checkDigit === nums[10];
}

/** Formats digits as XX-XXXXXXXX-X while the user is typing. */
export function formatCuit(rawValue: string): string {
  const digits = normalizeCuit(rawValue).slice(0, 11);
  if (digits.length <= 2) return digits;
  if (digits.length <= 10) return `${digits.slice(0, 2)}-${digits.slice(2)}`;
  return `${digits.slice(0, 2)}-${digits.slice(2, 10)}-${digits.slice(10)}`;
}
