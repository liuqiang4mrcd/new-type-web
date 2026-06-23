import type { AppState, SectionStateMap } from '../types';
import { selectScaffoldSection } from './scaffold';

export { selectScaffoldSection };

export function selectSectionState<K extends keyof SectionStateMap>(
  state: AppState,
  sectionId: K,
): SectionStateMap[K] {
  switch (sectionId) {
    case 'scaffold':
      return selectScaffoldSection(state) as SectionStateMap[K];
    default:
      throw new Error(`Unknown section: ${String(sectionId)}`);
  }
}
