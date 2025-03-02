import { test, expect } from '@playwright/test';
const { _electron: electron } = require('playwright');

test.describe('Electron App', () => {
  test('should open the app', async () => {
    // Launch Electron app.
    test.setTimeout(120000);
    const electronApp = await electron.launch({
      args: ['main.js'],
      env: {
        ...process.env,
        NODE_ENV: 'dev'
      }
    });

    // Evaluation expression in the Electron context.
    // Wait for the first window
    /** @type {Page} */
    const firstWindow = await electronApp.firstWindow();
    console.log('First window title:', await firstWindow.title());
    // console.log('Electron app: ', electronApp);

    // Wait for the second window (main window)
    const mainWindow = await electronApp.waitForEvent('window', {
      timeout: 120000, // 60 seconds timeout for waiting for the main window
      predicate: async (page: any) => {
        const title = await page.title();
        return title !== 'Loading'; // Assuming the loading window has a title 'Loading'
      }
    });

    console.log('Main window title:', await mainWindow.title());

    // Take a screenshot to verify the window is visible
    await mainWindow.screenshot({ path: 'electron-window.png' });
    await electronApp.close();
  });
});
