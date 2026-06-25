import { ScaffoldSection } from '../../designer/sections/ScaffoldSection';
import { useStore } from '../../integrations/store';

export function ScaffoldContainer() {
  const section = useStore((s) => s.sections.scaffold);

  if (!section) return null;

  switch (section.status) {
    case 'ready':
      if (!section.content) return null;
      return <ScaffoldSection content={section.content} />;
    default:
      return null;
  }
}
