import { defineConfig, devices } from '@playwright/test';
import { nxE2EPreset } from '@nx/playwright/preset';
import { workspaceRoot } from '@nx/devkit';
import { fileURLToPath } from 'node:url';

// For CI, you may want to set BASE_URL to the deployed application.
const baseURL = process.env['BASE_URL'] || 'http://localhost:4200';

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  ...nxE2EPreset(fileURLToPath(import.meta.url), { testDir: './src' }),
  testMatch: '**/*.e2e-spec.ts',
  testIgnore: ['**/*.spec.ts', '!**/*.e2e-spec.ts'],
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    baseURL,
    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
    video: 'retain-on-failure'
  },
  /* Run your local dev server before starting the tests */
  webServer: [
    {
      command: 'node apps/ng-frontend-e2e/src/support/start-backend.ts',
      port: 7070,
      reuseExistingServer: false,
      cwd: workspaceRoot,
      timeout: 240_000
    },
    {
      command: 'pnpm exec nx run ng-frontend:serve --port 4200',
      url: 'http://localhost:4200',
      reuseExistingServer: !process.env['CI'],
      cwd: workspaceRoot
    }
  ],
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }
    }
  ]
});
