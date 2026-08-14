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
    // Fuerza IPv4: baseURL usa 127.0.0.1 y, en algunos entornos, Vite resuelve
    // localhost solo a ::1, dejando las pruebas sin servidor aunque haya arrancado.
    command: 'npm run preview -- --host 127.0.0.1 --port 4380 --strictPort',
    port: 4380,
    reuseExistingServer: true,
  },
});
