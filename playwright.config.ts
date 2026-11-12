import { defineConfig, devices } from '@playwright/test';

/** The port of the production server that the end-to-end tests run against. */
const PORT = 4318;

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['list']] : 'list',
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  // Run `npm run build` first: the tests check the production build, as Vercel serves it.
  webServer: {
    command: `npx next start -p ${PORT}`,
    url: `http://localhost:${PORT}/en/simulator`,
    reuseExistingServer: !process.env.CI,
  },
});
