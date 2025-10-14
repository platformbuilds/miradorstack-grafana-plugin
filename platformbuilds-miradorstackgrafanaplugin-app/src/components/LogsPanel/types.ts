import { PanelOptionsEditorBuilder } from '@grafana/data';

export interface Options {
  showTimestamp: boolean;
  showLabels: boolean;
}

export const getPanelOptions = (builder: PanelOptionsEditorBuilder<Options>) => {
  return builder
    .addBooleanSwitch({
      path: 'showTimestamp',
      name: 'Show Timestamp',
      defaultValue: true,
    })
    .addBooleanSwitch({
      path: 'showLabels',
      name: 'Show Labels',
      defaultValue: true,
    });
};