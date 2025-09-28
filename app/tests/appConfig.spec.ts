import { test, expect } from './fixtures';

test('should be possible to save app configuration', async ({ appConfigPage, page }) => {
  const saveButton = page.getByRole('button', { name: /Save API settings/i });
  const resetButton = page.getByRole('button', { name: /reset/i });

  // Wait for an app configuration form to load
  await page.waitForSelector('.config-form', { timeout: 10000 }); // Ensure the form can be referred by this selector

  // Ensure the reset button is visible before clicking
  await expect(resetButton).toBeVisible({ timeout: 5000 });

  // Reset the configured secret
  await resetButton.click();

  // Enter some valid values
  await page.getByRole('textbox', { name: 'API Key' }).fill('secret-api-key');
  await page.getByRole('textbox', { name: 'API Url' }).clear();
  await page.getByRole('textbox', { name: 'API Url' }).fill('http://www.my-awsome-grafana-app.com/api');
  await page.getByRole('textbox', { name: 'Mirador datasource UID' }).fill('123e4567-e89b-12d3-a456-426614174000'); // <-- Set as UUID

  // Wait for the save button to be visible
  await expect(saveButton).toBeVisible({ timeout: 10000 });

  // Listen for the server response on the saved form
  const saveResponse = appConfigPage.waitForSettingsResponse();

  await saveButton.click();
  await expect(saveResponse).toBeOK();
});
