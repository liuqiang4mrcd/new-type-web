import type { PlaygroundSection } from './types';

import { ScaffoldSection } from '../designer/sections/ScaffoldSection';
import { defaultContent as scaffoldContent } from '../designer/sections/ScaffoldSection/content';

export function registerSections(): PlaygroundSection[] {
  return [
    {
      id: 'scaffold',
      name: 'ScaffoldSection',
      component: ScaffoldSection,
      defaultContent: scaffoldContent as unknown as Record<string, unknown>,
      stateViews: {},
    },
  ];
}
