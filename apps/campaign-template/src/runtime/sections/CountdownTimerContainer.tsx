import { useStore } from '../../integrations/store';
import { CountdownTimer } from '../../designer/sections/CountdownTimer';
import {
  CountdownTimerLoading,
  CountdownTimerEmpty,
  CountdownTimerError,
} from '../../designer/sections/CountdownTimer/states';

export function CountdownTimerContainer() {
  const countdownTimer = useStore((s) => s.countdownTimer);

  switch (countdownTimer.status) {
    case 'loading':
      return <CountdownTimerLoading />;
    case 'error':
      return <CountdownTimerError message={countdownTimer.error} />;
    case 'empty':
      return <CountdownTimerEmpty />;
    case 'ready':
      return <CountdownTimer content={countdownTimer.content!} />;
  }
}
