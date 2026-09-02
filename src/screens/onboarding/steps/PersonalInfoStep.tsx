import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { FormTextField } from '../../../components/ui/FormTextField';
import { SkillChip } from '../../../components/ui/SkillChip';
import { PrimaryButton } from '../../../components/ui/PrimaryButton';
import { WORKER_SKILLS } from '../../../constants/skills';
import { registerWorkerPersonalInfo } from '../../../api/workerOnboardingApi';
import { useOnboardingStore } from '../../../store/useOnboardingStore';
import { PersonalInfoValues, personalInfoSchema } from '../schema';

export function PersonalInfoStep() {
  const setPersonalInfo = useOnboardingStore((state) => state.setPersonalInfo);

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<PersonalInfoValues>({
    resolver: zodResolver(personalInfoSchema),
    defaultValues: { fullName: '', email: '', cuitCuil: '', skills: [] },
    mode: 'onBlur',
  });

  const selectedSkills = watch('skills');

  const registerMutation = useMutation({ mutationFn: registerWorkerPersonalInfo });

  const onSubmit = handleSubmit(async (values) => {
    const { workerId } = await registerMutation.mutateAsync(values);
    setPersonalInfo(values, workerId);
  });

  function toggleSkill(skillValue: string) {
    const next = selectedSkills.includes(skillValue)
      ? selectedSkills.filter((value) => value !== skillValue)
      : [...selectedSkills, skillValue];
    setValue('skills', next, { shouldValidate: true });
  }

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

      {registerMutation.isError ? (
        <Text accessibilityRole="alert" className="mb-4 text-sm text-red-600">
          {(registerMutation.error as Error).message}
        </Text>
      ) : null}

      <PrimaryButton
        label="Continuar"
        onPress={onSubmit}
        loading={registerMutation.isPending}
        accessibilityHint="Guarda tus datos personales y avanza al siguiente paso"
      />
    </ScrollView>
  );
}
