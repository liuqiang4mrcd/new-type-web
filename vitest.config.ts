import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

const rootDir = path.dirname(fileURLToPath(import.meta.url));

function campaignSrcAlias() {
  return {
    name: 'campaign-src-alias',
    resolveId(source: string, importer?: string) {
      if (!source.startsWith('@/') || !importer) return null;

      const normalizedImporter = importer.split(path.sep).join('/');
      const match = normalizedImporter.match(/\/apps\/([^/]+)\/src\//);
      if (!match) return null;

      return path.resolve(rootDir, 'apps', match[1], 'src', source.slice(2));
    },
  };
}

export default defineConfig({
  plugins: [campaignSrcAlias(), react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    globals: true,
    include: ['apps/*/src/**/*.test.{ts,tsx}', 'packages/*/src/**/*.test.{ts,tsx}'],
    css: true,
  },
});
