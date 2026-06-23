import type { SectionState } from '../../contracts/section';
import { defaultContent } from '../../designer/sections/ScaffoldSection/content';
import type { ScaffoldContent } from '../../designer/sections/ScaffoldSection/types';
import type { AppState } from '../types';

export function selectScaffoldSection(_state: AppState): SectionState<ScaffoldContent> {
  return {
    status: 'ready',
    content: defaultContent,
  };
}
