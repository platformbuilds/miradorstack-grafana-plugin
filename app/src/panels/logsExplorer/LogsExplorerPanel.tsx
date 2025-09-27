import React from 'react';
import { css } from '@emotion/css';
import { GrafanaTheme2, PanelProps } from '@grafana/data';
import { Button, useStyles2 } from '@grafana/ui';
import { getLocationSrv } from '@grafana/runtime';

import { prefixRoute } from '../../utils/utils.routing';

export interface LogsExplorerPanelOptions {
  query?: string;
  showSearchSummary?: boolean;
}

export const LogsExplorerPanel: React.FC<PanelProps<LogsExplorerPanelOptions>> = ({
  options,
  timeRange,
  width,
  height,
}) => {
  const styles = useStyles2((theme) => getStyles(theme)({ width, height }));

  const handleOpenDiscover = () => {
    getLocationSrv().update({
      path: prefixRoute('discover'),
      query: options.query ? { query: options.query } : undefined,
    });
    if (options.query) {
      // no-op; the update call will navigate. Additional logic could be added for filters.
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <div className={styles.title}>Mirador Logs Explorer</div>
          <div className={styles.subtitle}>
            Dashboard time range:&nbsp;
            <strong>
              {timeRange.from.toISOString()} → {timeRange.to.toISOString()}
            </strong>
          </div>
        </div>
        <Button icon="external-link-alt" variant="secondary" onClick={handleOpenDiscover}>
          Open Discover
        </Button>
      </div>

      {options.showSearchSummary && (
        <div className={styles.summary}>
          <span className={styles.summaryLabel}>Default query</span>
          <code className={styles.query}>{options.query || 'No query configured'}</code>
        </div>
      )}

      <div className={styles.hint}>
        Configure this panel to store a reusable Mirador search. Use it to deep-link teams into the Discover
        workspace directly from dashboards.
      </div>
    </div>
  );
};

const getStyles = (theme: GrafanaTheme2) => (props: { width: number; height: number }) => {
  return {
    container: css`
      width: ${props.width}px;
      height: ${props.height}px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: 1rem;
      background: var(--grafana-background-secondary);
      border-radius: 4px;
      gap: 1rem;
    `,
    header: css`
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
    `,
    title: css`
      font-size: 1.1rem;
      font-weight: 600;
    `,
    subtitle: css`
      font-size: 12px;
      color: var(--grafana-text-secondary);
    `,
    summary: css`
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    `,
    summaryLabel: css`
      font-size: 12px;
      text-transform: uppercase;
      color: var(--grafana-text-secondary);
    `,
    query: css`
      display: inline-flex;
      padding: 0.5rem;
      background: var(--grafana-background-primary);
      border-radius: 4px;
      font-family: var(--grafana-font-monospace);
      max-width: 100%;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    `,
    hint: css`
      font-size: 12px;
      color: var(--grafana-text-secondary);
    `,
  };
};
