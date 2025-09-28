import { expect } from '@playwright/test';
import { test } from './fixtures';
import { ROUTES } from '../src/constants';

test('page one should render successfully', async ({ gotoPage, page }) => {
  await gotoPage(ROUTES.One);
  await expect(page.getByText('This is page one.')).toBeVisible();
});

// Removed page two test since PageTwo does not exist

test('page three should support an id parameter', async ({ gotoPage, page }) => {
  await gotoPage(`${ROUTES.Three}/123456`);
  await expect(page.getByText('ID: 123456')).toBeVisible();
});

test('page three should render successfully', async ({ gotoPage, page }) => {
  await gotoPage(`${ROUTES.Three}`);
  await expect(page.getByText('This is page three.')).toBeVisible();
});

test('page four should render successfully', async ({ gotoPage, page }) => {
  await gotoPage(ROUTES.Four);
  await expect(page.getByText('This is a full-width page without a navigation bar.')).toBeVisible();
});

test('discover page should render successfully', async ({ gotoPage, page }) => {
  await gotoPage(ROUTES.Discover);
  await expect(page.getByRole('heading', { name: 'Discover' })).toBeVisible();
});

test('schema page should render successfully', async ({ gotoPage, page }) => {
  await gotoPage(ROUTES.Schema);
  await expect(page.getByRole('heading', { name: 'Schema Browser' })).toBeVisible();
});

