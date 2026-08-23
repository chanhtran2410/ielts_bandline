import { defineConfig, devices } from '@playwright/test';

/**
 * Defaults to the dev server. Set E2E_PORT (and E2E_COMMAND=start) to run the
 * same suite against a production build — worth doing before a first deploy,
 * since dev and prod hydrate differently.
 */
const PORT = Number(process.env.E2E_PORT ?? 3131);
const baseURL = 'http://localhost:' + PORT;
const command =
  process.env.E2E_COMMAND === 'start'
    ? 'npx next start --port ' + PORT
    : 'npx next dev --port ' + PORT;

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: process.env.CI ? 'line' : [['list']],
  use: {
    baseURL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 900 } } },
    { name: 'mobile', use: { ...devices['Pixel 5'] } },
  ],
  webServer: {
    command,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
