import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions, type BarcodeScanningResult } from 'expo-camera';
import * as Location from 'expo-location';
import { useMutation } from '@tanstack/react-query';
import { PrimaryButton } from '../../components/ui/PrimaryButton';
import { MAX_CHECK_IN_DISTANCE_METERS } from '../../constants/geofence';
import { distanceInMeters } from '../../lib/geo';
import { parseShiftIdFromQrData } from '../../lib/qr';
import { fetchShiftLocation, submitCheck } from '../../api/checkInApi';
import { CheckStatusPanel } from './CheckStatusPanel';
import type { CheckMode, ScreenStatus } from './types';

interface CheckInScreenProps {
  mode: CheckMode;
}

export function CheckInScreen({ mode }: CheckInScreenProps) {
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [status, setStatus] = useState<ScreenStatus>({ kind: 'scanning' });
  // onBarcodeScanned fires repeatedly while the QR stays in frame; this latches the first hit.
  const hasHandledScanRef = useRef(false);

  const submitMutation = useMutation({ mutationFn: submitCheck });

  useEffect(() => {
    if (cameraPermission && !cameraPermission.granted && cameraPermission.canAskAgain) {
      requestCameraPermission();
    }
  }, [cameraPermission, requestCameraPermission]);

  const handleRetry = useCallback(() => {
    hasHandledScanRef.current = false;
    setStatus({ kind: 'scanning' });
  }, []);

  const handleBarcodeScanned = useCallback(
    async ({ data }: BarcodeScanningResult) => {
      if (hasHandledScanRef.current) return;
      hasHandledScanRef.current = true;
      setStatus({ kind: 'validating' });

      try {
        const shiftId = parseShiftIdFromQrData(data);
        if (!shiftId) {
          setStatus({ kind: 'error', message: 'El código QR no es válido para esta operación.' });
          return;
        }

        const locationPermission = await Location.requestForegroundPermissionsAsync();
        if (!locationPermission.granted) {
          setStatus({
            kind: 'error',
            message: 'Necesitamos acceso a tu ubicación para validar tu presencia en el local.',
          });
          return;
        }

        const [shiftLocation, position] = await Promise.all([
          fetchShiftLocation(shiftId),
          Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High }),
        ]);

        const distance = distanceInMeters(
          { latitude: position.coords.latitude, longitude: position.coords.longitude },
          { latitude: shiftLocation.latitude, longitude: shiftLocation.longitude }
        );

        if (distance > MAX_CHECK_IN_DISTANCE_METERS) {
          setStatus({ kind: 'out-of-range', distanceMeters: Math.round(distance) });
          return;
        }

        setStatus({ kind: 'submitting' });

        await submitMutation.mutateAsync({
          shiftId,
          mode,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          scannedAt: new Date().toISOString(),
        });

        setStatus({ kind: 'success' });
      } catch (error) {
        setStatus({
          kind: 'error',
          message: error instanceof Error ? error.message : 'Ocurrió un error inesperado.',
        });
      }
    },
    [mode, submitMutation]
  );

  if (!cameraPermission) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-white">
        <Text className="text-base text-neutral-500">Cargando cámara...</Text>
      </SafeAreaView>
    );
  }

  if (!cameraPermission.granted) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-white px-6">
        <Text className="mb-2 text-center text-lg font-bold text-neutral-900">
          Necesitamos acceso a tu cámara
        </Text>
        <Text className="mb-6 text-center text-base text-neutral-500">
          La usamos para escanear el código QR del local y confirmar tu{' '}
          {mode === 'CHECK_IN' ? 'check-in' : 'check-out'}.
        </Text>
        <PrimaryButton
          label="Habilitar cámara"
          onPress={requestCameraPermission}
          accessibilityHint="Solicita el permiso de cámara del dispositivo"
        />
      </SafeAreaView>
    );
  }

  return (
    <View className="flex-1 bg-black">
      {status.kind === 'scanning' ? (
        <>
          <CameraView
            style={{ flex: 1 }}
            facing="back"
            barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
            onBarcodeScanned={handleBarcodeScanned}
          />
          <View pointerEvents="none" className="absolute inset-0 items-center justify-center">
            <View className="h-64 w-64 rounded-2xl border-4 border-emerald-400" />
          </View>
          <SafeAreaView edges={['top']} className="absolute inset-x-0 top-0">
            <Text
              accessibilityRole="text"
              className="px-6 py-4 text-center text-base font-medium text-white"
            >
              Escaneá el código QR del local para tu {mode === 'CHECK_IN' ? 'check-in' : 'check-out'}
            </Text>
          </SafeAreaView>
        </>
      ) : (
        <CheckStatusPanel status={status} mode={mode} onRetry={handleRetry} />
      )}
    </View>
  );
}
