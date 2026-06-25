import { defaultContent as scaffoldContent } from '../designer/sections/ScaffoldSection/content';
import type { RuntimeViewState } from '../integrations/store';
import { getCurrentCampaignLocale } from '../i18n';

export function createPreviewRuntimeState(): RuntimeViewState {
  const locale = getCurrentCampaignLocale();

  return {
    domain: {},
    ui: {
      modalStack: [],
      lang: locale.lang,
      textDirection: locale.dir,
    },
    sections: {
      scaffold: {
        status: 'ready',
        content: scaffoldContent,
      },
    },
  };
}
