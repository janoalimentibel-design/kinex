import { defineConfig } from '@playwright/test';

// E2E contra el build de producción (con service worker), en viewport móvil 390×844.
export default defineConfig({
  testDir: 'e2e',
  timeout: 30_000,
  fullyParallel: true,
  use: {
    baseURL: 'http://127.0.0.1:4380',
    viewport: { width: 390, height: 844 },
  },
  webServer: {
    command: 'npm run preview -- --port 4380 --strictPort',
    port: 4380,
    reuseExistingServer: true,
  },
});
