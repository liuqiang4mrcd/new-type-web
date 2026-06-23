import type { AppState, DomainState, UiState } from './types';

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
      ...input.ui,
    },
  };
}
