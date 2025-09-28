import { test, expect } from '@playwright/test';
import { ROUTES } from '../src/constants';

test('page one should render successfully', async ({ page }) => {
  await page.goto(`/${ROUTES.One}`);
  await page.waitForSelector('h1', { timeout: 10000 });
  await expect(page.getByText('This is page one.')).toBeVisible();
});

// Removed page two test since PageTwo does not exist

test('page three should support an id parameter', async ({ page }) => {
  await page.goto(`/${ROUTES.Three}/123456`);
  await page.waitForSelector('.content', { timeout: 10000 });
  await expect(page.getByText('ID: 123456')).toBeVisible();
});

test('page three should render successfully', async ({ page }) => {
  await page.goto(`/${ROUTES.Three}`);
  await page.waitForSelector('.content', { timeout: 10000 });
  await expect(page.getByText('This is page three.')).toBeVisible();
});

test('page four should render successfully', async ({ page }) => {
  await page.goto(`/${ROUTES.Four}`);
  await page.waitForSelector('h1', { timeout: 10000 });
  await expect(page.getByText('This is page four.')).toBeVisible();
});

test('discover page should render successfully', async ({ page }) => {
  await page.goto(`/${ROUTES.Discover}`);
  await page.waitForSelector('h1', { timeout: 10000 });
  await expect(page.getByText('Discover')).toBeVisible();
});

test('schema page should render successfully', async ({ page }) => {
  await page.goto(`/${ROUTES.Schema}`);
  await page.waitForSelector('h1', { timeout: 10000 });
  await expect(page.getByText('Schema')).toBeVisible();
});

