import { useStore } from '../../integrations/store';
import { RuleSection } from '../../designer/sections/RuleSection';
import { RuleLoading } from '../../designer/sections/RuleSection/states';

export function RuleContainer() {
  const rules = useStore((s) => s.rules);

  switch (rules.status) {
    case 'loading':
      return <RuleLoading />;
    case 'error':
    case 'empty':
      return null;
    case 'ready':
      return <RuleSection content={rules.content!} />;
  }
}
