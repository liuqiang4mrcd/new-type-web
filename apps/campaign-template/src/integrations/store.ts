import { create } from "zustand";
import { createInitialAppState } from "../activity/initial-state";
import { activityReducer } from "../activity/reducer";
import type {
  AppAction,
  AppState,
  DomainState,
  SectionStateMap,
  UiState,
} from "../activity/types";
import { adaptCampaignInfo } from "./adapters/campaignInfo.adapter";
import { getCampaignInfo } from "./api";
import { getCurrentCampaignLocale } from "../i18n";

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

function createTemplateAppState() {
  const locale = getCurrentCampaignLocale();

  return createInitialAppState({
    domain: {
      sections: {},
    },
    ui: {
      lang: locale.lang,
      textDirection: locale.dir,
    },
  });
}

function createTemplateSections(): Partial<SectionStateMap> {
  return {
    scaffold: {
      status: "loading",
    },
  };
}

function toAppState(
  state: Pick<AppStore, "domain" | "ui" | "sections">,
): AppState {
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

    try {
      const campaignInfo = await getCampaignInfo();
      set((state) => ({
        sections: {
          ...state.sections,
          scaffold: adaptCampaignInfo(campaignInfo),
        },
      }));
    } catch (error) {
      set((state) => ({
        sections: {
          ...state.sections,
          scaffold: {
            status: "error",
            error: "campaign_load_failed",
          },
        },
      }));
    }
  },
}));
