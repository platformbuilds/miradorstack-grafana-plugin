import { PanelPlugin } from '@grafana/data';

import { LogsExplorerPanel, LogsExplorerPanelOptions } from './LogsExplorerPanel';

export const plugin = new PanelPlugin<LogsExplorerPanelOptions>(LogsExplorerPanel).setPanelOptions((builder) =>
  builder
    .addTextInput({
      path: 'query',
      name: 'Default query',
      description: 'Pre-fill Discover with this Lucene query when launching from the panel.',
      settings: {
        placeholder: 'service:checkout AND level:ERROR',
      },
    })
    .addBooleanSwitch({
      path: 'showSearchSummary',
      name: 'Show query summary',
      description: 'Toggle the informational summary rendered inside the panel.',
      defaultValue: true,
    })
);
