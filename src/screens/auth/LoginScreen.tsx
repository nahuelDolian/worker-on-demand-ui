import React from 'react';
import { ScrollView, Text } from 'react-native';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { FormTextField } from '../../components/ui/FormTextField';
import { PrimaryButton } from '../../components/ui/PrimaryButton';
import { login } from '../../api/authApi';
import { ApiError } from '../../api/httpClient';
import { useSessionStore } from '../../store/useSessionStore';
import { roleHomeHref } from '../../lib/roleHome';
import { LoginValues, loginSchema } from '../onboarding/schema';

/** Pantalla de login (`esenciales/03-autenticacion-cliente.md`, paso 3) — `POST /api/auth/login`.
 * El registro NO deja logueado; esta pantalla es un paso explícito, con el email pre-cargado si
 * se llega desde la verificación de email recién hecha. */
export function LoginScreen() {
  const router = useRouter();
  const { email: emailParam } = useLocalSearchParams<{ email?: string }>();
  const setSession = useSessionStore((state) => state.setSession);

  const { control, handleSubmit, watch } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: emailParam ?? '', password: '' },
  });

  const loginMutation = useMutation({
    mutationFn: (values: LoginValues) => login(values.email, values.password),
    onSuccess: async (session) => {
      await setSession(session);
      // Bloqueada o no, el login funciona igual (spec 01, decisión de negocio #3) — el layout
      // autenticado es quien decide mostrar la pantalla de bloqueo en vez de esta pantalla.
      router.replace(roleHomeHref(session.user.role));
    },
  });

  const onSubmit = handleSubmit((values) => loginMutation.mutate(values));

  const errorMessage = (() => {
    if (!(loginMutation.error instanceof ApiError)) {
      return loginMutation.isError ? 'No pudimos iniciar sesión. Intentá de nuevo.' : null;
    }
    switch (loginMutation.error.code) {
      case 'invalid_credentials':
        return 'Email o contraseña incorrectos.';
      case 'email_not_verified':
        return 'Todavía no verificaste tu email. Revisá el código que te enviamos.';
      default:
        return 'No pudimos iniciar sesión. Intentá de nuevo.';
    }
  })();

  const isEmailNotVerified =
    loginMutation.error instanceof ApiError && loginMutation.error.code === 'email_not_verified';

  return (
    <ScrollView className="flex-1 px-5 pt-6" keyboardShouldPersistTaps="handled">
      <Text className="mb-1 text-2xl font-bold text-neutral-900">Iniciá sesión</Text>
      <Text className="mb-6 text-base text-neutral-500">Ingresá con tu email y contraseña.</Text>

      <FormTextField
        control={control}
        name="email"
        label="Email"
        autoCapitalize="none"
        keyboardType="email-address"
        autoComplete="email"
        placeholder="juan@ejemplo.com"
      />
      <FormTextField
        control={control}
        name="password"
        label="Contraseña"
        secureTextEntry
        autoCapitalize="none"
        autoComplete="password"
        placeholder="Tu contraseña"
      />

      {errorMessage ? (
        <Text accessibilityRole="alert" className="mb-2 text-sm text-red-600">
          {errorMessage}
        </Text>
      ) : null}

      {isEmailNotVerified ? (
        <Text
          accessibilityRole="button"
          onPress={() => router.push({ pathname: '/(auth)/verify-email', params: { email: watch('email') } })}
          className="mb-4 text-sm font-medium text-emerald-700"
        >
          Ir a verificar mi email
        </Text>
      ) : null}

      <PrimaryButton label="Ingresar" onPress={onSubmit} loading={loginMutation.isPending} />

      <Text
        accessibilityRole="button"
        onPress={() => router.push('/(auth)/register')}
        className="mb-8 text-center text-sm font-medium text-emerald-700"
      >
        ¿No tenés cuenta? Registrate
      </Text>
    </ScrollView>
  );
}
