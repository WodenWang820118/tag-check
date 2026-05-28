import { test, expect } from '@playwright/test';

test('has title', async ({ page }) => {
  await page.goto('/');

  await expect(page.locator('h1')).toContainText(
    'Travel-booking flows rebuilt on Tailwind v4 and PrimeNG.'
  );
});
