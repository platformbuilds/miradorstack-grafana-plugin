import React from 'react';
import { css } from '@emotion/css';
import { GrafanaTheme2 } from '@grafana/data';
import { useStyles2, Alert } from '@grafana/ui';

export function ServiceMeshTab() {
  const s = useStyles2(getStyles);

  return (
    <div className={s.container}>
      <Alert title="Service Mesh Tab" severity="info">
        The Service Mesh tab is under development. This will display service topology and mesh metrics.
      </Alert>
      <div className={s.placeholder}>
        <h3>Coming Soon:</h3>
        <ul>
          <li>Service topology graph</li>
          <li>Service mesh metrics visualization</li>
          <li>Traffic flow analysis</li>
          <li>Service health indicators</li>
          <li>Mesh configuration insights</li>
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
