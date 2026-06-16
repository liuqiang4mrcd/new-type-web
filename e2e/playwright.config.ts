import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: '.',
  timeout: 30000,
  fullyParallel: false,
  retries: 1,
  use: {
    baseURL: 'http://localhost:5174',
    headless: true,
    viewport: { width: 390, height: 844 }, // iPhone 14 Pro
  },
  webServer: {
    command: 'pnpm exec nx dev campaign-2026-money-rain --port 5174',
    url: 'http://localhost:5174',
    reuseExistingServer: !process.env.CI,
    timeout: 30000,
  },
});
