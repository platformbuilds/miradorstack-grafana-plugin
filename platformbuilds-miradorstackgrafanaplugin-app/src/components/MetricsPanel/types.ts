import { PanelOptionsEditorBuilder } from '@grafana/data';

export interface Options {
  showLegend: boolean;
  showPoints: boolean;
}

export const getPanelOptions = (builder: PanelOptionsEditorBuilder<Options>) => {
  return builder
    .addBooleanSwitch({
      path: 'showLegend',
      name: 'Show Legend',
      defaultValue: true,
    })
    .addBooleanSwitch({
      path: 'showPoints',
      name: 'Show Points',
      defaultValue: false,
    });
};