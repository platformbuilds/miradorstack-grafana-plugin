import { test, expect } from './fixtures';

// Replace 'your-selector-here' with an appropriate selector that indicates the page has loaded.

test('page one should render successfully', async ({ gotoPage, page }) => {
  await gotoPage(`/${ROUTES.One}`);
  
  // Wait for an element that indicates the page has loaded
  await page.waitForSelector('your-selector-here', { timeout: 10000 });
  
  await expect(page.getByText('This is page one.')).toBeVisible();
});

test('page two should render successfully', async ({ gotoPage, page }) => {
  await gotoPage(`/${ROUTES.Two}`);
  
  // Wait for an element that indicates the page has loaded
  await page.waitForSelector('your-selector-here', { timeout: 10000 });
  
  await expect(page.getByText('This is page two.')).toBeVisible();
});

test('page three should support an id parameter', async ({ gotoPage, page }) => {
  await gotoPage(`/${ROUTES.Three}/123456`);
  
  // Wait for an element that indicates the page has loaded
  await page.waitForSelector('your-selector-here', { timeout: 10000 });
  
  await expect(page.getByText('ID: 123456')).toBeVisible();
});

test('page three should render successfully', async ({ gotoPage, page }) => {
  await gotoPage(`/${ROUTES.One}`);
  
  // Wait for an element that indicates the page has loaded
  await page.waitForSelector('your-selector-here', { timeout: 10000 });  
  
  await expect(page.getByText('This is page one.')).toBeVisible();
});
