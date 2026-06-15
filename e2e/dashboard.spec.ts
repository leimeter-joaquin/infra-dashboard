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

    const envName = `e2e-select-${Date.now()}`;
    await page.getByTestId('new-env-input').fill(envName);
    await page.getByTestId('create-env-btn').click();

    // Sidebar item should appear
    await expect(page.getByText(envName)).toBeVisible();

    // Click to select — empty state should disappear
    await page.getByText(envName).click();
    await expect(page.getByText('Select or create an environment to get started.')).not.toBeVisible();
    await expect(page.getByRole('button', { name: 'Add node' })).toBeVisible();
  });

  test('runs and stops a detached action from the UI', async ({ page }) => {
    await page.goto('/');

    // 1. Enter the Agent Token to connect to the agent
    await page.getByPlaceholder('paste token...').fill('dev-local-secret-2026');
    // Wait for the agent status to show online
    await expect(page.getByText('Agent: online')).toBeVisible({ timeout: 10000 });

    // 2. Create a unique environment
    const envName = `e2e-run-stop-${Date.now()}`;
    await page.getByTestId('new-env-input').fill(envName);
    await page.getByTestId('create-env-btn').click();
    await page.getByText(envName).click();

    // 3. Create a node that uses the test-detached action
    await page.getByTestId('node-name-input').fill('Sleep Node');
    await page.getByTestId('node-url-input').fill('http://localhost:9999');
    await page.getByTestId('node-run-action-input').fill('test-detached');
    await page.getByRole('button', { name: 'Add node' }).click();

    // Verify the node card is visible in the React Flow canvas
    const sleepNode = page.locator('.react-flow__node', { hasText: 'Sleep Node' });
    await expect(sleepNode).toBeVisible();

    // 4. Click the "Run" button on the node
    const runBtn = sleepNode.getByRole('button', { name: 'Run' });
    await expect(runBtn).toBeVisible();
    await runBtn.click();

    // Wait 2.5 seconds to allow the action execution and polling to settle
    await page.waitForTimeout(2500);

    // The button should toggle to "Stop"
    const stopBtn = sleepNode.getByRole('button', { name: 'Stop' });
    await expect(stopBtn).toBeVisible({ timeout: 5000 });

    // 5. Click the "Stop" button
    await stopBtn.click();

    // The button should toggle back to "Run"
    await expect(runBtn).toBeVisible({ timeout: 5000 });
  });
});
