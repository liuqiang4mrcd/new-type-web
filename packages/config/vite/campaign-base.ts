import { defineConfig, type UserConfig } from 'vite';
import react from '@vitejs/plugin-react';
import postcssPxToViewport from 'postcss-px-to-viewport';

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
          postcssPxToViewport({
            viewportWidth: 375,
            unitPrecision: 5,
            viewportUnit: 'vw',
            fontViewportUnit: 'vw',
            selectorBlackList: [],
            minPixelValue: 1,
            mediaQuery: false,
          }),
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
