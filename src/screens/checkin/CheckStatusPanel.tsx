import React from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { PrimaryButton } from '../../components/ui/PrimaryButton';
import { MAX_CHECK_IN_DISTANCE_METERS } from '../../constants/geofence';
import type { CheckMode, ScreenStatus } from './types';

interface CheckStatusPanelProps {
  status: Exclude<ScreenStatus, { kind: 'scanning' }>;
  mode: CheckMode;
  onRetry: () => void;
}

export function CheckStatusPanel({ status, mode, onRetry }: CheckStatusPanelProps) {
  const actionLabel = mode === 'CHECK_IN' ? 'check-in' : 'check-out';

  switch (status.kind) {
    case 'validating':
      return (
        <View accessibilityRole="alert" className="flex-1 items-center justify-center bg-white px-6">
          <ActivityIndicator size="large" color="#059669" />
          <Text className="mt-4 text-base font-medium text-neutral-700">Validando presencia...</Text>
        </View>
      );

    case 'submitting':
      return (
        <View accessibilityRole="alert" className="flex-1 items-center justify-center bg-white px-6">
          <ActivityIndicator size="large" color="#059669" />
          <Text className="mt-4 text-base font-medium text-neutral-700">Registrando {actionLabel}...</Text>
        </View>
      );

    case 'out-of-range':
      return (
        <View accessibilityRole="alert" className="flex-1 items-center justify-center bg-white px-6">
          <Text className="mb-2 text-center text-lg font-bold text-red-600">
            Error: Fuera del rango del local
          </Text>
          <Text className="mb-6 text-center text-base text-neutral-500">
            Estás a {status.distanceMeters} m del local. Acercate a menos de{' '}
            {MAX_CHECK_IN_DISTANCE_METERS} m e intentá de nuevo.
          </Text>
          <PrimaryButton label="Volver a escanear" onPress={onRetry} />
        </View>
      );

    case 'success':
      return (
        <View accessibilityRole="alert" className="flex-1 items-center justify-center bg-white px-6">
          <Text className="text-center text-lg font-bold text-emerald-700">
            {mode === 'CHECK_IN' ? 'Check-in exitoso' : 'Check-out exitoso'}
          </Text>
        </View>
      );

    case 'error':
      return (
        <View accessibilityRole="alert" className="flex-1 items-center justify-center bg-white px-6">
          <Text className="mb-2 text-center text-lg font-bold text-red-600">No pudimos continuar</Text>
          <Text className="mb-6 text-center text-base text-neutral-500">{status.message}</Text>
          <PrimaryButton label="Volver a escanear" onPress={onRetry} />
        </View>
      );
  }
}
