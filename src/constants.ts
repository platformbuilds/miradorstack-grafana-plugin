import pluginJson from './plugin.json';

export const PLUGIN_BASE_URL = `/a/${pluginJson.id}`;

export enum ROUTES {
  Onboarding = 'onboarding',
  Discover = 'discover',
  Reports = 'reports',
  AIInsights = 'ai-insights',
}
