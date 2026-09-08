import React, { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { FormTextField } from '../../components/ui/FormTextField';
import { PrimaryButton } from '../../components/ui/PrimaryButton';
import { resendVerificationCode, verifyEmail } from '../../api/authApi';
import { ApiError } from '../../api/httpClient';
import { VerifyEmailValues, verifyEmailSchema } from '../onboarding/schema';

const VERIFY_ERROR_COPY: Record<string, string> = {
  invalid_or_expired_verification_code: 'El código es incorrecto o ya venció. Pedí uno nuevo.',
};

/** Pantalla entre registro y login (`esenciales/03-autenticacion-cliente.md`, paso 2): código de
 * 6 dígitos + reenvío. Nunca revela si el email existe — mismo mensaje siempre. */
export function VerifyEmailScreen() {
  const router = useRouter();
  const { email } = useLocalSearchParams<{ email: string }>();
  const [resendState, setResendState] = useState<'idle' | 'sent'>('idle');

  const { control, handleSubmit } = useForm<VerifyEmailValues>({
    resolver: zodResolver(verifyEmailSchema),
    defaultValues: { code: '' },
  });

  const verifyMutation = useMutation({
    mutationFn: (values: VerifyEmailValues) => verifyEmail(email, values.code),
    onSuccess: () => goToLogin(),
    onError: (error) => {
      // Si ya estaba verificado, no tiene sentido insistir con el código — mandamos directo a login.
      if (error instanceof ApiError && error.code === 'email_already_verified') {
        goToLogin();
      }
    },
  });

  const resendMutation = useMutation({
    mutationFn: () => resendVerificationCode(email),
    onSuccess: () => setResendState('sent'),
  });

  function goToLogin() {
    router.replace({ pathname: '/(auth)/login', params: { email } });
  }

  const onSubmit = handleSubmit((values) => verifyMutation.mutate(values));

  const errorMessage =
    verifyMutation.error instanceof ApiError
      ? (VERIFY_ERROR_COPY[verifyMutation.error.code] ?? 'No pudimos verificar el código. Intentá de nuevo.')
      : verifyMutation.isError
        ? 'No pudimos verificar el código. Intentá de nuevo.'
        : null;

  return (
    <ScrollView className="flex-1 px-5 pt-6" keyboardShouldPersistTaps="handled">
      <Text className="mb-1 text-2xl font-bold text-neutral-900">Verificá tu email</Text>
      <Text className="mb-6 text-base text-neutral-500">
        Te mandamos un código de 6 dígitos a {email || 'tu email'}. Ingresalo para activar tu cuenta.
      </Text>

      <FormTextField
        control={control}
        name="code"
        label="Código de verificación"
        keyboardType="number-pad"
        maxLength={6}
        placeholder="123456"
        autoFocus
      />

      {errorMessage ? (
        <Text accessibilityRole="alert" className="mb-4 text-sm text-red-600">
          {errorMessage}
        </Text>
      ) : null}

      <PrimaryButton label="Verificar" onPress={onSubmit} loading={verifyMutation.isPending} />

      <View className="items-center">
        <Text
          accessibilityRole="button"
          onPress={() => resendMutation.mutate()}
          className="mb-8 text-sm font-medium text-emerald-700"
        >
          {resendMutation.isPending ? 'Reenviando...' : '¿No te llegó? Reenviar código'}
        </Text>
        {resendState === 'sent' ? (
          <Text accessibilityRole="alert" className="mb-4 text-center text-sm text-neutral-500">
            Si existe una cuenta con ese email, te reenviamos el código.
          </Text>
        ) : null}
      </View>
    </ScrollView>
  );
}
