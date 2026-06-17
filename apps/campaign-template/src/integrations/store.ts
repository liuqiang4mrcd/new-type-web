import { create } from 'zustand';
import type { SectionState } from '../contracts/section';
import type { ScaffoldContent } from '../designer/sections/ScaffoldSection/types';
import { defaultContent as scaffoldContent } from '../designer/sections/ScaffoldSection/content';

export interface AppStore {
  scaffold: SectionState<ScaffoldContent>;
  loadCampaign: () => Promise<void>;
}

export const useStore = create<AppStore>((set) => ({
  scaffold: { status: 'ready', content: scaffoldContent },

  loadCampaign: async () => {
    set({
      scaffold: {
        status: 'ready',
        content: scaffoldContent,
      },
    });
  },
}));
