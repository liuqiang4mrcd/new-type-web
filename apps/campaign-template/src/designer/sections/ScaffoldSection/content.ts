import type { StateDeclaration } from '../../../contracts/section';
import { DEFAULT_LANG, getI18nMessages } from '../../../i18n';
import type { ScaffoldContent } from './types';

export const supportedStates: StateDeclaration[] = [
  { key: 'draft', type: 'business', required: true },
] as const;

const scaffoldMessages = getI18nMessages(DEFAULT_LANG).scaffold;

export const defaultContent: ScaffoldContent = {
  title: scaffoldMessages.title,
  description: scaffoldMessages.description,
  checklist: scaffoldMessages.checklist,
};

export const stateData: Record<string, Partial<ScaffoldContent>> = {
  draft: defaultContent,
};
