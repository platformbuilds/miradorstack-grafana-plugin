import { PanelOptionsEditorBuilder } from '@grafana/data';

export interface Options {
  showDuration: boolean;
  showService: boolean;
  showOperation: boolean;
}

export const getPanelOptions = (builder: PanelOptionsEditorBuilder<Options>) => {
  return builder
    .addBooleanSwitch({
      path: 'showDuration',
      name: 'Show Duration',
      defaultValue: true,
    })
    .addBooleanSwitch({
      path: 'showService',
      name: 'Show Service',
      defaultValue: true,
    })
    .addBooleanSwitch({
      path: 'showOperation',
      name: 'Show Operation',
      defaultValue: true,
    });
};