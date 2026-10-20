import { test, expect } from '@playwright/test';

test('has title', async ({ page }) => {
  await page.goto('/');

  await expect(page.locator('h1')).toContainText(
    'Find your next unforgettable journey.'
  );
});
