import { defineConfig, type UserConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';
import mobile from 'postcss-mobile-forever';

interface CampaignViteOptions {
  port?: number;
}

export function defineCampaignConfig(options: CampaignViteOptions = {}): UserConfig {
  const { port = 5173 } = options;

  return defineConfig({
    plugins: [react()],
    css: {
      postcss: {
        plugins: [
          tailwindcss(),
          mobile({
            viewportWidth: 750,
            appSelector: '#app',
            maxDisplayWidth: 580,
            unitPrecision: 5,
            selectorBlackList: [],
          }),
          autoprefixer(),
        ],
      },
    },
    server: {
      port,
      host: true,
    },
    build: {
      outDir: 'dist',
      sourcemap: false,
      rollupOptions: {
        output: {
          manualChunks: undefined,
        },
      },
    },
  });
}
