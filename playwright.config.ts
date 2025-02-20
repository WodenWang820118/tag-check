import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './main-process/e2e',
  use: {
    headless: false,
    viewport: null,
    launchOptions: {
      args: ['main.mjs']
    }
  },
  projects: [
    {
      name: 'electron',
      use: {
        browserName: 'chromium',
        contextOptions: {}
      }
    }
  ]
});
