import { PanelPlugin } from '@grafana/data';
import { TracesExplorerPanel } from './TracesExplorerPanel.tsx';
import { TracesExplorerOptions, defaults } from './types.ts';

export const plugin = new PanelPlugin<TracesExplorerOptions>(TracesExplorerPanel).setDefaults(defaults);
