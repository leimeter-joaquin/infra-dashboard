import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  // Start all three services before e2e tests
  webServer: [
    {
      command: 'pnpm --filter @infra-dashboard/server dev',
      port: 4321,
      reuseExistingServer: !process.env.CI,
    },
    {
      command: 'pnpm --filter @infra-dashboard/agent dev',
      port: 4322,
      reuseExistingServer: !process.env.CI,
    },
    {
      command: 'pnpm --filter @infra-dashboard/web dev',
      port: 3000,
      reuseExistingServer: !process.env.CI,
    },
  ],
});
