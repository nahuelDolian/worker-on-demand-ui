import React, { useEffect, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, Text, TextInput, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Location from 'expo-location';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ShiftCard } from '../../components/ui/ShiftCard';
import { SkillChip } from '../../components/ui/SkillChip';
import { WORKER_SKILLS } from '../../constants/skills';
import { applyToShift, listShifts } from '../../api/shiftsApi';
import { getMyWorkerProfile } from '../../api/workerOnboardingApi';
import { getSkillEmojis } from '../../api/skillEmojisApi';
import { ApiError } from '../../api/httpClient';
import { distanceInMeters } from '../../lib/geo';
import { defaultSkillFilter } from '../../lib/workerFilters';
import { resolveSkillEmoji } from '../../lib/skillEmojis';

const RADIUS_OPTIONS_KM = [5, 15, 30, 50];

/**
 * esenciales/04-app-worker-marketplace-turnos.md: "ver turnos disponibles... postularse... saber
 * si ya llegó al cupo". Filtros: skill, radio, rango de fecha y rango de pago — los 4 que
 * pediste. Segunda vuelta: el filtro de skill defaultea a la primera skill propia del worker
 * (`GET /api/workers/me`, resuelto) en vez de "Todas" — el worker sigue pudiendo cambiarlo a mano.
 */
