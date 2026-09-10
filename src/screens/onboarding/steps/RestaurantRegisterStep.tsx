import React from 'react';
import { ScrollView, Text } from 'react-native';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { FormTextField } from '../../../components/ui/FormTextField';
import { PrimaryButton } from '../../../components/ui/PrimaryButton';
import { registerRestaurant } from '../../../api/authApi';
import { RestaurantRegisterValues, restaurantRegisterSchema } from '../schema';

/** Registro B2B (SPEC.md Domain 1) — mismo flujo que el worker (registro → verificar email →
 * login), sin `skills`. `POST /api/restaurants` ya existe del lado backend. */
export function RestaurantRegisterStep() {
  const router = useRouter();

  const { control, handleSubmit } = useForm<RestaurantRegisterValues>({
    resolver: zodResolver(restaurantRegisterSchema),
    defaultValues: { fullName: '', email: '', cuitCuil: '', password: '' },
    mode: 'onBlur',
  });

  const registerMutation = useMutation({
    mutationFn: (values: RestaurantRegisterValues) => registerRestaurant(values),
  });

  const onSubmit = handleSubmit(async (values) => {
    await registerMutation.mutateAsync(values);
    router.push({ pathname: '/(auth)/verify-email', params: { email: values.email } });
  });

  return (
    <ScrollView className="flex-1 px-5" keyboardShouldPersistTaps="handled">
      <Text className="mb-1 text-2xl font-bold text-neutral-900">Datos del restaurante</Text>
      <Text className="mb-6 text-base text-neutral-500">
        Vas a poder publicar turnos y vincular Mercado Pago para pagarlos.
      </Text>

      <FormTextField
        control={control}
        name="fullName"
        label="Nombre del restaurante"
        autoComplete="name"
        placeholder="Parrilla El Fogón"
      />
      <FormTextField
        control={control}
        name="email"
        label="Email"
        autoCapitalize="none"
        keyboardType="email-address"
        autoComplete="email"
        placeholder="contacto@ejemplo.com"
      />
      <FormTextField
        control={control}
        name="cuitCuil"
        label="CUIT"
        keyboardType="number-pad"
        placeholder="30-12345678-3"
        maxLength={13}
      />
      <FormTextField
        control={control}
        name="password"
        label="Contraseña"
        secureTextEntry
        autoCapitalize="none"
        autoComplete="password-new"
        placeholder="Mínimo 8 caracteres"
      />

      {registerMutation.isError ? (
        <Text accessibilityRole="alert" className="mb-4 text-sm text-red-600">
          No pudimos crear la cuenta. Puede que el email o el CUIT ya estén registrados — revisá los datos e intentá de nuevo.
        </Text>
      ) : null}

      <PrimaryButton
        label="Continuar"
        onPress={onSubmit}
        loading={registerMutation.isPending}
        accessibilityHint="Crea la cuenta del restaurante y avanza a la verificación de email"
      />
    </ScrollView>
  );
}
