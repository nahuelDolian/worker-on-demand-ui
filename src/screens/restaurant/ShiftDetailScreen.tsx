import React, { useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, Text, View } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { PrimaryButton } from '../../components/ui/PrimaryButton';
import { ShiftCard } from '../../components/ui/ShiftCard';
import { cancelShift, getApplicants, selectWorker, type ApplicantDto } from '../../api/restaurantApi';
import { getShift } from '../../api/shiftsApi';
import { getSkillEmojis } from '../../api/skillEmojisApi';
import { ApiError } from '../../api/httpClient';
import { describeSelectWorkerErrorCode } from '../../lib/shiftErrors';
import { resolveSkillEmoji } from '../../lib/skillEmojis';
import { WORKER_SKILLS } from '../../constants/skills';

function skillLabel(skill: string): string {
  return WORKER_SKILLS.find((s) => s.value === skill)?.label ?? skill;
}

/**
 * esenciales/05-dashboard-restaurante.md: "ver postulantes con detalle, elegir trabajador,
 * cancelar" — el gap que la primera vuelta había dejado bloqueado por falta de este endpoint.
 * Nunca muestra foto ni documentos de un postulante (ADR-0001) — solo `fullName`/`skills`/`trustScore`.
 */
export function ShiftDetailScreen({ shiftId }: { shiftId: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [selectError, setSelectError] = useState<string | null>(null);

  const shiftQuery = useQuery({ queryKey: ['shift', shiftId], queryFn: () => getShift(shiftId) });
  const shift = shiftQuery.data;
  const skillEmojisQuery = useQuery({ queryKey: ['skill-emojis'], queryFn: getSkillEmojis });

  const applicantsQuery = useQuery({
    queryKey: ['shift', shiftId, 'applicants'],
    queryFn: () => getApplicants(shiftId),
    enabled: shift?.status === 'SELECTION_PENDING',
  });

  const invalidateShift = () => {
    queryClient.invalidateQueries({ queryKey: ['shift', shiftId] });
    queryClient.invalidateQueries({ queryKey: ['restaurant-home'] });
  };

  const selectMutation = useMutation({
    mutationFn: (workerId: string) => selectWorker(shiftId, workerId),
    onSuccess: () => {
      setSelectError(null);
      invalidateShift();
    },
    onError: (error) => {
      setSelectError(error instanceof ApiError ? describeSelectWorkerErrorCode(error.code) : 'No pudimos confirmar al trabajador. Intentá de nuevo.');
      // Issue #17: el 409 significa que ESE candidato dejó de ser válido — el resto de la lista
      // puede seguir sirviendo, así que se refresca en vez de tirar toda la pantalla.
      applicantsQuery.refetch();
    },
  });

  const cancelMutation = useMutation({
    mutationFn: () => cancelShift(shiftId),
    onSuccess: invalidateShift,
  });

  function confirmCancel() {
    const penalty = shift?.cancellationPenaltyPreview;
    const message =
      penalty != null
        ? `Falta menos de 1 hora para el inicio — se va a cobrar una penalidad de $${penalty.toLocaleString('es-AR')} (50%, va al trabajador). ¿Confirmás la cancelación?`
        : '¿Confirmás la cancelación? Se libera el 100% del hold.';
    Alert.alert('Cancelar turno', message, [
      { text: 'Volver', style: 'cancel' },
      { text: 'Cancelar turno', style: 'destructive', onPress: () => cancelMutation.mutate() },
    ]);
  }

  if (shiftQuery.isLoading || !shift) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-white px-5 pt-6">
      <ShiftCard shift={shift} skillEmoji={resolveSkillEmoji(shift.requiredSkill, skillEmojisQuery.data)} />

      {shift.status === 'SELECTION_PENDING' ? (
        <>
          <Text className="mb-2 mt-4 text-lg font-semibold text-neutral-900">Postulantes</Text>
          {selectError ? (
            <Text accessibilityRole="alert" className="mb-3 text-sm text-red-600">
              {selectError}
            </Text>
          ) : null}
          {applicantsQuery.isLoading ? (
            <ActivityIndicator />
          ) : (applicantsQuery.data ?? []).length === 0 ? (
            <Text className="text-sm text-neutral-500">Todavía no hay postulantes.</Text>
          ) : (
            (applicantsQuery.data ?? []).map((applicant: ApplicantDto) => (
              <View key={applicant.workerId} className="mb-3 rounded-xl border border-neutral-200 p-4">
                <Text className="text-base font-semibold text-neutral-900">{applicant.fullName ?? 'Sin nombre'}</Text>
                <Text className="mb-1 text-sm text-neutral-500">
                  {applicant.skills.map(skillLabel).join(', ')} · Reputación {applicant.trustScore.toFixed(1)}
                </Text>
                <PrimaryButton
                  label="Elegir"
                  onPress={() => selectMutation.mutate(applicant.workerId)}
                  loading={selectMutation.isPending && selectMutation.variables === applicant.workerId}
                  disabled={selectMutation.isPending}
                />
              </View>
            ))
          )}
        </>
      ) : null}

      {shift.status === 'MATCHED' ? (
        <View className="mt-4">
          {shift.cancellationPenaltyPreview != null ? (
            <Text className="mb-3 text-sm text-amber-700">
              Falta menos de 1h para el inicio — cancelar ahora aplica una penalidad de $
              {shift.cancellationPenaltyPreview.toLocaleString('es-AR')} (50%, va al trabajador).
            </Text>
          ) : null}
          <PrimaryButton label="Cancelar turno" onPress={confirmCancel} loading={cancelMutation.isPending} />
        </View>
      ) : null}

      {cancelMutation.isSuccess ? (
        <View accessibilityRole="alert" className="mb-6 rounded-xl bg-neutral-100 p-4">
          <Text
            accessibilityRole="button"
            onPress={() => router.push('/(app)/(restaurant)')}
            className="text-sm font-medium text-neutral-700"
          >
            Turno cancelado — volver al inicio
          </Text>
        </View>
      ) : null}
    </ScrollView>
  );
}
