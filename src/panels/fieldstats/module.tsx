import { PanelPlugin } from '@grafana/data';
import { MetricsExplorerPanel } from './MetricsExplorerPanel.tsx';
import { MetricsExplorerOptions, defaults } from './types.ts';

export const plugin = new PanelPlugin<MetricsExplorerOptions>(MetricsExplorerPanel).setDefaults(defaults);
