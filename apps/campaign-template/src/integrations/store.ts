import { create } from 'zustand';
import { createInitialAppState } from '../activity/initial-state';
import { activityReducer } from '../activity/reducer';
import type { AppAction, AppState } from '../activity/types';

export interface AppStore {
  appState: AppState;
  dispatch: (action: AppAction) => void;
  setAppState: (state: AppState) => void;
  loadCampaign: () => Promise<void>;
}

export const useStore = create<AppStore>((set) => ({
  appState: createInitialAppState(),

  dispatch: (action) =>
    set((state) => ({
      appState: activityReducer(state.appState, action),
    })),

  setAppState: (appState) => set({ appState }),

  loadCampaign: async () => {
    set({
      appState: createInitialAppState(),
    });
  },
}));
