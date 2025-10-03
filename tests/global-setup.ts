import { chromium, type FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  // Setup authentication
  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    // Navigate to Grafana
    const baseURL = config.projects[0].use.baseURL || 'http://localhost:3000';
    await page.goto(baseURL);

    // Login as admin
    await page.fill('input[name="user"]', 'admin');
    await page.fill('input[name="password"]', 'admin');
    await page.click('button[type="submit"]');

    // Wait for login to complete
    await page.waitForURL('**/login**', { waitUntil: 'domcontentloaded' });

    // Save authentication state
    await page.context().storageState({ path: 'playwright/.auth/admin.json' });
  } catch (error) {
    console.warn('Global setup warning:', error instanceof Error ? error.message : String(error));
  } finally {
    await browser.close();
  }
}

export default globalSetup;
