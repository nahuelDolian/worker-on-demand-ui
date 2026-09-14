import React, { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Location from 'expo-location';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { FormTextField } from '../../components/ui/FormTextField';
import { SkillChip } from '../../components/ui/SkillChip';
import { PrimaryButton } from '../../components/ui/PrimaryButton';
import { AddressAutocompleteField } from '../../components/ui/AddressAutocompleteField';
import { WORKER_SKILLS } from '../../constants/skills';
import { createShift, getPlatformCommission, requestHold, ShiftResponseDto } from '../../api/restaurantApi';
import { getSkillEmojis } from '../../api/skillEmojisApi';
import { ApiError } from '../../api/httpClient';
import { computeAppFee } from '../../lib/commission';
import { resolveSkillEmoji } from '../../lib/skillEmojis';
import { reverseGeocode } from '../../lib/locationIq';
import { CreateShiftValues, createShiftSchema } from './schema';

// esenciales/02-mercadopago-oauth-webhooks.md, "Gap nuevo": fallback solo para el instante entre
// el primer render y que resuelva GET /api/platform-commission — nunca lo que termina cobrándose
// (eso lo decide el backend server-side, siempre).
const DEFAULT_COMMISSION_PERCENTAGE = 10;
const TOTAL_STEPS = 3;
type Step = 1 | 2 | 3;

// extensiones/07-rediseno-visual-y-animaciones.md: campos que "Continuar" valida antes de avanzar
// de cada paso — reutiliza createShiftSchema entero, no un schema por paso.
const STEP_FIELDS: Record<1 | 2, (keyof CreateShiftValues)[]> = {
  1: ['requiredSkill', 'baseAmount'],
  2: ['date', 'startTime', 'endTime', 'shiftLat', 'shiftLng'],
};

const STEP_TITLES: Record<Step, string> = {
  1: '¿Qué necesitás?',
  2: '¿Cuándo y dónde?',
  3: 'Confirmá y publicá',
};

/**
 * extensiones/07-rediseno-visual-y-animaciones.md: wizard de 3 pasos estilo checkout — dirección
 * elegida por Pilu en la sesión de mockups del 2026-09-10 (Opción B, sobre `extensiones/09-...`
 * ya construida). Mismo `createShiftSchema`/`publishMutation` de siempre, solo cambia cómo se
 * presenta: "Continuar" valida únicamente los campos del paso actual (`trigger`) antes de avanzar.
 * SPEC.md Domain 3A: sigue creando el turno (DRAFT) y pidiendo el hold en el mismo flujo — DRAFT
 * -> AWAITING_HOLD -> BROADCASTING. Alcance de este incremento (decisión de Pilu 2026-09-08): solo
 * "el loop de plata" — ver postulantes / elegir trabajador / cancelar quedan para
 * `esenciales/05-dashboard-restaurante.md` completa, todavía no arrancada.
 */
export function NewShiftScreen() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [result, setResult] = useState<ShiftResponseDto | null>(null);
  const [showManualCoords, setShowManualCoords] = useState(false);

  const { control, handleSubmit, watch, setValue, trigger, reset } = useForm<CreateShiftValues>({
    resolver: zodResolver(createShiftSchema),
    defaultValues: {
      requiredSkill: WORKER_SKILLS[0].value,
      baseAmount: undefined as unknown as number,
      date: '',
      startTime: '',
      endTime: '',
      shiftLat: undefined as unknown as number,
      shiftLng: undefined as unknown as number,
      shiftAddress: undefined,
      shiftPlaceId: undefined,
    },
  });

  const selectedSkill = watch('requiredSkill');
  // `watch()` devuelve el valor crudo del input (string) — react-hook-form solo coerce a number
  // vía el resolver de zod en handleSubmit, no acá. Se parsea a mano para el preview en vivo.
  const baseAmountValue = Number(watch('baseAmount'));
  const hasValidBaseAmount = !Number.isNaN(baseAmountValue) && baseAmountValue > 0;
  const shiftAddress = watch('shiftAddress');

  // esenciales/02-mercadopago-oauth-webhooks.md, "Gap nuevo": ya no hardcodea 10% — lee el % vigente.
  const commissionQuery = useQuery({ queryKey: ['platform-commission'], queryFn: getPlatformCommission });
  // extensiones/08-emojis-configurables-por-skill.md: cambia poco, mismo criterio de cache que platform-commission.
  const skillEmojisQuery = useQuery({ queryKey: ['skill-emojis'], queryFn: getSkillEmojis });
  const commissionPercentage = commissionQuery.data?.applicationFeePercentage ?? DEFAULT_COMMISSION_PERCENTAGE;
  const appFee = computeAppFee(hasValidBaseAmount ? baseAmountValue : 0, commissionPercentage);
  const totalAmount = (hasValidBaseAmount ? baseAmountValue : 0) + appFee;

  const publishMutation = useMutation({
    mutationFn: async (values: CreateShiftValues) => {
      const startTime = new Date(`${values.date}T${values.startTime}:00`);
      const endTime = new Date(`${values.date}T${values.endTime}:00`);
      const shift = await createShift({
        requiredSkill: values.requiredSkill,
        baseAmount: values.baseAmount,
        appFee: computeAppFee(values.baseAmount, commissionPercentage),
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        shiftLat: values.shiftLat,
        shiftLng: values.shiftLng,
        shiftAddress: values.shiftAddress,
        shiftPlaceId: values.shiftPlaceId,
      });
      return requestHold(shift.id);
    },
    onSuccess: (shift) => {
      setResult(shift);
      reset();
      setStep(1);
    },
  });

  async function useCurrentLocation() {
    setLocationError(null);
    setIsLocating(true);
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (!permission.granted) {
        setLocationError('Necesitamos acceso a tu ubicación, o cargá la lat/lng a mano abajo.');
        return;
      }
      const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setValue('shiftLat', position.coords.latitude, { shouldValidate: true });
      setValue('shiftLng', position.coords.longitude, { shouldValidate: true });
      // Best-effort: si el reverse-geocoding falla, el turno se publica igual sin shiftAddress
      // (spec 09) — no se muestra error al restaurante por esto.
      const reverseGeocoded = await reverseGeocode(position.coords.latitude, position.coords.longitude);
      if (reverseGeocoded) {
        setValue('shiftAddress', reverseGeocoded.displayName);
        setValue('shiftPlaceId', reverseGeocoded.placeId);
      }
    } catch {
      setLocationError('No pudimos obtener tu ubicación. Cargá la lat/lng a mano abajo.');
    } finally {
      setIsLocating(false);
    }
  }

  async function goNext() {
    const valid = await trigger(STEP_FIELDS[step as 1 | 2]);
    if (valid) setStep((s) => (s + 1) as Step);
  }

  function goBack() {
    setStep((s) => (s > 1 ? ((s - 1) as Step) : s));
  }

  const onSubmit = handleSubmit((values) => publishMutation.mutate(values));

  const errorMessage = (() => {
    if (!(publishMutation.error instanceof ApiError)) {
      return publishMutation.isError ? 'No pudimos publicar el turno. Intentá de nuevo.' : null;
    }
    switch (publishMutation.error.code) {
      case 'restaurant_not_linked':
        return 'Todavía no vinculaste tu cuenta de Mercado Pago — hace falta para poder pedir el hold.';
      case 'account_blocked':
        return null; // El layout autenticado ya muestra la pantalla de cuenta bloqueada.
      default:
        return publishMutation.error.code; // Mensajes de validación (400) hoy vienen en texto plano del backend.
    }
  })();

  if (result) {
    return (
      <ScrollView className="flex-1 bg-neutral-50 px-5 pt-6">
        <Animated.View
          entering={FadeInDown.duration(400)}
          accessibilityRole="alert"
          className="mb-6 rounded-2xl border border-emerald-100 bg-emerald-50 p-5"
        >
          <Text className="text-lg font-bold text-emerald-800">¡Turno publicado!</Text>
          <Text className="mt-1 font-medium text-emerald-700">
            Estado {result.status}
            {result.mpPreauthId ? `, hold ${result.mpPreauthId}` : ''}.
          </Text>
          <Text
            accessibilityRole="button"
            onPress={() => router.push('/(app)/onboarding/mercadopago')}
            className="mt-3 text-sm font-medium text-emerald-700"
          >
            (Recordatorio: el trabajador cobra recién cuando termina el turno)
          </Text>
        </Animated.View>
        <PrimaryButton label="Publicar otro turno" onPress={() => setResult(null)} />
      </ScrollView>
    );
  }

  return (
    <ScrollView className="flex-1 bg-neutral-50 px-5 pt-6" keyboardShouldPersistTaps="handled">
      <View className="mb-1 flex-row items-center gap-3">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Volver al paso anterior"
          accessibilityState={{ disabled: step === 1 }}
          disabled={step === 1}
          onPress={goBack}
          className={`h-9 w-9 items-center justify-center rounded-full border border-neutral-200 bg-white ${
            step === 1 ? 'opacity-30' : ''
          }`}
        >
          <Text className="text-base font-bold text-neutral-700">‹</Text>
        </Pressable>
        <Text className="text-xs font-bold uppercase tracking-wide text-emerald-700">
          Paso {step} de {TOTAL_STEPS}
        </Text>
      </View>
      <Text className="mb-3 text-2xl font-bold text-neutral-900">{STEP_TITLES[step]}</Text>
      <View className="mb-5 flex-row gap-1.5">
        {([1, 2, 3] as Step[]).map((s) => (
          <View key={s} className={`h-1.5 rounded-full ${s === step ? 'w-6 bg-emerald-600' : 'w-1.5 bg-neutral-200'}`} />
        ))}
      </View>

      {step === 1 ? (
        <Animated.View entering={FadeInDown.duration(350)} className="gap-3">
          <View className="rounded-2xl border border-neutral-100 bg-white p-4">
            <Text className="mb-2 text-sm font-medium text-neutral-700">Micro-habilidad requerida</Text>
            <View className="flex-row flex-wrap">
              {WORKER_SKILLS.map((skill) => (
                <SkillChip
                  key={skill.value}
                  label={skill.label}
                  selected={selectedSkill === skill.value}
                  onPress={() => setValue('requiredSkill', skill.value, { shouldValidate: true })}
                  emoji={resolveSkillEmoji(skill.value, skillEmojisQuery.data)}
                />
              ))}
            </View>
          </View>

          <View className="rounded-2xl border border-neutral-100 bg-white p-4">
            <FormTextField
              control={control}
              name="baseAmount"
              label="Pago base para el trabajador (ARS)"
              keyboardType="decimal-pad"
              placeholder="15000"
            />
            <Text className="-mt-3 text-sm text-neutral-500">
              + ${appFee} de fee de plataforma ({commissionPercentage}%, se calcula solo) = ${totalAmount} total del hold.
            </Text>
          </View>
        </Animated.View>
      ) : null}

      {step === 2 ? (
        <Animated.View entering={FadeInDown.duration(350)} className="gap-3">
          <View className="rounded-2xl border border-neutral-100 bg-white p-4">
            <Text className="mb-2 text-sm font-medium text-neutral-700">Cuándo</Text>
            <FormTextField control={control} name="date" label="Fecha" placeholder="2026-09-10" maxLength={10} />
            <View className="flex-row gap-3">
              <View className="flex-1">
                <FormTextField control={control} name="startTime" label="Hora inicio" placeholder="18:00" maxLength={5} />
              </View>
              <View className="flex-1">
                <FormTextField control={control} name="endTime" label="Hora fin" placeholder="23:00" maxLength={5} />
              </View>
            </View>
          </View>

          <View className="rounded-2xl border border-neutral-100 bg-white p-4">
            <Text className="mb-2 text-sm font-medium text-neutral-700">Dónde</Text>
            <AddressAutocompleteField
              label="Dirección del turno"
              placeholder="Av. Corrientes 1234, CABA"
              onSelect={(suggestion) => {
                setValue('shiftLat', suggestion.lat, { shouldValidate: true });
                setValue('shiftLng', suggestion.lon, { shouldValidate: true });
                setValue('shiftAddress', suggestion.displayName);
                setValue('shiftPlaceId', suggestion.placeId);
              }}
            />
            <PrimaryButton
              label={isLocating ? 'Obteniendo ubicación...' : 'Usar mi ubicación actual'}
              onPress={useCurrentLocation}
              loading={isLocating}
            />
            {locationError ? (
              <Text accessibilityRole="alert" className="-mt-6 mb-4 text-sm text-red-600">
                {locationError}
              </Text>
            ) : null}
            <Text
              accessibilityRole="button"
              onPress={() => setShowManualCoords((prev) => !prev)}
              className="mb-1 text-center text-xs font-semibold text-neutral-500"
            >
              {showManualCoords ? 'Ocultar carga manual de lat/lng' : '¿No encontrás la dirección? Cargar lat/lng a mano'}
            </Text>
            {showManualCoords ? (
              <View className="flex-row gap-3">
                <View className="flex-1">
                  <FormTextField control={control} name="shiftLat" label="Latitud" keyboardType="decimal-pad" />
                </View>
                <View className="flex-1">
                  <FormTextField control={control} name="shiftLng" label="Longitud" keyboardType="decimal-pad" />
                </View>
              </View>
            ) : null}
          </View>
        </Animated.View>
      ) : null}

      {step === 3 ? (
        <Animated.View entering={FadeInDown.duration(350)} className="gap-3">
          <View className="rounded-2xl border border-neutral-100 bg-white p-4">
            <View className="flex-row items-center gap-3 border-b border-neutral-100 pb-3">
              <Text className="text-lg">{resolveSkillEmoji(selectedSkill, skillEmojisQuery.data) ?? '🍽️'}</Text>
              <View>
                <Text className="font-semibold text-neutral-900">
                  {WORKER_SKILLS.find((s) => s.value === selectedSkill)?.label}
                </Text>
                <Text className="text-xs text-neutral-500">
                  {watch('date')} · {watch('startTime')} a {watch('endTime')}
                </Text>
              </View>
            </View>
            <Text className="pt-3 font-medium text-neutral-900">{shiftAddress || 'Ubicación cargada'}</Text>
          </View>

          <View className="rounded-2xl border border-neutral-100 bg-white p-4">
            <View className="flex-row justify-between">
              <Text className="text-sm font-medium text-neutral-500">Pago al trabajador</Text>
              <Text className="text-sm font-medium text-neutral-500">${hasValidBaseAmount ? baseAmountValue : 0}</Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-sm font-medium text-neutral-500">Fee de plataforma ({commissionPercentage}%)</Text>
              <Text className="text-sm font-medium text-neutral-500">${appFee}</Text>
            </View>
            <View className="mt-1 flex-row justify-between border-t border-dashed border-neutral-200 pt-2">
              <Text className="text-base font-bold text-neutral-900">Total del hold</Text>
              <Text className="text-base font-bold text-emerald-700">${totalAmount}</Text>
            </View>
          </View>

          <Text className="text-xs font-medium text-neutral-500">
            Al publicar se pide el hold en Mercado Pago — se libera si cancelás o hay no-show. El trabajador cobra
            recién cuando termina el turno.
          </Text>

          {errorMessage ? (
            <Text accessibilityRole="alert" className="text-sm text-red-600">
              {errorMessage}
            </Text>
          ) : null}
        </Animated.View>
      ) : null}

      <View className="mb-8 mt-5">
        <PrimaryButton
          label={step === 3 ? 'Publicar y pedir hold' : 'Continuar'}
          onPress={step === 3 ? onSubmit : goNext}
          loading={step === 3 && publishMutation.isPending}
        />
      </View>
    </ScrollView>
  );
}
