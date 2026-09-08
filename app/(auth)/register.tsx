import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PersonalInfoStep } from '../../src/screens/onboarding/steps/PersonalInfoStep';
import { RestaurantRegisterStep } from '../../src/screens/onboarding/steps/RestaurantRegisterStep';

type RegisterRole = 'WORKER' | 'RESTAURANT';

export default function Register() {
  const [role, setRole] = useState<RegisterRole>('WORKER');

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['bottom']}>
      <View className="flex-row px-5 pb-2 pt-4">
        <RoleTab label="Soy trabajador" active={role === 'WORKER'} onPress={() => setRole('WORKER')} />
        <RoleTab label="Soy restaurante" active={role === 'RESTAURANT'} onPress={() => setRole('RESTAURANT')} />
      </View>
      {role === 'WORKER' ? <PersonalInfoStep /> : <RestaurantRegisterStep />}
    </SafeAreaView>
  );
}

function RoleTab({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      className={`mr-2 rounded-full px-4 py-2 ${active ? 'bg-emerald-600' : 'bg-neutral-100'}`}
    >
      <Text className={`text-sm font-medium ${active ? 'text-white' : 'text-neutral-600'}`}>{label}</Text>
    </Pressable>
  );
}
