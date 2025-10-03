import { test, expect } from '@playwright/test';

test.describe('Mirador Plugin E2E Tests', () => {
  // Skip login for local testing by going directly to plugin
  test.beforeEach(async ({ page }) => {
    // Set up basic auth or skip login for dev environment
    await page.goto('http://localhost:3000');
    // Wait a moment for Grafana to load
    await page.waitForTimeout(2000);
  });

  test('Plugin endpoint is accessible', async ({ page }) => {
    // Navigate directly to plugin
    await page.goto('http://localhost:3000/a/miradorstack-connect');
    
    // Check if we get a valid page (not 404)
    const title = await page.title();
    expect(title).toContain('Grafana');
    
    // Look for any React content or navigation elements
    const bodyText = await page.textContent('body');
    console.log('Plugin page loaded, content length:', bodyText?.length);
  });

  test('Discover page route works', async ({ page }) => {
    await page.goto('http://localhost:3000/a/miradorstack-connect/discover');
    
    // Wait for React to render
    await page.waitForTimeout(3000);
    
    // Check page title and content
    const title = await page.title();
    expect(title).toContain('Grafana');
    
    // Look for discover-specific content
    const content = await page.textContent('body');
    console.log('Discover page accessed, has content:', !!content);
  });

  test('Data source is provisioned correctly', async ({ page }) => {
    // Go to data sources management page
    await page.goto('http://localhost:3000/connections/datasources');
    
    // Wait for page to load
    await page.waitForTimeout(3000);
    
    // Check if Mirador Core Connector exists (allow for multiple matches)
    const miradorDS = page.locator('text=Mirador Core Connector').first();
    const isVisible = await miradorDS.isVisible({ timeout: 5000 });
    
    if (isVisible) {
      console.log('✅ Mirador Core Connector data source found');
    } else {
      console.log('❌ Mirador Core Connector not visible, checking page content...');
      const pageContent = await page.textContent('body');
      console.log('Page contains "Mirador":', pageContent?.includes('Mirador') || false);
    }
    
    expect(isVisible).toBe(true);
  });

  test('API connectivity check', async ({ page }) => {
    // Test the Mirador API endpoint directly
    const response = await page.request.get('http://172.20.10.2:8080/api/v1/health');
    
    if (response.ok()) {
      console.log('✅ Mirador Core API is accessible');
      const healthData = await response.json();
      console.log('Health check response:', healthData);
    } else {
      console.log('❌ Mirador Core API not accessible:', response.status());
    }
  });
});
