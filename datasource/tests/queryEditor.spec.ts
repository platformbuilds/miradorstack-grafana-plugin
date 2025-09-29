import { test, expect } from '@grafana/plugin-e2e';

test('smoke: should render query editor', async ({ panelEditPage, readProvisionedDataSource }) => {
  const ds = await readProvisionedDataSource({ fileName: 'datasources.yml' });
  await panelEditPage.datasource.set(ds.name);
  await panelEditPage.getQueryEditorRow('A').getByRole('button', { name: 'Raw' }).click();
  await expect(panelEditPage.getQueryEditorRow('A').locator('[aria-label="Raw query editor"]')).toBeVisible();
});

test('should trigger new query when Constant field is changed', async ({
  panelEditPage,
  readProvisionedDataSource,
}) => {
  const ds = await readProvisionedDataSource({ fileName: 'datasources.yml' });
  await panelEditPage.datasource.set(ds.name);
  await panelEditPage.getQueryEditorRow('A').getByRole('button', { name: 'Raw' }).click();
  await panelEditPage.getQueryEditorRow('A').locator('[aria-label="Raw query editor"]').fill('test query');
  const queryReq = panelEditPage.waitForQueryDataRequest();
  await panelEditPage.getQueryEditorRow('A').getByRole('spinbutton').fill('10');
  await expect(await queryReq).toBeTruthy();
});

test('data query should execute successfully', async ({ panelEditPage, readProvisionedDataSource }) => {
  const ds = await readProvisionedDataSource({ fileName: 'datasources.yml' });
  await panelEditPage.datasource.set(ds.name);
  await panelEditPage.getQueryEditorRow('A').getByRole('button', { name: 'Raw' }).click();
  await panelEditPage.getQueryEditorRow('A').locator('[aria-label="Raw query editor"]').fill('*');
  await panelEditPage.setVisualization('Table');
  await expect(panelEditPage.refreshPanel()).toBeOK();
  // Note: This test now verifies that the query executes successfully against mirador-core
  // The actual data returned depends on what logs are available in the mirador-core instance
});
