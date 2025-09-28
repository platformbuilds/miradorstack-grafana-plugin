import React from 'react';
import { AppPlugin, type AppRootProps } from '@grafana/data';
import AppRoot from './components/App/App';
import AppConfigRoot, { type AppConfigProps } from './components/AppConfig/AppConfig';

const App = (props: AppRootProps) => <AppRoot {...props} />;

const AppConfig = (props: AppConfigProps) => <AppConfigRoot {...props} />;

export const plugin = new AppPlugin<{}>().setRootPage(App).addConfigPage({
  title: 'Configuration',
  icon: 'cog',
  body: AppConfig,
  id: 'configuration',
});
