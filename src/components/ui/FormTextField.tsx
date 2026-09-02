import React from 'react';
import { Text, TextInput, TextInputProps, View } from 'react-native';
import { Control, Controller, FieldPath, FieldValues } from 'react-hook-form';

interface FormTextFieldProps<TFieldValues extends FieldValues>
  extends Omit<TextInputProps, 'onChangeText' | 'onBlur' | 'value'> {
  control: Control<TFieldValues>;
  name: FieldPath<TFieldValues>;
  label: string;
}

export function FormTextField<TFieldValues extends FieldValues>({
  control,
  name,
  label,
  ...inputProps
}: FormTextFieldProps<TFieldValues>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
        <View className="mb-4">
          <Text nativeID={`${name}-label`} className="mb-1 text-sm font-medium text-neutral-700">
            {label}
          </Text>
          <TextInput
            accessibilityLabel={label}
            accessibilityLabelledBy={`${name}-label`}
            accessibilityState={{ disabled: inputProps.editable === false }}
            aria-invalid={!!error}
            onBlur={onBlur}
            onChangeText={onChange}
            value={typeof value === 'string' ? value : ''}
            placeholderTextColor="#9CA3AF"
            className={`rounded-xl border px-4 py-3 text-base text-neutral-900 ${
              error ? 'border-red-500' : 'border-neutral-300'
            }`}
            {...inputProps}
          />
          {error ? (
            <Text accessibilityRole="alert" className="mt-1 text-sm text-red-600">
              {error.message}
            </Text>
          ) : null}
        </View>
      )}
    />
  );
}
