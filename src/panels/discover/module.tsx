import { PanelPlugin } from '@grafana/data';
import { LogsExplorerPanel } from './LogsExplorerPanel.tsx';
import { LogsExplorerOptions, defaults } from './types.ts';

// Plugin definition for Logs Explorer Panel
export const plugin = new PanelPlugin<LogsExplorerOptions>(LogsExplorerPanel).setDefaults(defaults);
