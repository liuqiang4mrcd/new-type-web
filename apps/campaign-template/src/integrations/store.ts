import { create } from 'zustand';
import { createInitialAppState } from '../activity/initial-state';
import { activityReducer } from '../activity/reducer';
import type { AppAction, AppState, DomainState, SectionStateMap, UiState } from '../activity/types';
import type { ScaffoldContent } from '../designer/sections/ScaffoldSection/types';

export interface AppStore {
  domain: DomainState;
  ui: UiState;
  sections: Partial<SectionStateMap>;
  dispatch: (action: AppAction) => void;
  setRuntimeState: (state: RuntimeViewState) => void;
  setAppState: (state: AppState) => void;
  mergeDomain: (domain: Partial<DomainState>) => void;
  mergeSections: (sections: Partial<SectionStateMap>) => void;
  loadCampaign: () => Promise<void>;
}

export interface RuntimeViewState {
  domain: DomainState;
  ui: UiState;
  sections: Partial<SectionStateMap>;
}

const scaffoldContent: ScaffoldContent = {
  title: 'Campaign Template',
  description: 'Replace this scaffold section with campaign-specific sections.',
  checklist: [
    'Define each Section purpose before writing code.',
    'Keep design sample data out of runtime fallbacks.',
    'Validate one Section before starting the next.',
  ],
};

function createTemplateAppState() {
  return createInitialAppState({
    domain: {
      sections: {},
    },
  });
}

function createTemplateSections(): Partial<SectionStateMap> {
  return {
    scaffold: {
      status: 'ready',
      content: scaffoldContent,
    },
  };
}

function toAppState(state: Pick<AppStore, 'domain' | 'ui' | 'sections'>): AppState {
  return {
    domain: {
      ...state.domain,
      sections: state.sections,
    },
    ui: state.ui,
  };
}

function applyAppState(appState: AppState): RuntimeViewState {
  return {
    domain: {
      ...appState.domain,
      sections: undefined,
    },
    ui: appState.ui,
    sections: appState.domain.sections ?? {},
  };
}

const initialAppState = createTemplateAppState();

export const useStore = create<AppStore>((set) => ({
  domain: initialAppState.domain,
  ui: initialAppState.ui,
  sections: createTemplateSections(),

  dispatch: (action) =>
    set((state) => ({
      ...applyAppState(activityReducer(toAppState(state), action)),
    })),

  setRuntimeState: (runtimeState) =>
    set({
      domain: {
        ...runtimeState.domain,
        sections: undefined,
      },
      ui: runtimeState.ui,
      sections: runtimeState.sections,
    }),

  setAppState: (appState) => set(applyAppState(appState)),

  mergeDomain: (domain) =>
    set((state) => ({
      domain: {
        ...state.domain,
        ...domain,
        sections: undefined,
      },
    })),

  mergeSections: (sections) =>
    set((state) => ({
      sections: {
        ...state.sections,
        ...sections,
      },
    })),

  loadCampaign: async () => {
    const appState = createTemplateAppState();
    set({
      ...applyAppState(appState),
      sections: createTemplateSections(),
    });
  },
}));
