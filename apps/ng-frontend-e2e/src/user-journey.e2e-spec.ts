import { expect, test } from '@playwright/test';
import { fileURLToPath } from 'node:url';

const recordingFixturePath = fileURLToPath(
  new URL('./fixtures/add_to_cart.json', import.meta.url)
);

test.describe('user journey', () => {
  test.setTimeout(300_000);
  test.use({ viewport: { width: 1600, height: 1000 } });

  test('walks a new user journey against real backend', async ({
    page
  }, testInfo) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (error) => {
      pageErrors.push(String(error));
    });

    let csvPath = '';

    await test.step('create new project', async () => {
      await page.goto('/init-project');
      await page.getByTestId('new-project-name').fill('Request Off');
      await page.getByTestId('new-project-measurement-id').fill('G-8HKQR5ZBSK');
      await page.getByTestId('new-project-submit').click();
      await expect(page).toHaveURL(/\/projects\/[^/]+$/);
    });

    await test.step('configure pre-loading values', async () => {
      await page.getByTestId('nav-settings').click();
      await page.getByTestId('nav-settings-preloading-values').click();
      await expect(page.getByTestId('preload-website-url')).toBeVisible();

      await page
        .getByTestId('preload-website-url')
        .fill('https://ng-gtm-sample.vercel.app/home');

      const storage = page.getByTestId('preload-local-storage');
      const storageEntries: [string, string][] = [
        ['consent', 'true'],
        [
          'consentPreferences',
          JSON.stringify({
            ad_storage: true,
            analytics_storage: true,
            ad_user_data: true,
            ad_personalization: false
          })
        ]
      ];

      for (const [i, [key, value]] of storageEntries.entries()) {
        await page.getByRole('button', { name: 'Add local storage' }).click();
        await storage.getByLabel('Key', { exact: true }).nth(i).fill(key);
        await storage.getByLabel('Value', { exact: true }).nth(i).fill(value);
      }

      // Request Check stays off (the default for a new project).
      const saveResponsePromise = page.waitForResponse(
        (response) =>
          response.url().includes('/settings/') && response.status() === 200
      );
      await page.getByRole('button', { name: 'Save' }).click();
      await saveResponsePromise;
    });

    await test.step('write plan in Tag Build and download CSV', async () => {
      await page.getByTestId('nav-tagbuild').click();
      await page.getByTestId('tagbuild-write-plan').click();

      const eventName0 = page.getByTestId('plan-editor-event-name-0');
      await eventName0.waitFor({ state: 'visible' });
      // Allow dialog open animation to settle before sequential typing.
      await page.waitForTimeout(300);

      await eventName0.pressSequentially('add_to_cart');
      await page
        .getByTestId('plan-editor-event-parameters-0')
        .pressSequentially('currency=USD, value');
      await page
        .getByTestId('plan-editor-item-parameters-0')
        .pressSequentially('item_id, item_name, price, quantity');

      await page.getByTestId('plan-editor-add').click();
      const eventName1 = page.getByTestId('plan-editor-event-name-1');
      await eventName1.waitFor({ state: 'visible' });

      await eventName1.pressSequentially('begin_checkout');
      await page
        .getByTestId('plan-editor-event-parameters-1')
        .pressSequentially('currency=USD, value');
      await page
        .getByTestId('plan-editor-item-parameters-1')
        .pressSequentially('item_id, item_name, price, quantity');

      const downloadPromise = page.waitForEvent('download');
      await page.getByTestId('plan-editor-download').click();
      const download = await downloadPromise;
      csvPath = testInfo.outputPath(download.suggestedFilename());
      await download.saveAs(csvPath);

      await page
        .locator('mat-dialog-actions')
        .getByRole('button', { name: 'Close' })
        .click();
      await expect(page.getByTestId('plan-editor-download')).toBeHidden();
    });

    await test.step('upload CSV into Tag Build', async () => {
      await page.locator('lib-upload-action button').first().click();
      const chooserPromise = page.waitForEvent('filechooser');
      await page.getByRole('button', { name: /Upload File/ }).click();
      const chooser = await chooserPromise;
      await chooser.setFiles(csvPath);

      await expect(page.getByTestId('tagbuild-input')).toContainText(
        'add_to_cart'
      );
      await expect(page.getByTestId('tagbuild-input')).toContainText(
        'begin_checkout'
      );
    });

    await test.step('set measurement ID, convert and import into project', async () => {
      await page.getByText('Google Tag', { exact: true }).click();
      // Allow accordion panel to expand before filling measurement ID.
      await page.waitForTimeout(300);

      const midInput = page.getByLabel('Use Existing Measurement ID');
      await midInput.fill('G-8HKQR5ZBSK');

      await page.getByTestId('tagbuild-convert').click();
      const importButton = page.getByTestId('tagbuild-import-project');
      await expect(importButton).toBeVisible();

      await importButton.click();
      await expect(importButton).toBeHidden();
    });

    await test.step('open test and upload Chrome recording', async () => {
      await page.getByTestId('nav-tests').click();
      const testLink = page.getByTestId('test-link-add_to_cart');
      await expect(testLink).toBeVisible();
      await testLink.click();

      const detailFiles = page.getByTestId('detail-test-files');
      await expect(detailFiles).toBeVisible();
      await detailFiles.click();

      // Allow accordion expansion animation to complete.
      await page.waitForTimeout(300);

      const panel = page.getByTestId('panel-chrome-recording');
      await panel.locator('mat-expansion-panel-header').click();

      // Allow panel expansion animation to reveal edit button.
      await page.waitForTimeout(300);

      const editButton = panel.locator('button.edit');
      await expect(editButton).toBeVisible();
      await editButton.click();

      const uploadButton = panel.getByRole('button', { name: 'Upload' });
      await expect(uploadButton).toBeVisible();

      const recordingChooserPromise = page.waitForEvent('filechooser');
      await uploadButton.click();
      const recordingChooser = await recordingChooserPromise;
      await recordingChooser.setFiles(recordingFixturePath);

      const saveButton = panel.getByRole('button', { name: 'Save' });
      await expect(saveButton).toBeEnabled();
      await saveButton.click();
      await expect(saveButton).toBeHidden();
    });

    await test.step('run test from tests page and assert results', async () => {
      await page.getByTestId('nav-tests').click();
      const runButton = page.getByTestId('run-test-add_to_cart');
      await expect(runButton).toBeVisible();
      await runButton.click();

      const statusCell = page.getByTestId('test-status-add_to_cart');
      await expect(statusCell).toHaveText(/passed/i, { timeout: 150_000 });
      await expect(statusCell).not.toHaveText(/failed/i);
      await expect(statusCell).not.toHaveText(/partial/i);

      await page.getByTestId('test-link-add_to_cart').click();
      await expect(page.getByTestId('run-check-request')).toHaveText(
        /not checked/i
      );
      await expect(page.getByTestId('ga4-request-not-checked')).toBeVisible();

      await page.getByTestId('nav-reports').click();
      await expect(page.locator('table').first()).toContainText(/passed/i);
    });

    expect(pageErrors).toEqual([]);
  });
});
