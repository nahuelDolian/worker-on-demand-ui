import React, { useEffect, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Location from 'expo-location';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { ShiftCard } from '../../components/ui/ShiftCard';
import { listShifts } from '../../api/shiftsApi';
import { getSkillEmojis } from '../../api/skillEmojisApi';
import { distanceInMeters } from '../../lib/geo';
import { mergePendingApplications } from '../../lib/workerFilters';
import { resolveSkillEmoji } from '../../lib/skillEmojis';
import { useSessionStore } from '../../store/useSessionStore';

/**
 * esenciales/04-app-worker-marketplace-turnos.md: home del worker — reemplaza el viejo
 * comportamiento de caer directo en check-in al loguearse. Dos secciones: el turno activo (si
 * tiene uno — MATCHED/IN_PROGRESS/RECTIFICATION) con acceso directo a check-in, y un preview de
 * "turnos cerca" (BROADCASTING) con link a la búsqueda completa con filtros.
 *
 * NOTA (alcance de este incremento): no hay atajos de "más usado" — esa sección la pediste con
 * tracking real de uso, que todavía no existe del lado backend (tabla de eventos nueva, no
 * construida en esta vuelta). Se deja explícitamente afuera en vez de simularla con botones fijos.
 */
export function WorkerHomeScreen() {
  const router = useRouter();
  const fullName = useSessionStore((state) => state.user?.fullName);
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locationDenied, setLocationDenied] = useState(false);

  useEffect(() => {
    (async () => {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (!permission.granted) {
        setLocationDenied(true);
        return;
      }
      const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setCoords({ latitude: position.coords.latitude, longitude: position.coords.longitude });
    })();
  }, []);

  const activeShiftsQuery = useQuery({
    queryKey: ['worker-home', 'active-shifts'],
    queryFn: async () => {
      const [matched, inProgress, rectification] = await Promise.all([
        listShifts({ status: 'MATCHED' }),
        listShifts({ status: 'IN_PROGRESS' }),
        listShifts({ status: 'RECTIFICATION' }),
      ]);
      return [...matched, ...inProgress, ...rectification];
    },
  });

  // esenciales/04-app-worker-marketplace-turnos.md, segunda vuelta: "mis postulaciones
  // pendientes" — antes no se veían en ningún lado (el home solo mostraba el turno si ya
  // estaba MATCHED). BROADCASTING con mine=true (no el mercado completo) + SELECTION_PENDING.
  const pendingApplicationsQuery = useQuery({
    queryKey: ['worker-home', 'pending-applications'],
    queryFn: async () => {
      const [broadcasting, selectionPending] = await Promise.all([
        listShifts({ status: 'BROADCASTING', mine: true }),
        listShifts({ status: 'SELECTION_PENDING' }),
      ]);
      return mergePendingApplications(broadcasting, selectionPending);
    },
  });

  const nearbyShiftsQuery = useQuery({
    queryKey: ['worker-home', 'nearby-shifts', coords?.latitude, coords?.longitude],
    queryFn: () =>
      listShifts({
        status: 'BROADCASTING',
        lat: coords?.latitude,
        lng: coords?.longitude,
        radiusKm: 15,
      }),
    enabled: coords !== null,
  });
  // extensiones/07-rediseno-visual-y-animaciones.md: mismo lenguaje visual que NewShiftScreen —
  // emoji por skill en cada ShiftCard (spec 08 lo dejó pendiente acá, esta pantalla no estaba en
  // su lista original de componentes tocados).
  const skillEmojisQuery = useQuery({ queryKey: ['skill-emojis'], queryFn: getSkillEmojis });

  const isRefreshing = activeShiftsQuery.isFetching || pendingApplicationsQuery.isFetching || nearbyShiftsQuery.isFetching;
  const refresh = () => {
    activeShiftsQuery.refetch();
    pendingApplicationsQuery.refetch();
    nearbyShiftsQuery.refetch();
  };

  const activeShift = activeShiftsQuery.data?.[0] ?? null;

  return (
    <ScrollView
      className="flex-1 bg-neutral-50 px-5 pt-6"
      refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={refresh} />}
    >
      <Text className="mb-1 text-2xl font-bold text-neutral-900">Hola{fullName ? `, ${fullName.split(' ')[0]}` : ''} 👋</Text>
      <Text className="mb-6 text-base text-neutral-500">Esto es lo que está pasando con tus turnos.</Text>

      <Animated.View entering={FadeInDown.duration(350).delay(20)}>
        <Text className="mb-2 text-lg font-semibold text-neutral-900">Tu turno activo</Text>
        {activeShiftsQuery.isLoading ? (
          <ActivityIndicator className="mb-6" />
        ) : activeShift ? (
          <ShiftCard
            shift={activeShift}
            onPress={() => router.push(`/(app)/(tabs)/checkin`)}
            actionLabel={activeShift.status === 'MATCHED' ? 'Ir a check-in' : undefined}
            onAction={activeShift.status === 'MATCHED' ? () => router.push('/(app)/(tabs)/checkin') : undefined}
            skillEmoji={resolveSkillEmoji(activeShift.requiredSkill, skillEmojisQuery.data)}
          />
        ) : (
          <View className="mb-6 rounded-2xl border border-dashed border-neutral-300 p-4">
            <Text className="text-sm text-neutral-500">No tenés ningún turno activo ahora mismo.</Text>
          </View>
        )}
      </Animated.View>

      {(pendingApplicationsQuery.data ?? []).length > 0 ? (
        <Animated.View entering={FadeInDown.duration(350).delay(80)}>
          <Text className="mb-2 text-lg font-semibold text-neutral-900">Mis postulaciones pendientes</Text>
          {(pendingApplicationsQuery.data ?? []).map((shift) => (
            <ShiftCard
              key={shift.id}
              shift={shift}
              onPress={() => router.push('/(app)/(tabs)/browse')}
              skillEmoji={resolveSkillEmoji(shift.requiredSkill, skillEmojisQuery.data)}
            />
          ))}
          <View className="h-2" />
        </Animated.View>
      ) : null}

      <Animated.View entering={FadeInDown.duration(350).delay(140)}>
        <View className="mb-2 flex-row items-center justify-between">
          <Text className="text-lg font-semibold text-neutral-900">Turnos cerca</Text>
          <Text
            accessibilityRole="button"
            onPress={() => router.push('/(app)/(tabs)/browse')}
            className="text-sm font-medium text-emerald-700"
          >
            Ver todos y filtrar
          </Text>
        </View>

        {locationDenied ? (
          <View className="mb-6 rounded-2xl border border-dashed border-neutral-300 p-4">
            <Text className="text-sm text-neutral-500">
              Necesitamos tu ubicación para mostrarte turnos cerca — habilitala desde ajustes, o buscá manualmente.
            </Text>
          </View>
        ) : nearbyShiftsQuery.isLoading ? (
          <ActivityIndicator className="mb-6" />
        ) : (nearbyShiftsQuery.data ?? []).length === 0 ? (
          <View className="mb-6 rounded-2xl border border-dashed border-neutral-300 p-4">
            <Text className="text-sm text-neutral-500">No hay turnos disponibles cerca tuyo por ahora.</Text>
          </View>
        ) : (
          (nearbyShiftsQuery.data ?? []).slice(0, 4).map((shift) => (
            <ShiftCard
              key={shift.id}
              shift={shift}
              distanceMeters={
                coords ? distanceInMeters(coords, { latitude: shift.shiftLat, longitude: shift.shiftLng }) : undefined
              }
              onPress={() => router.push('/(app)/(tabs)/browse')}
              skillEmoji={resolveSkillEmoji(shift.requiredSkill, skillEmojisQuery.data)}
            />
          ))
        )}
      </Animated.View>

      <View className="h-6" />
    </ScrollView>
  );
}
