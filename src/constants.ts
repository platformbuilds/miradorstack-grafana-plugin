import pluginJson from './plugin.json';

export const PLUGIN_BASE_URL = `/a/${pluginJson.id}`;

export enum ROUTES {
  Onboarding = 'onboarding',
  Reports = 'reports',
  AIInsights = 'ai-insights',
  Schema = 'schema',
  Three = 'page-three',
  Four = 'page-four',
  Explorer = 'explorer',
}
