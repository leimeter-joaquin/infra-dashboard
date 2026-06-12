import { test, expect } from '@playwright/test';

test.describe('Infra Dashboard', () => {
  test('loads and shows header', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Infra Dashboard')).toBeVisible();
    await expect(page.getByText('Environments')).toBeVisible();
  });

  test('shows empty state before environment is selected', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Select or create an environment to get started.')).toBeVisible();
  });

  test('creates an environment and selects it', async ({ page }) => {
    await page.goto('/');

    await page.getByTestId('new-env-input').fill('e2e-test');
    await page.getByTestId('create-env-btn').click();

    // Sidebar item should appear
    await expect(page.getByText('e2e-test')).toBeVisible();

    // Click to select — empty state should disappear
    await page.getByText('e2e-test').click();
    await expect(page.getByText('Select or create an environment to get started.')).not.toBeVisible();
    await expect(page.getByText('Add node')).toBeVisible();
  });
});
