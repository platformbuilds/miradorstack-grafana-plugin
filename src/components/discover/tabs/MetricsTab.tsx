import React from 'react';
import { css } from '@emotion/css';
import { GrafanaTheme2 } from '@grafana/data';
import { useStyles2, Alert } from '@grafana/ui';

export function MetricsTab() {
  const s = useStyles2(getStyles);

  return (
    <div className={s.container}>
      <Alert title="Metrics Tab" severity="info">
        The Metrics tab is under development. This will display time series metrics with PromQL support.
      </Alert>
      <div className={s.placeholder}>
        <h3>Coming Soon:</h3>
        <ul>
          <li>Time series chart visualization</li>
          <li>PromQL query editor</li>
          <li>Metric selector and filtering</li>
          <li>Legend and tooltip customization</li>
          <li>Multiple chart types (line, bar, etc.)</li>
        </ul>
      </div>
    </div>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  container: css`
    padding: ${theme.spacing(2)};
    height: 100%;
    display: flex;
    flex-direction: column;
  `,
  placeholder: css`
    margin-top: ${theme.spacing(2)};
    padding: ${theme.spacing(3)};
    background: ${theme.colors.background.secondary};
    border-radius: ${theme.shape.radius.default};
    border: 1px solid ${theme.colors.border.weak};
  `,
});
