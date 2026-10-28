import { defineConfig, devices } from '@playwright/test';

/**
 * E2E y capturas visuales. Espera el web en :5173 (bun run dev) con el API
 * levantado. `bun run test:e2e` corre ambos tamaños de referencia.
 */
export default defineConfig({
  testDir: './e2e',
  outputDir: './e2e/resultados',
  fullyParallel: false,
  workers: 1,
  timeout: 60_000,
  reporter: [['list']],
  use: {
    baseURL: process.env.E2E_BASE_URL ?? 'http://localhost:5173',
    locale: 'es-CL',
    timezoneId: 'America/Santiago',
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'escritorio', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } } },
    { name: 'movil', use: { ...devices['Pixel 7'], viewport: { width: 390, height: 844 } } },
  ],
});
