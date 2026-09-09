import React from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { ShiftCard } from '../../components/ui/ShiftCard';
import { listShifts } from '../../api/shiftsApi';
import type { ShiftResponseDto, ShiftStatus } from '../../api/restaurantApi';
import { useSessionStore } from '../../store/useSessionStore';

/**
 * esenciales/05-dashboard-restaurante.md: home del restaurante — reemplaza el viejo
 * comportamiento de caer directo en "publicar turno". 3 buckets, mapeo de estados resuelto por
 * Pilu (2026-09-08): Abiertos = buscando trabajador; Matcheados = asignado, no arrancó; En curso.
 *
 * NOTA (alcance de este incremento): tocar una card no lleva a "ver postulantes/elegir" — ese
 * flujo necesita un endpoint nuevo (listar postulantes con detalle) que la spec ya documenta como
 * pendiente, no construido en esta vuelta. Por ahora las cards son solo informativas.
 */
const BUCKETS: { title: string; statuses: ShiftStatus[] }[] = [
  { title: 'Abiertos', statuses: ['AWAITING_HOLD', 'BROADCASTING', 'SELECTION_PENDING'] },
  { title: 'Matcheados', statuses: ['MATCHED'] },
  { title: 'En curso', statuses: ['IN_PROGRESS', 'RECTIFICATION'] },
];

export function RestaurantHomeScreen() {
  const router = useRouter();
  const fullName = useSessionStore((state) => state.user?.fullName);

  const shiftsQuery = useQuery({
    queryKey: ['restaurant-home', 'shifts'],
    queryFn: async () => {
      const allStatuses = BUCKETS.flatMap((b) => b.statuses);
      const results = await Promise.all(allStatuses.map((status) => listShifts({ status })));
      return allStatuses.reduce<Record<string, ShiftResponseDto[]>>((acc, status, i) => {
        acc[status] = results[i];
        return acc;
      }, {});
    },
  });

  return (
    <ScrollView
      className="flex-1 bg-neutral-50 px-5 pt-6"
      refreshControl={<RefreshControl refreshing={shiftsQuery.isFetching} onRefresh={() => shiftsQuery.refetch()} />}
    >
      <Text className="mb-1 text-2xl font-bold text-neutral-900">Hola{fullName ? `, ${fullName}` : ''} 👋</Text>
      <Text className="mb-6 text-base text-neutral-500">Así están tus turnos ahora mismo.</Text>

      <Text
        accessibilityRole="button"
        onPress={() => router.push('/(app)/(restaurant)/new-shift')}
        className="mb-6 items-center rounded-xl bg-emerald-600 py-4 text-center text-base font-semibold text-white"
      >
        + Publicar turno nuevo
      </Text>

      {shiftsQuery.isLoading ? (
        <ActivityIndicator />
      ) : (
        BUCKETS.map((bucket) => {
          const shifts = bucket.statuses.flatMap((status) => shiftsQuery.data?.[status] ?? []);
          return (
            <View key={bucket.title} className="mb-6">
              <Text className="mb-2 text-lg font-semibold text-neutral-900">
                {bucket.title} {shifts.length > 0 ? `(${shifts.length})` : ''}
              </Text>
              {shifts.length === 0 ? (
                <View className="rounded-xl border border-dashed border-neutral-300 p-4">
                  <Text className="text-sm text-neutral-500">Nada acá por ahora.</Text>
                </View>
              ) : (
                shifts.map((shift) => <ShiftCard key={shift.id} shift={shift} />)
              )}
            </View>
          );
        })
      )}
    </ScrollView>
  );
}
