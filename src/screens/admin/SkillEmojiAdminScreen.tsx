import React, { useState } from 'react';
import { ActivityIndicator, Pressable, Text, TextInput, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { WORKER_SKILLS } from '../../constants/skills';
import { getSkillEmojis, updateSkillEmoji } from '../../api/skillEmojisApi';
import { resolveSkillEmoji } from '../../lib/skillEmojis';

/**
 * extensiones/08-emojis-configurables-por-skill.md: excepción puntual al orden del backlog del
 * backend (nota cruzada en worker-on-demand/DOCS/specs/extensiones/03-panel-administracion-ops.md)
 * — acotada a editar el emoji de las 4 skills existentes, nada del resto del panel Ops.
 * extensiones/07-rediseno-visual-y-animaciones.md: mismo lenguaje visual que el resto de la app
 * rediseñada (cards, motion) — pedido explícito de Pilu 2026-09-10.
 */
export function SkillEmojiAdminScreen() {
  const queryClient = useQueryClient();
  const skillEmojisQuery = useQuery({ queryKey: ['skill-emojis'], queryFn: getSkillEmojis });

  return (
    <View>
      <Text className="mb-3 text-lg font-semibold text-neutral-900">Emoji por skill</Text>
      {skillEmojisQuery.isLoading ? (
        <ActivityIndicator />
      ) : (
        <View className="gap-3">
          {WORKER_SKILLS.map((skill, index) => (
            <SkillEmojiRow
              key={skill.value}
              skillCode={skill.value}
              label={skill.label}
              currentEmoji={resolveSkillEmoji(skill.value, skillEmojisQuery.data) ?? ''}
              animationDelay={40 * index}
              onSaved={() => queryClient.invalidateQueries({ queryKey: ['skill-emojis'] })}
            />
          ))}
        </View>
      )}
    </View>
  );
}

interface SkillEmojiRowProps {
  skillCode: string;
  label: string;
  currentEmoji: string;
  animationDelay: number;
  onSaved: () => void;
}

function SkillEmojiRow({ skillCode, label, currentEmoji, animationDelay, onSaved }: SkillEmojiRowProps) {
  const [emoji, setEmoji] = useState(currentEmoji);
  const mutation = useMutation({
    mutationFn: () => updateSkillEmoji(skillCode, emoji),
    onSuccess: onSaved,
  });

  return (
    <Animated.View
      entering={FadeInDown.duration(300).delay(animationDelay)}
      className="flex-row items-center gap-3 rounded-2xl border border-neutral-100 bg-white p-4"
    >
      <Text className="flex-1 text-base font-medium text-neutral-900">{label}</Text>
      <TextInput
        accessibilityLabel={`Emoji de ${label}`}
        value={emoji}
        onChangeText={setEmoji}
        maxLength={8}
        className="w-16 rounded-xl border border-neutral-300 px-3 py-2 text-center text-lg"
      />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Guardar emoji de ${label}`}
        accessibilityState={{ disabled: mutation.isPending }}
        disabled={mutation.isPending}
        onPress={() => mutation.mutate()}
        className={`items-center rounded-xl px-3 py-2 ${mutation.isPending ? 'bg-emerald-300' : 'bg-emerald-600'}`}
      >
        {mutation.isPending ? (
          <ActivityIndicator color="white" size="small" />
        ) : (
          <Text className="text-sm font-semibold text-white">Guardar</Text>
        )}
      </Pressable>
      {mutation.isError ? (
        <Text accessibilityRole="alert" className="text-sm text-red-600">
          No se pudo guardar.
        </Text>
      ) : null}
    </Animated.View>
  );
}
