import type { AppState, DomainState, UiState } from './types';
import { DEFAULT_LANG } from '../i18n';

interface InitialStateInput {
  domain?: Partial<DomainState>;
  ui?: Partial<UiState>;
}

export function createInitialAppState(input: InitialStateInput = {}): AppState {
  return {
    domain: {
      ...input.domain,
    },
    ui: {
      modalStack: [],
      lang: DEFAULT_LANG,
      textDirection: 'ltr',
      ...input.ui,
    },
  };
}
