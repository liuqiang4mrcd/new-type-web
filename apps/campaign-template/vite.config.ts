import { mergeConfig } from 'vite';
import { defineCampaignConfig } from '@new-type/config/vite/campaign-base';
import { fileURLToPath, URL } from 'node:url';

export default mergeConfig(defineCampaignConfig({ port: 5173 }), {
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
});
