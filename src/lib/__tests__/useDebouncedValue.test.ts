import { act, renderHook } from '@testing-library/react-native';
import { useDebouncedValue } from '../useDebouncedValue';

// extensiones/09-geocoding-direcciones-new-shift.md: evita pegarle al proveedor en cada
// keystroke — LocationIQ free tier tiene un límite de 2 req/s.
describe('useDebouncedValue', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('keeps the initial value until the delay elapses', () => {
    const { result } = renderHook(({ value }) => useDebouncedValue(value, 300), {
      initialProps: { value: 'a' },
    });

    expect(result.current).toBe('a');
  });

  it('updates to the latest value only after the delay elapses since the last change', () => {
    const { result, rerender } = renderHook(({ value }) => useDebouncedValue(value, 300), {
      initialProps: { value: 'a' },
    });

    rerender({ value: 'av' });
    act(() => jest.advanceTimersByTime(200));
    expect(result.current).toBe('a'); // todavía no pasaron los 300ms desde el último cambio

    rerender({ value: 'ave' });
    act(() => jest.advanceTimersByTime(200));
    expect(result.current).toBe('a'); // el cambio a "ave" reinició el debounce

    act(() => jest.advanceTimersByTime(300));
    expect(result.current).toBe('ave');
  });
});
