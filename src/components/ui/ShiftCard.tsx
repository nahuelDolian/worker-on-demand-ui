import React from 'react';
import { Pressable, Text, View } from 'react-native';
import type { ShiftResponseDto } from '../../api/restaurantApi';
import { WORKER_SKILLS } from '../../constants/skills';

function skillLabel(skill: string): string {
  return WORKER_SKILLS.find((s) => s.value === skill)?.label ?? skill;
}

function formatDateTime(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleString('es-AR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}

const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Borrador',
  AWAITING_HOLD: 'Procesando pago',
  BROADCASTING: 'Buscando trabajador',
  SELECTION_PENDING: 'Con postulantes',
  MATCHED: 'Asignado',
  IN_PROGRESS: 'En curso',
  RECTIFICATION: 'Ajuste pendiente',
  COMPLETED: 'Completado',
  SETTLED: 'Pagado',
  DISPUTED: 'En disputa',
  CANCELLED_BY_REST: 'Cancelado',
  NO_SHOW_WORKER: 'No-show',
  SETTLEMENT_FAILED: 'Pago fallido',
};

interface ShiftCardProps {
  shift: ShiftResponseDto;
  /** Distancia en metros al punto de referencia actual (ej. GPS del worker) — opcional. */
  distanceMeters?: number;
  onPress?: () => void;
  /** Acción secundaria (ej. "Postularme") — se muestra como botón al pie de la card. */
  actionLabel?: string;
  onAction?: () => void;
  actionLoading?: boolean;
  /** extensiones/08-emojis-configurables-por-skill.md: ya resuelto por el caller
   * (`resolveSkillEmoji`) — `undefined` si `GET /api/skill-emojis` no cargó, cae a solo texto. */
  skillEmoji?: string;
}

export function ShiftCard({
  shift,
  distanceMeters,
  onPress,
  actionLabel,
  onAction,
  actionLoading,
  skillEmoji,
}: ShiftCardProps) {
  // Evita anidar un elemento interactivo dentro de otro (warning real de React DOM en web,
  // "<button> cannot appear as a descendant of <button>") — si hay un botón de acción dedicado,
  // la card entera deja de ser tocable, en vez de competir por el mismo tap.
  const Container = actionLabel && onAction ? View : Pressable;
  const containerProps =
    actionLabel && onAction ? {} : { accessibilityRole: onPress ? ('button' as const) : undefined, onPress };

  return (
    <Container {...containerProps} className="mb-3 rounded-xl border border-neutral-200 bg-white p-4">
      <View className="mb-2 flex-row items-center justify-between">
        <Text className="text-base font-semibold text-neutral-900">
          {skillEmoji ? `${skillEmoji} ` : ''}
          {skillLabel(shift.requiredSkill)}
        </Text>
        <View className="rounded-full bg-neutral-100 px-3 py-1">
          <Text className="text-xs font-medium text-neutral-600">{STATUS_LABELS[shift.status] ?? shift.status}</Text>
        </View>
      </View>
      <Text className="mb-1 text-sm text-neutral-500">{formatDateTime(shift.startTime)}</Text>
      {shift.shiftAddress ? (
        <Text className="mb-1 text-sm text-neutral-500" numberOfLines={1}>
          📍 {shift.shiftAddress}
        </Text>
      ) : null}
      <View className="flex-row items-center justify-between">
        <Text className="text-base font-medium text-emerald-700">${shift.baseAmount.toLocaleString('es-AR')}</Text>
        {distanceMeters !== undefined ? (
          <Text className="text-sm text-neutral-500">{(distanceMeters / 1000).toFixed(1)} km</Text>
        ) : null}
      </View>
      {actionLabel && onAction ? (
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ disabled: actionLoading }}
          disabled={actionLoading}
          onPress={onAction}
          className={`mt-3 items-center rounded-lg py-2 ${actionLoading ? 'bg-emerald-300' : 'bg-emerald-600'}`}
        >
          <Text className="text-sm font-semibold text-white">{actionLoading ? 'Enviando...' : actionLabel}</Text>
        </Pressable>
      ) : null}
    </Container>
  );
}
