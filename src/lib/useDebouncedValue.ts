import { useEffect, useState } from 'react';

/**
 * extensiones/09-geocoding-direcciones-new-shift.md: debounce genérico — evita pegarle al
 * proveedor de geocoding en cada keystroke (LocationIQ free tier: 2 req/s).
 */
export function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}
