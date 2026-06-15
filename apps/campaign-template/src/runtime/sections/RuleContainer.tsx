import { useStore } from '../../integrations/store';
import { RuleSection } from '../../designer/sections/RuleSection';
import {
  RuleLoading,
  RuleEmpty,
  RuleError,
} from '../../designer/sections/RuleSection/states';

export function RuleContainer() {
  const rules = useStore((s) => s.rules);

  switch (rules.status) {
    case 'loading':
      return <RuleLoading />;
    case 'error':
      return <RuleError message={rules.error} />;
    case 'empty':
      return <RuleEmpty />;
    case 'ready':
      return <RuleSection content={rules.content!} />;
  }
}
