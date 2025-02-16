import { test, expect } from '@playwright/test';

test('has title', async ({ page }) => {
  await page.goto('https://playwright.dev/');

  // Expect a title "to contain" a substring.
  await expect(page).toHaveTitle(/Playwright/);
});

test('get started link', async ({ page }) => {
  await page.goto('https://playwright.dev/');

  // Click the get started link.
  await page.getByRole('link', { name: 'Get started' }).click();

  // Expects page to have a heading with the name of Installation.
  await expect(
    page.getByRole('heading', { name: 'Installation' })
  ).toBeVisible();
});

test('CRUD project', async ({ page }) => {
  await page.goto('http://localhost:4200');

  const addProjectButton = page.locator('#new-project-button');
  // Click the add project button.
  await addProjectButton.click();

  // Fill the form.
  await page.fill('#init-form-project-name', 'Test Project');

  const projectSlug = page.locator('#init-form-project-slug');
  await expect(projectSlug).toHaveValue(/test-project-d/g);

  // Expect the project to be added.
  const submitBtn = page.locator('#init-form-submit-btn');
  await submitBtn.click();

  await expect(page.locator('.body')).toHaveText('Test Project');
});
