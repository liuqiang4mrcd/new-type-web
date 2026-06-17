import type { StateDeclaration } from '../../../contracts/section';
import type { ScaffoldContent } from './types';

export const supportedStates: StateDeclaration[] = [
  { key: 'draft', type: 'business', required: true },
] as const;

export const defaultContent: ScaffoldContent = {
  title: 'Campaign Scaffold',
  description:
    'Replace this neutral scaffold with real Sections after the component design cards are confirmed.',
  checklist: [
    'Define each Section purpose before writing code.',
    'Declare only states that really exist.',
    'Validate one Section before starting the next.',
  ],
};

export const stateData: Record<string, Partial<ScaffoldContent>> = {
  draft: defaultContent,
};
