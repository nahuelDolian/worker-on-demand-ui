import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { FormTextField } from '../../../components/ui/FormTextField';
import { SkillChip } from '../../../components/ui/SkillChip';
import { PrimaryButton } from '../../../components/ui/PrimaryButton';
import { WORKER_SKILLS } from '../../../constants/skills';
import { registerWorker } from '../../../api/authApi';
import { PersonalInfoValues, personalInfoSchema } from '../schema';

/** Paso 1 del registro (`esenciales/03-autenticacion-cliente.md`): `POST /api/workers` con
 * password incluida. No deja logueado — el flujo sigue en la pantalla de verificación de email. */
export function PersonalInfoStep() {
  const router = useRouter();

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<PersonalInfoValues>({
    resolver: zodResolver(personalInfoSchema),
    defaultValues: { fullName: '', email: '', cuitCuil: '', password: '', skills: [] },
    mode: 'onBlur',
  });

  const selectedSkills = watch('skills');

  const registerMutation = useMutation({
    mutationFn: (values: PersonalInfoValues) => registerWorker(values),
  });

  const onSubmit = handleSubmit(async (values) => {
    await registerMutation.mutateAsync(values);
    router.push({ pathname: '/(auth)/verify-email', params: { email: values.email } });
  });

  function toggleSkill(skillValue: string) {
    const next = selectedSkills.includes(skillValue)
      ? selectedSkills.filter((value) => value !== skillValue)
      : [...selectedSkills, skillValue];
    setValue('skills', next, { shouldValidate: true });
  }

  // El backend no distingue hoy con un código estable "email ya registrado" de "CUIT ya
  // registrado" de otro 400/500 de validación (`IllegalArgumentException`/constraint de DB sin
  // mapear) — hasta que lo haga, el mensaje queda genérico en vez de adivinar cuál fue.
  const registerError = registerMutation.isError
    ? 'No pudimos crear tu cuenta. Puede que el email o el CUIT/CUIL ya estén registrados — revisá los datos e intentá de nuevo.'
    : null;

  return (
    <ScrollView className="flex-1 px-5" keyboardShouldPersistTaps="handled">
      <Text className="mb-1 text-2xl font-bold text-neutral-900">Tus datos</Text>
      <Text className="mb-6 text-base text-neutral-500">
        Necesitamos algunos datos para verificar tu identidad como Monotributista.
      </Text>

      <FormTextField
        control={control}
        name="fullName"
        label="Nombre completo"
        autoComplete="name"
        placeholder="Juan Pérez"
      />
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
        name="cuitCuil"
        label="CUIT / CUIL"
        keyboardType="number-pad"
        placeholder="20-12345678-3"
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

      <Text className="mb-2 text-sm font-medium text-neutral-700">Micro-habilidades</Text>
      <View className="mb-2 flex-row flex-wrap">
        {WORKER_SKILLS.map((skill) => (
          <SkillChip
            key={skill.value}
            label={skill.label}
            selected={selectedSkills.includes(skill.value)}
            onPress={() => toggleSkill(skill.value)}
          />
        ))}
      </View>
      {errors.skills ? (
        <Text accessibilityRole="alert" className="mb-4 text-sm text-red-600">
          {errors.skills.message}
        </Text>
      ) : null}

      {registerError ? (
        <Text accessibilityRole="alert" className="mb-4 text-sm text-red-600">
          {registerError}
        </Text>
      ) : null}

      <PrimaryButton
        label="Continuar"
        onPress={onSubmit}
        loading={registerMutation.isPending}
        accessibilityHint="Crea tu cuenta y avanza a la verificación de email"
      />

      <Text
        accessibilityRole="button"
        onPress={() => router.push('/(auth)/login')}
        className="mb-8 text-center text-sm font-medium text-emerald-700"
      >
        ¿Ya tenés cuenta? Iniciá sesión
      </Text>
    </ScrollView>
  );
}
