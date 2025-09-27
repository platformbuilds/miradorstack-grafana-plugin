import { test, expect } from '@playwright/test';

const baseUrl = process.env.STORYBOOK_URL ?? 'http://localhost:6006';

const stories = [
  { name: 'Discover Shell', id: 'discover-shell--default' },
  { name: 'Discover With Filters', id: 'discover-shell--with-filters' },
  { name: 'Field Stats Overlay', id: 'discover-shell--stats-overlay' },
];

test.describe('Discover visual baselines', () => {
  for (const story of stories) {
    test(story.name, async ({ page }) => {
      await page.goto(`${baseUrl}/iframe.html?id=${story.id}`);
      await page.waitForTimeout(500);
      await expect(page).toHaveScreenshot(`${story.id}.png`, {
        maxDiffPixelRatio: 0.02,
        animations: 'disabled',
      });
    });
  }
});
