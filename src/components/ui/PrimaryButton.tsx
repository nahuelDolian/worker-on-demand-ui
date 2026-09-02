import React from 'react';
import { ActivityIndicator, Pressable, Text } from 'react-native';

interface PrimaryButtonProps {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  accessibilityHint?: string;
}

export function PrimaryButton({ label, onPress, loading, disabled, accessibilityHint }: PrimaryButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      accessibilityHint={accessibilityHint}
      onPress={onPress}
      disabled={isDisabled}
      className={`mb-8 items-center rounded-xl py-4 ${isDisabled ? 'bg-emerald-300' : 'bg-emerald-600'}`}
    >
      {loading ? (
        <ActivityIndicator color="white" />
      ) : (
        <Text className="text-base font-semibold text-white">{label}</Text>
      )}
    </Pressable>
  );
}
