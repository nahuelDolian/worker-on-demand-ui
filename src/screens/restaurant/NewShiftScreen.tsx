import React, { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import * as Location from 'expo-location';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { FormTextField } from '../../components/ui/FormTextField';
import { SkillChip } from '../../components/ui/SkillChip';
import { PrimaryButton } from '../../components/ui/PrimaryButton';
import { WORKER_SKILLS } from '../../constants/skills';
import { createShift, getPlatformCommission, requestHold, ShiftResponseDto } from '../../api/restaurantApi';
import { ApiError } from '../../api/httpClient';
import { computeAppFee } from '../../lib/commission';
import { CreateShiftValues, createShiftSchema } from './schema';

// esenciales/02-mercadopago-oauth-webhooks.md, "Gap nuevo": fallback solo para el instante entre
// el primer render y que resuelva GET /api/platform-commission — nunca lo que termina cobrándose
// (eso lo decide el backend server-side, siempre).
const DEFAULT_COMMISSION_PERCENTAGE = 10;

/** SPEC.md Domain 3A: crea el turno (DRAFT) y en el mismo paso pide el hold — DRAFT ->
 * AWAITING_HOLD -> BROADCASTING. Alcance de este incremento (decisión de Pilu 2026-09-08): solo
 * "el loop de plata" — ver postulantes / elegir trabajador / cancelar quedan para
 * `esenciales/05-dashboard-restaurante.md` completa, todavía no arrancada. */
export function NewShiftScreen() {
  const router = useRouter();
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [result, setResult] = useState<ShiftResponseDto | null>(null);

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<CreateShiftValues>({
    resolver: zodResolver(createShiftSchema),
    defaultValues: {
      requiredSkill: WORKER_SKILLS[0].value,
      baseAmount: undefined as unknown as number,
      date: '',
      startTime: '',
      endTime: '',
      shiftLat: undefined as unknown as number,
      shiftLng: undefined as unknown as number,
    },
  });

  const selectedSkill = watch('requiredSkill');
  // `watch()` devuelve el valor crudo del input (string) — react-hook-form solo coerce a number
  // vía el resolver de zod en handleSubmit, no acá. Se parsea a mano para el preview en vivo.
  const baseAmountValue = Number(watch('baseAmount'));
  const hasValidBaseAmount = !Number.isNaN(baseAmountValue) && baseAmountValue > 0;

  // esenciales/02-mercadopago-oauth-webhooks.md, "Gap nuevo": ya no hardcodea 10% — lee el % vigente.
  // SPEC.md Domain 3B: la cuenta en sí (baseAmount × %) se deriva acá solo para el preview; el
  // backend la vuelve a calcular server-side y es lo único que realmente importa (ShiftController.create).
  const commissionQuery = useQuery({
    queryKey: ['platform-commission'],
    queryFn: getPlatformCommission,
  });
  const commissionPercentage = commissionQuery.data?.applicationFeePercentage ?? DEFAULT_COMMISSION_PERCENTAGE;
  const appFee = computeAppFee(hasValidBaseAmount ? baseAmountValue : 0, commissionPercentage);

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
      });
      return requestHold(shift.id);
    },
    onSuccess: (shift) => {
      setResult(shift);
      reset();
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
    } catch {
      setLocationError('No pudimos obtener tu ubicación. Cargá la lat/lng a mano abajo.');
    } finally {
      setIsLocating(false);
    }
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

  return (
    <ScrollView className="flex-1 bg-white px-5 pt-6" keyboardShouldPersistTaps="handled">
      <Text className="mb-1 text-2xl font-bold text-neutral-900">Publicar turno</Text>
      <Text className="mb-6 text-base text-neutral-500">
        Al publicar se pide el hold en Mercado Pago — se libera si cancelás o hay no-show.
      </Text>

      {result ? (
        <View accessibilityRole="alert" className="mb-6 rounded-xl bg-emerald-50 p-4">
          <Text className="font-medium text-emerald-700">
            Turno publicado — estado {result.status}
            {result.mpPreauthId ? `, hold ${result.mpPreauthId}` : ''}.
          </Text>
          <Text
            accessibilityRole="button"
            onPress={() => router.push('/(app)/onboarding/mercadopago')}
            className="mt-2 text-sm font-medium text-emerald-700"
          >
            (Recordatorio: el trabajador cobra recién cuando termina el turno)
          </Text>
        </View>
      ) : null}

      <Text className="mb-2 text-sm font-medium text-neutral-700">Micro-habilidad requerida</Text>
      <View className="mb-4 flex-row flex-wrap">
        {WORKER_SKILLS.map((skill) => (
          <SkillChip
            key={skill.value}
            label={skill.label}
            selected={selectedSkill === skill.value}
            onPress={() => setValue('requiredSkill', skill.value, { shouldValidate: true })}
          />
        ))}
      </View>

      <FormTextField
        control={control}
        name="baseAmount"
        label="Pago base para el trabajador (ARS)"
        keyboardType="decimal-pad"
        placeholder="15000"
      />
      <Text className="-mt-3 mb-4 text-sm text-neutral-500">
        + ${appFee} de fee de plataforma ({commissionPercentage}%, se calcula solo) = $
        {(hasValidBaseAmount ? baseAmountValue : 0) + appFee} total del hold.
      </Text>

      <FormTextField control={control} name="date" label="Fecha" placeholder="2026-09-10" maxLength={10} />
      <View className="flex-row gap-3">
        <View className="flex-1">
          <FormTextField control={control} name="startTime" label="Hora inicio" placeholder="18:00" maxLength={5} />
        </View>
        <View className="flex-1">
          <FormTextField control={control} name="endTime" label="Hora fin" placeholder="23:00" maxLength={5} />
        </View>
      </View>

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

      <View className="flex-row gap-3">
        <View className="flex-1">
          <FormTextField control={control} name="shiftLat" label="Latitud" keyboardType="decimal-pad" />
        </View>
        <View className="flex-1">
          <FormTextField control={control} name="shiftLng" label="Longitud" keyboardType="decimal-pad" />
        </View>
      </View>

      {errors.requiredSkill ? (
        <Text accessibilityRole="alert" className="mb-4 text-sm text-red-600">
          Seleccioná una micro-habilidad
        </Text>
      ) : null}

      {errorMessage ? (
        <Text accessibilityRole="alert" className="mb-4 text-sm text-red-600">
          {errorMessage}
        </Text>
      ) : null}

      <PrimaryButton label="Publicar y pedir hold" onPress={onSubmit} loading={publishMutation.isPending} />
    </ScrollView>
  );
}
