import React, { useState } from 'react';
import { ActivityIndicator, Pressable, Text, TextInput, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { AddressSuggestion, searchAddress } from '../../lib/locationIq';
import { useDebouncedValue } from '../../lib/useDebouncedValue';

const MIN_QUERY_LENGTH = 3;
const DEBOUNCE_MS = 300;

interface AddressAutocompleteFieldProps {
  label: string;
  placeholder?: string;
  onSelect: (suggestion: AddressSuggestion) => void;
}

/**
 * extensiones/09-geocoding-direcciones-new-shift.md: buscador de direcciones estilo Google
 * Places, sin serlo (ver ADR-0001) — reemplaza los campos de lat/lng a mano en `NewShiftScreen`.
 */
export function AddressAutocompleteField({ label, placeholder, onSelect }: AddressAutocompleteFieldProps) {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebouncedValue(query.trim(), DEBOUNCE_MS);

  const suggestionsQuery = useQuery({
    queryKey: ['address-autocomplete', debouncedQuery],
    queryFn: () => searchAddress(debouncedQuery),
    enabled: debouncedQuery.length >= MIN_QUERY_LENGTH,
  });

  function handleSelect(suggestion: AddressSuggestion) {
    setQuery(suggestion.displayName);
    onSelect(suggestion);
  }

  return (
    <View className="mb-4">
      <Text className="mb-1 text-sm font-medium text-neutral-700">{label}</Text>
      <TextInput
        accessibilityLabel={label}
        value={query}
        onChangeText={setQuery}
        placeholder={placeholder}
        placeholderTextColor="#9CA3AF"
        className="rounded-xl border border-neutral-300 px-4 py-3 text-base text-neutral-900"
      />
      {suggestionsQuery.isFetching ? <ActivityIndicator className="mt-2" /> : null}
      {(suggestionsQuery.data ?? []).map((suggestion) => (
        <Pressable
          key={suggestion.placeId}
          accessibilityRole="button"
          onPress={() => handleSelect(suggestion)}
          className="border-b border-neutral-100 px-2 py-3"
        >
          <Text className="text-sm text-neutral-700">{suggestion.displayName}</Text>
        </Pressable>
      ))}
    </View>
  );
}
