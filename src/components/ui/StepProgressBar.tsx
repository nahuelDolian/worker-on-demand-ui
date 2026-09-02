import React from 'react';
import { View } from 'react-native';

interface StepProgressBarProps {
  currentStepIndex: number;
  totalSteps: number;
  stepLabels: string[];
}

export function StepProgressBar({ currentStepIndex, totalSteps, stepLabels }: StepProgressBarProps) {
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 1, max: totalSteps, now: currentStepIndex + 1 }}
      accessibilityLabel={`Paso ${currentStepIndex + 1} de ${totalSteps}: ${stepLabels[currentStepIndex]}`}
      className="mb-6 flex-row px-5"
    >
      {stepLabels.map((label, index) => (
        <View key={label} className="mr-2 flex-1">
          <View className={`h-1.5 rounded-full ${index <= currentStepIndex ? 'bg-emerald-600' : 'bg-neutral-200'}`} />
        </View>
      ))}
    </View>
  );
}
