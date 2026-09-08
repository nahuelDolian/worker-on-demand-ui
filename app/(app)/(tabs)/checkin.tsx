import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CheckInScreen } from '../../../src/screens/checkin/CheckInScreen';
import type { CheckMode } from '../../../src/screens/checkin/types';

/** Hace alcanzable a `CheckInScreen` (`esenciales/02-navegacion-y-enrutamiento.md`, criterio de
 * aceptación) — antes existía pero no había forma de llegar a ella. Un toggle simple habilita
 * tanto check-in como check-out, en vez de fijar el modo de forma hardcodeada. */
export default function CheckInTabScreen() {
  const [mode, setMode] = useState<CheckMode>('CHECK_IN');

  return (
    <View className="flex-1 bg-black">
      <SafeAreaView edges={['top']} className="z-10 flex-row bg-black px-4 pt-2">
        <ModeButton label="Check-in" active={mode === 'CHECK_IN'} onPress={() => setMode('CHECK_IN')} />
        <ModeButton label="Check-out" active={mode === 'CHECK_OUT'} onPress={() => setMode('CHECK_OUT')} />
      </SafeAreaView>
      <CheckInScreen key={mode} mode={mode} />
    </View>
  );
}

function ModeButton({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      className={`mr-2 rounded-full px-4 py-2 ${active ? 'bg-emerald-600' : 'bg-neutral-800'}`}
    >
      <Text className={`text-sm font-medium ${active ? 'text-white' : 'text-neutral-300'}`}>{label}</Text>
    </Pressable>
  );
}
