import pluginJson from './plugin.json';

export const PLUGIN_BASE_URL = `/a/${pluginJson.id}`;

export enum ROUTES {
  Explorer = 'one',
  Schema = 'two',
  Three = 'three',
  Four = 'four',
  Discover = 'discover',
}
