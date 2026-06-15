import type { CountdownTimerContent } from './types';
import type { StateDeclaration } from '../../../contracts/section';

export const supportedStates: StateDeclaration[] = [
  { key: 'loading', type: 'ui', required: true },
  { key: 'empty', type: 'ui', required: false },
  { key: 'error', type: 'ui', required: true },
  { key: 'beforeStart', type: 'business', required: true },
  { key: 'inProgress', type: 'business', required: true },
  { key: 'ended', type: 'business', required: true },
] as const;

export const stateData: Record<string, Partial<CountdownTimerContent>> = {
  loading: { days: 0, hours: 0, minutes: 0, seconds: 0 },
  empty: {},
  error: { days: 0, hours: 0, minutes: 0, seconds: 0 },
  beforeStart: { days: 7, hours: 0, minutes: 0, seconds: 0 },
  inProgress: { days: 3, hours: 12, minutes: 30, seconds: 45 },
  ended: { days: 0, hours: 0, minutes: 0, seconds: 0 },
};

export const defaultContent: CountdownTimerContent = {
  days: 18,
  hours: 12,
  minutes: 30,
  seconds: 45,
};
