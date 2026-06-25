import { defineConfig, type UserConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';
import mobile from 'postcss-mobile-forever';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..', '..', '..');

interface CampaignViteOptions {
  port?: number;
}

export function defineCampaignConfig(options: CampaignViteOptions = {}): UserConfig {
  const { port = 5173 } = options;

  return defineConfig({
    plugins: [react()],
    resolve: {
      alias: {
        '@new-type/hooks': path.resolve(ROOT, 'packages/hooks/src/index.ts'),
      },
    },
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
