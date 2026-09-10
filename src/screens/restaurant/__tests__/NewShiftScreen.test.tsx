import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { NewShiftScreen } from '../NewShiftScreen';
import * as restaurantApi from '../../../api/restaurantApi';
import * as skillEmojisApi from '../../../api/skillEmojisApi';

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
}));
jest.mock('../../../api/restaurantApi');
jest.mock('../../../api/skillEmojisApi');

function renderWithQueryClient() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <NewShiftScreen />
    </QueryClientProvider>
  );
}

// extensiones/07-rediseno-visual-y-animaciones.md: NewShiftScreen pasa de formulario plano a un
// wizard de 3 pasos (dirección elegida por Pilu, sesión de diseño 2026-09-10) — "Continuar" valida
// solo los campos del paso actual antes de avanzar.
describe('NewShiftScreen wizard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(restaurantApi.getPlatformCommission).mockResolvedValue({ applicationFeePercentage: 10 });
    jest.mocked(skillEmojisApi.getSkillEmojis).mockResolvedValue([
      { skillCode: 'MOZO_BANDEJA', emoji: '🍽️' },
      { skillCode: 'BACHERO', emoji: '🧽' },
      { skillCode: 'COCINERO', emoji: '🧑‍🍳' },
      { skillCode: 'BARISTA', emoji: '☕' },
    ]);
  });

  it('does not advance past step 1 when baseAmount is empty', async () => {
    renderWithQueryClient();

    fireEvent.press(await screen.findByText('Continuar'));

    // Sigue en el paso 1: el campo de monto (exclusivo del paso 1) sigue visible.
    expect(screen.getByLabelText('Pago base para el trabajador (ARS)')).toBeTruthy();
    expect(screen.queryByLabelText('Fecha')).toBeNull();
  });

  it('advances through the 3 steps with valid data and shows the summary', async () => {
    renderWithQueryClient();

    fireEvent.changeText(await screen.findByLabelText('Pago base para el trabajador (ARS)'), '15000');
    fireEvent.press(screen.getByText('Continuar'));

    // Paso 2: usa el fallback manual de lat/lng (más determinístico en tests que el autocomplete).
    expect(await screen.findByLabelText('Fecha')).toBeTruthy();
    fireEvent.changeText(screen.getByLabelText('Fecha'), '2026-09-10');
    fireEvent.changeText(screen.getByLabelText('Hora inicio'), '18:00');
    fireEvent.changeText(screen.getByLabelText('Hora fin'), '23:00');
    fireEvent.press(screen.getByText('¿No encontrás la dirección? Cargar lat/lng a mano'));
    fireEvent.changeText(screen.getByLabelText('Latitud'), '-34.6');
    fireEvent.changeText(screen.getByLabelText('Longitud'), '-58.4');
    fireEvent.press(screen.getByText('Continuar'));

    expect(await screen.findByText('Publicar y pedir hold')).toBeTruthy();
    expect(screen.getByText(/16.500|16500/)).toBeTruthy();
  });
});
