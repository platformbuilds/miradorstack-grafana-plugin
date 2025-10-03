import { test, expect } from './fixtures';
import { ROUTES } from '../src/constants';

test.describe('navigating app', () => {
  test('onboarding page should render successfully', async ({ gotoPage, page }) => {
    await gotoPage(`/${ROUTES.Onboarding}`);
    await expect(page.getByText('Mirador Explorer')).toBeVisible();
  });

  test('discover page should render successfully', async ({ gotoPage, page }) => {
    await gotoPage(`/${ROUTES.Discover}`);
    await expect(page.getByText('Saved Searches')).toBeVisible();
  });

  test('reports page should render successfully', async ({ gotoPage, page }) => {
    await gotoPage(`/${ROUTES.Reports}`);
    await expect(page.getByText('Reports')).toBeVisible();
  });

  test('ai insights page should render successfully', async ({ gotoPage, page }) => {
    await gotoPage(`/${ROUTES.AIInsights}`);
    await expect(page.getByText('AI Insights')).toBeVisible();
  });
});