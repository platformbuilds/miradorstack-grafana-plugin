import { test, expect } from '@grafana/plugin-e2e';
import { MiradorDataSourceOptions, MiradorSecureJsonData } from '../src/types';

test('smoke: should render config editor', async ({ createDataSourceConfigPage, readProvisionedDataSource, page }) => {
  const ds = await readProvisionedDataSource({ fileName: 'datasources.yml' });
  await createDataSourceConfigPage({ type: ds.type });
  await expect(page.getByLabel('Mirador API URL')).toBeVisible();
});
test('"Save & test" should be successful when configuration is valid', async ({
  createDataSourceConfigPage,
  readProvisionedDataSource,
  page,
}) => {
  const ds = await readProvisionedDataSource<MiradorDataSourceOptions, MiradorSecureJsonData>({ fileName: 'datasources.yml' });
  const configPage = await createDataSourceConfigPage({ type: ds.type });
  await page.getByRole('textbox', { name: 'Mirador API URL' }).fill(ds.jsonData.url ?? 'https://mirador.example.com');
  await page.getByRole('textbox', { name: 'Bearer Token' }).fill(ds.secureJsonData?.bearerToken ?? 'test-token');
  await expect(configPage.saveAndTest()).toBeOK();
});

test('"Save & test" should fail when configuration is invalid', async ({
  createDataSourceConfigPage,
  readProvisionedDataSource,
  page,
}) => {
  const ds = await readProvisionedDataSource<MiradorDataSourceOptions, MiradorSecureJsonData>({ fileName: 'datasources.yml' });
  const configPage = await createDataSourceConfigPage({ type: ds.type });
  await page.getByRole('textbox', { name: 'Mirador API URL' }).fill(''); // Clear the URL to make it invalid
  await expect(configPage.saveAndTest()).not.toBeOK();
  await expect(configPage).toHaveAlert('error', { hasText: 'Mirador API URL is missing' });
});
