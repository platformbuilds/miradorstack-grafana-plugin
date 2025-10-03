import React from 'react';
import { css } from '@emotion/css';
import { GrafanaTheme2 } from '@grafana/data';
import { useStyles2, Alert } from '@grafana/ui';

export function TracesTab() {
  const s = useStyles2(getStyles);

  return (
    <div className={s.container}>
      <Alert title="Traces Tab" severity="info">
        The Traces tab is under development. This will display distributed traces with Jaeger-compatible search.
      </Alert>
      <div className={s.placeholder}>
        <h3>Coming Soon:</h3>
        <ul>
          <li>Trace timeline visualization</li>
          <li>Span details and waterfall view</li>
          <li>Service and operation filtering</li>
          <li>Duration and error highlighting</li>
          <li>Trace correlation with logs</li>
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
