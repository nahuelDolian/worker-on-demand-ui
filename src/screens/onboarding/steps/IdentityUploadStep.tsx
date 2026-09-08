import React from 'react';
import { Alert, Image, Pressable, ScrollView, Text, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { PrimaryButton } from '../../../components/ui/PrimaryButton';
import { uploadIdentityDocuments } from '../../../api/workerOnboardingApi';
import { useOnboardingStore } from '../../../store/useOnboardingStore';
import { useSessionStore } from '../../../store/useSessionStore';
import { IdentityUploadValues, identityUploadSchema } from '../schema';

const PHOTO_SLOTS: { field: keyof IdentityUploadValues; title: string; useCameraOnly?: boolean }[] = [
  { field: 'dniFrontUri', title: 'DNI - Frente' },
  { field: 'dniBackUri', title: 'DNI - Dorso' },
  { field: 'selfieUri', title: 'Selfie', useCameraOnly: true },
];

interface IdentityUploadStepProps {
  /** Se llama después de un upload exitoso — la pantalla que monta este step decide a dónde ir. */
  onDone?: () => void;
}

export function IdentityUploadStep({ onDone }: IdentityUploadStepProps) {
  // Corre autenticado (después del login) — el workerId sale de la sesión, nunca del body
  // (el backend rechaza con 403 si no coincide con el token, spec 01).
  const workerId = useSessionStore((state) => state.user?.id ?? null);
  const setIdentityUpload = useOnboardingStore((state) => state.setIdentityUpload);

  const { control, handleSubmit, setValue } = useForm<IdentityUploadValues>({
    resolver: zodResolver(identityUploadSchema),
    defaultValues: { dniFrontUri: '', dniBackUri: '', selfieUri: '' },
  });

  const uploadMutation = useMutation({
    mutationFn: (values: IdentityUploadValues) => {
      if (!workerId) throw new Error('Falta completar el paso anterior');
      return uploadIdentityDocuments(workerId, values);
    },
  });

  async function pickImage(field: keyof IdentityUploadValues, useCameraOnly?: boolean) {
    const permission = useCameraOnly
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert('Permiso requerido', 'Necesitamos acceso a la cámara/galería para continuar.');
      return;
    }

    const result = useCameraOnly
      ? await ImagePicker.launchCameraAsync({ quality: 0.7, allowsEditing: true })
      : await ImagePicker.launchImageLibraryAsync({ quality: 0.7, allowsEditing: true });

    if (!result.canceled && result.assets[0]) {
      setValue(field, result.assets[0].uri, { shouldValidate: true });
    }
  }

  const onSubmit = handleSubmit(async (values) => {
    await uploadMutation.mutateAsync(values);
    setIdentityUpload(values);
    onDone?.();
  });

  return (
    <ScrollView className="flex-1 px-5" keyboardShouldPersistTaps="handled">
      <Text className="mb-1 text-2xl font-bold text-neutral-900">Verificá tu identidad</Text>
      <Text className="mb-6 text-base text-neutral-500">
        Sacá una foto de ambos lados de tu DNI y una selfie para validar tu cuenta.
      </Text>

      {PHOTO_SLOTS.map(({ field, title, useCameraOnly }) => (
        <Controller
          key={field}
          control={control}
          name={field}
          render={({ field: { value }, fieldState: { error } }) => (
            <View className="mb-5">
              <Text className="mb-2 text-sm font-medium text-neutral-700">{title}</Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Tomar o elegir foto: ${title}`}
                onPress={() => pickImage(field, useCameraOnly)}
                className={`h-40 items-center justify-center overflow-hidden rounded-xl border-2 border-dashed ${
                  error ? 'border-red-500' : 'border-neutral-300'
                }`}
              >
                {value ? (
                  <Image source={{ uri: value }} className="h-full w-full" resizeMode="cover" />
                ) : (
                  <Text className="text-neutral-400">
                    Tocá para {useCameraOnly ? 'tomar una foto' : 'subir una foto'}
                  </Text>
                )}
              </Pressable>
              {error ? (
                <Text accessibilityRole="alert" className="mt-1 text-sm text-red-600">
                  {error.message}
                </Text>
              ) : null}
            </View>
          )}
        />
      ))}

      {uploadMutation.isError ? (
        <Text accessibilityRole="alert" className="mb-4 text-sm text-red-600">
          {(uploadMutation.error as Error).message}
        </Text>
      ) : null}

      <PrimaryButton label="Continuar" onPress={onSubmit} loading={uploadMutation.isPending} />
    </ScrollView>
  );
}
