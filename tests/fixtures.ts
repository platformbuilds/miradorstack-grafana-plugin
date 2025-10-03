import { AppConfigPage, AppPage, test as base } from '@grafana/plugin-e2e';
import pluginJson from '../src/plugin.json';

type AppTestFixture = {
  appConfigPage: AppConfigPage;
  gotoPage: (path?: string) => Promise<AppPage>;
};

export const test = base.extend<AppTestFixture>({
  appConfigPage: async ({ gotoAppConfigPage }, use) => {
    const configPage = await gotoAppConfigPage({
      pluginId: pluginJson.id,
    });
    await use(configPage);
  },
  gotoPage: async ({ gotoAppPage }, use) => {
    await use((path) =>
      gotoAppPage({
        path,
        pluginId: pluginJson.id,
      })
    );
  },
});

// Filter out common browser warnings that are not related to our plugin
test.beforeEach(async ({ page }) => {
  // Listen for console messages and filter out non-critical warnings
  page.on('console', (msg) => {
    const text = msg.text();

    // Filter out common browser warnings that are not plugin-related
    const ignoredMessages = [
      'Loading failed for the <script> with source',
      'WEBGL_debug_renderer_info is deprecated',
      'MouseEvent.mozInputSource is deprecated',
      'The "description" doesn\'t match the description recorded in plugin.json',
    ];

    const shouldIgnore = ignoredMessages.some(ignored => text.includes(ignored));

    if (!shouldIgnore && msg.type() === 'error') {
      console.log(`Console error: ${text}`);
    }
  });

  // Listen for page errors
  page.on('pageerror', (error) => {
    console.log(`Page error: ${error.message}`);
  });
});

export { expect } from '@grafana/plugin-e2e';
