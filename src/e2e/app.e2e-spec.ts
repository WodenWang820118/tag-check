import { test, Page, ElectronApplication } from '@playwright/test';
import { _electron as electron } from 'playwright';

test('should open the app', async () => {
  // Launch Electron app.
  test.setTimeout(120000);
  const electronApp: ElectronApplication = await electron.launch({
    args: ['.vite/build/main.mjs'],
    env: {
      ...process.env,
      NODE_ENV: 'dev'
    }
  });

  // Evaluation expression in the Electron context.
  // Wait for the first window
  const firstWindow: Page = await electronApp.firstWindow();
  console.log('First window title:', await firstWindow.title());
  console.log('Electron app: ', electronApp);

  // Wait for the second window (main window)
  const mainWindow: Page = await electronApp.waitForEvent('window', {
    timeout: 120000, // 60 seconds timeout for waiting for the main window
    predicate: async (page: Page): Promise<boolean> => {
      const title = await page.title();
      return title !== 'Loading'; // Assuming the loading window has a title 'Loading'
    }
  });

  console.log('Main window title:', await mainWindow.title());

  // Take a screenshot to verify the window is visible
  await new Promise<void>((resolve) => setTimeout(resolve, 5000));
  await mainWindow.screenshot({ path: 'electron-window.png' });

  await electronApp.close();
});
