export type CheckMode = 'CHECK_IN' | 'CHECK_OUT';

export type ScreenStatus =
  | { kind: 'scanning' }
  | { kind: 'validating' }
  | { kind: 'submitting' }
  | { kind: 'out-of-range'; distanceMeters: number }
  | { kind: 'success' }
  | { kind: 'error'; message: string };
