import { defaultContent as scaffoldContent } from '../designer/sections/ScaffoldSection/content';
import type { RuntimeViewState } from '../integrations/store';

export function createPreviewRuntimeState(): RuntimeViewState {
  return {
    domain: {},
    ui: {
      modalStack: [],
    },
    sections: {
      scaffold: {
        status: 'ready',
        content: scaffoldContent,
      },
    },
  };
}
