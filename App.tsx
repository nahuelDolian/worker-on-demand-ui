import './global.css';
import React from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';
import { queryClient } from './src/lib/queryClient';
import { WorkerOnboardingScreen } from './src/screens/onboarding/WorkerOnboardingScreen';

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <WorkerOnboardingScreen />
      <StatusBar style="auto" />
    </QueryClientProvider>
  );
}
