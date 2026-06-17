import { ScaffoldSection } from '../../designer/sections/ScaffoldSection';
import { defaultContent } from '../../designer/sections/ScaffoldSection/content';
import { useStore } from '../../integrations/store';

export function ScaffoldContainer() {
  const section = useStore((s) => s.scaffold);

  switch (section.status) {
    case 'ready':
      return <ScaffoldSection content={section.content ?? defaultContent} />;
    default:
      return <ScaffoldSection content={defaultContent} />;
  }
}
