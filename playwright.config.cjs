const { defineConfig } = require('@playwright/test');
const path = require('path');

module.exports = defineConfig({
  testDir: './main-process/e2e',
  use: {
    headless: false,
    viewport: null,
    launchOptions: {
      args: ['main.cjs'],
    },
  },
  projects: [
    {
      name: 'electron',
      use: {
        browserName: 'electron',
        contextOptions: {
          electron: true,
        },
      },
    },
  ],
});