export function BrowseShiftsScreen() {
  const queryClient = useQueryClient();
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [skill, setSkill] = useState<string | null>(null);
  const [hasUserPickedSkill, setHasUserPickedSkill] = useState(false);
  const [radiusKm, setRadiusKm] = useState<number>(15);
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');
  const [dateFrom, setDateFrom] = useState(''); // YYYY-MM-DD
  const [dateTo, setDateTo] = useState('');
  const [applyingShiftId, setApplyingShiftId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ shiftId: string; message: string; tone: 'success' | 'error' } | null>(
    null
  );

  useEffect(() => {
    (async () => {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (!permission.granted) return;
      const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setCoords({ latitude: position.coords.latitude, longitude: position.coords.longitude });
    })();
  }, []);

  const myProfileQuery = useQuery({ queryKey: ['my-worker-profile'], queryFn: getMyWorkerProfile });
  // extensiones/08-emojis-configurables-por-skill.md: cambia poco, mismo criterio de cache que platform-commission.
  const skillEmojisQuery = useQuery({ queryKey: ['skill-emojis'], queryFn: getSkillEmojis });
  useEffect(() => {
    // Solo aplica el default mientras el worker no tocó el filtro a mano — si el profile
    // resuelve tarde y el usuario ya eligió "Todas" u otra skill, no le pisamos la elección.
    if (myProfileQuery.data && !hasUserPickedSkill) {
      setSkill(defaultSkillFilter(myProfileQuery.data.skills));
    }
  }, [myProfileQuery.data, hasUserPickedSkill]);

  function pickSkill(value: string | null) {
    setHasUserPickedSkill(true);
    setSkill(value);
  }

  const shiftsQuery = useQuery({
    queryKey: ['browse-shifts', coords, skill, radiusKm, minAmount, maxAmount, dateFrom, dateTo],
    queryFn: () =>
      listShifts({
        status: 'BROADCASTING',
        skill: skill ?? undefined,
        lat: coords?.latitude,
        lng: coords?.longitude,
        radiusKm: coords ? radiusKm : undefined,
        minAmount: minAmount ? Number(minAmount) : undefined,
        maxAmount: maxAmount ? Number(maxAmount) : undefined,
        startTimeFrom: dateFrom ? `${dateFrom}T00:00:00Z` : undefined,
        startTimeTo: dateTo ? `${dateTo}T23:59:59Z` : undefined,
      }),
  });

  const applyMutation = useMutation({
    mutationFn: applyToShift,
    onMutate: (shiftId: string) => setApplyingShiftId(shiftId),
    onSuccess: (_data, shiftId) => {
      setFeedback({ shiftId, message: '¡Postulación enviada!', tone: 'success' });
      queryClient.invalidateQueries({ queryKey: ['browse-shifts'] });
    },
    onError: (error, shiftId) => {
      let message = 'No pudimos enviar tu postulación. Intentá de nuevo.';
      if (error instanceof ApiError) {
        if (error.code === 'shift_not_accepting_applications') {
          message = 'Este turno ya llegó al cupo de postulantes.';
        } else if (error.code === 'worker_has_active_shift') {
          message = 'Ya tenés un turno activo — no podés postularte a otro hasta terminarlo.';
        }
      }
      setFeedback({ shiftId, message, tone: 'error' });
    },
    onSettled: () => setApplyingShiftId(null),
  });

  return (
    <ScrollView
      className="flex-1 bg-neutral-50 px-5 pt-6"
      keyboardShouldPersistTaps="handled"
      refreshControl={<RefreshControl refreshing={shiftsQuery.isFetching} onRefresh={() => shiftsQuery.refetch()} />}
    >
      <Text className="mb-4 text-2xl font-bold text-neutral-900">Turnos cerca</Text>

      <Animated.View entering={FadeInDown.duration(350)} className="mb-5 rounded-2xl border border-neutral-100 bg-white p-4">
        <Text className="mb-2 text-sm font-medium text-neutral-700">Habilidad</Text>
        <View className="mb-4 flex-row flex-wrap">
          <SkillChip label="Todas" selected={skill === null} onPress={() => pickSkill(null)} />
          {WORKER_SKILLS.map((s) => (
            <SkillChip
              key={s.value}
              label={s.label}
              selected={skill === s.value}
              onPress={() => pickSkill(s.value)}
              emoji={resolveSkillEmoji(s.value, skillEmojisQuery.data)}
            />
          ))}
        </View>

        <Text className="mb-2 text-sm font-medium text-neutral-700">Radio</Text>
        <View className="mb-4 flex-row flex-wrap">
          {RADIUS_OPTIONS_KM.map((km) => (
            <SkillChip key={km} label={`${km} km`} selected={radiusKm === km} onPress={() => setRadiusKm(km)} />
          ))}
        </View>
        {!coords ? (
          <Text className="-mt-3 mb-4 text-sm text-neutral-500">
            Sin acceso a tu ubicación no podemos filtrar por radio — habilitalo para usar este filtro.
          </Text>
        ) : null}

        <Text className="mb-2 text-sm font-medium text-neutral-700">Pago (ARS)</Text>
        <View className="mb-4 flex-row gap-3">
          <TextInput
            value={minAmount}
            onChangeText={setMinAmount}
            placeholder="Mínimo"
            keyboardType="decimal-pad"
            className="flex-1 rounded-xl border border-neutral-300 px-3 py-2"
          />
          <TextInput
            value={maxAmount}
            onChangeText={setMaxAmount}
            placeholder="Máximo"
            keyboardType="decimal-pad"
            className="flex-1 rounded-xl border border-neutral-300 px-3 py-2"
          />
        </View>

        <Text className="mb-2 text-sm font-medium text-neutral-700">Fecha</Text>
        <View className="flex-row gap-3">
          <TextInput
            value={dateFrom}
            onChangeText={setDateFrom}
            placeholder="Desde (AAAA-MM-DD)"
            maxLength={10}
            className="flex-1 rounded-xl border border-neutral-300 px-3 py-2"
          />
          <TextInput
            value={dateTo}
            onChangeText={setDateTo}
            placeholder="Hasta (AAAA-MM-DD)"
            maxLength={10}
            className="flex-1 rounded-xl border border-neutral-300 px-3 py-2"
          />
        </View>
      </Animated.View>

      {shiftsQuery.isLoading ? (
        <ActivityIndicator />
      ) : (shiftsQuery.data ?? []).length === 0 ? (
        <View className="rounded-2xl border border-dashed border-neutral-300 p-4">
          <Text className="text-sm text-neutral-500">No hay turnos que matcheen estos filtros ahora mismo.</Text>
        </View>
      ) : (
        (shiftsQuery.data ?? []).map((shift, index) => (
          <Animated.View key={shift.id} entering={FadeInDown.duration(300).delay(60 * Math.min(index, 6))}>
            <ShiftCard
              shift={shift}
              distanceMeters={
                coords ? distanceInMeters(coords, { latitude: shift.shiftLat, longitude: shift.shiftLng }) : undefined
              }
              actionLabel="Postularme"
              onAction={() => applyMutation.mutate(shift.id)}
              actionLoading={applyingShiftId === shift.id}
              skillEmoji={resolveSkillEmoji(shift.requiredSkill, skillEmojisQuery.data)}
            />
            {feedback?.shiftId === shift.id ? (
              <Text
                accessibilityRole="alert"
                className={`-mt-2 mb-3 text-sm ${feedback.tone === 'success' ? 'text-emerald-700' : 'text-red-600'}`}
              >
                {feedback.message}
              </Text>
            ) : null}
          </Animated.View>
        ))
      )}

      <View className="h-6" />
    </ScrollView>
  );
}
