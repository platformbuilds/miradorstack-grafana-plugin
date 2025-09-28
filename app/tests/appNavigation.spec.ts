import { expect } from '@playwright/test';
import { test } from './fixtures';
import { ROUTES } from '../src/constants';

test('discover page should render successfully', async ({ gotoPage, page }) => {
  await gotoPage(ROUTES.Discover);
  await expect(page.getByRole('heading', { name: 'Discover' })).toBeVisible();
});

test('schema page should render successfully', async ({ gotoPage, page }) => {
  await gotoPage(ROUTES.Schema);
  await expect(page.getByRole('heading', { name: 'Schema Browser' })).toBeVisible();
});

