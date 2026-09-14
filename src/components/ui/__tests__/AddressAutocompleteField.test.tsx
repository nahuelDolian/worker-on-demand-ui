import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AddressAutocompleteField } from '../AddressAutocompleteField';
import * as locationIq from '../../../lib/locationIq';

jest.mock('../../../lib/locationIq', () => ({
  ...jest.requireActual('../../../lib/locationIq'),
  searchAddress: jest.fn(),
}));

function renderWithQueryClient(ui: React.ReactElement) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

// extensiones/09-geocoding-direcciones-new-shift.md: reemplaza los campos de lat/lng a mano en
// NewShiftScreen por un buscador de direcciones con autocomplete.
describe('AddressAutocompleteField', () => {
  beforeEach(() => jest.clearAllMocks());

  it('searches after typing and calls onSelect with the chosen suggestion', async () => {
    jest.mocked(locationIq.searchAddress).mockResolvedValue([
      { placeId: '123', displayName: 'Av. Corrientes 1234, CABA, Argentina', lat: -34.6, lon: -58.38 },
    ]);
    const onSelect = jest.fn();

    renderWithQueryClient(<AddressAutocompleteField label="Dirección" onSelect={onSelect} />);

    fireEvent.changeText(screen.getByLabelText('Dirección'), 'Av. Corrientes 1234');

    const suggestion = await screen.findByText(
      'Av. Corrientes 1234, CABA, Argentina',
      {},
      { timeout: 3000 }
    );
    fireEvent.press(suggestion);

    expect(onSelect).toHaveBeenCalledWith({
      placeId: '123',
      displayName: 'Av. Corrientes 1234, CABA, Argentina',
      lat: -34.6,
      lon: -58.38,
    });
  });

  it('does not search for a query shorter than 3 characters', async () => {
    jest.mocked(locationIq.searchAddress).mockResolvedValue([]);
    renderWithQueryClient(<AddressAutocompleteField label="Dirección" onSelect={jest.fn()} />);

    fireEvent.changeText(screen.getByLabelText('Dirección'), 'Av');

    await new Promise((resolve) => setTimeout(resolve, 400)); // pasa el debounce de 300ms
    expect(locationIq.searchAddress).not.toHaveBeenCalled();
  });
});
