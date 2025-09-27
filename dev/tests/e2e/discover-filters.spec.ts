import { test, expect } from '@playwright/test';

test.describe('Discover filters', () => {
  test('user can add and clear quick filters', async ({ page }) => {
    test.fixme(true, 'Requires Grafana dev environment. Execute after plugin is served.');

    await page.goto('http://localhost:3000/a/miradorstack-mirador-explorer/discover');
    await page.getByRole('button', { name: /Add filter for service/i }).click();
    await expect(page.getByText(/service exists/i)).toBeVisible();
    await page.getByRole('button', { name: /Clear filters/i }).click();
    await expect(page.getByText(/service exists/i)).toHaveCount(0);
  });
});
