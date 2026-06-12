import type { PlaygroundSection } from './types';

import { HeroSection } from '../designer/sections/HeroSection';
import { defaultContent as heroContent } from '../designer/sections/HeroSection/content';
import {
  HeroLoading,
  HeroEmpty,
  HeroError,
} from '../designer/sections/HeroSection/states';

import { RuleSection } from '../designer/sections/RuleSection';
import { defaultContent as ruleContent } from '../designer/sections/RuleSection/content';
import { RuleLoading } from '../designer/sections/RuleSection/states';

import { PrizeSection } from '../designer/sections/PrizeSection';
import { defaultContent as prizeContent } from '../designer/sections/PrizeSection/content';
import {
  PrizeLoading,
  PrizeEmpty,
  PrizeError,
} from '../designer/sections/PrizeSection/states';

export function registerSections(): PlaygroundSection[] {
  return [
    {
      id: 'hero',
      name: 'HeroSection',
      component: HeroSection,
      defaultContent: heroContent as unknown as Record<string, unknown>,
      stateViews: {
        loading: HeroLoading,
        empty: HeroEmpty,
        error: HeroError,
      },
    },
    {
      id: 'rules',
      name: 'RuleSection',
      component: RuleSection,
      defaultContent: ruleContent as unknown as Record<string, unknown>,
      stateViews: {
        loading: RuleLoading,
      },
    },
    {
      id: 'prize',
      name: 'PrizeSection',
      component: PrizeSection,
      defaultContent: prizeContent as unknown as Record<string, unknown>,
      stateViews: {
        loading: PrizeLoading,
        empty: PrizeEmpty,
        error: PrizeError,
      },
    },
  ];
}
