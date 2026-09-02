import React from 'react';
import { Pressable, Text } from 'react-native';

interface SkillChipProps {
  label: string;
  selected: boolean;
  onPress: () => void;
}

export function SkillChip({ label, selected, onPress }: SkillChipProps) {
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected }}
      accessibilityLabel={label}
      onPress={onPress}
      className={`mb-2 mr-2 rounded-full border px-4 py-2 ${
        selected ? 'border-emerald-600 bg-emerald-600' : 'border-neutral-300 bg-white'
      }`}
    >
      <Text className={selected ? 'font-medium text-white' : 'text-neutral-700'}>{label}</Text>
    </Pressable>
  );
}
