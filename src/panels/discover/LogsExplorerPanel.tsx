import React, { useState, useEffect, useCallback } from 'react';
import { css } from '@emotion/css';
import { PanelProps } from '@grafana/data';
import { useStyles2, Button, Input, Select, LoadingPlaceholder } from '@grafana/ui';
import { LogsExplorerOptions } from './types';

interface Props extends PanelProps<LogsExplorerOptions> {}

export const LogsExplorerPanel: React.FC<Props> = ({ options, data, width, height, replaceVariables }) => {
  const styles = useStyles2(getStyles);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState(options.query);
  const [timeRange, setTimeRange] = useState(options.timeRange);

  const processData = useCallback((data: any) => {
    // Process Grafana data format into logs
    return data.series.flatMap((series: any) =>
      series.fields[0]?.values.map((value: any, index: number) => ({
        timestamp: series.fields.find((f: any) => f.name === 'timestamp')?.values[index] || new Date().toISOString(),
        level: series.fields.find((f: any) => f.name === 'level')?.values[index] || 'INFO',
        message: value,
        service: series.fields.find((f: any) => f.name === 'service')?.values[index] || 'unknown',
      }))
    ).slice(0, options.maxResults);
  }, [options.maxResults]);

  const generateMockLogs = useCallback(() => {
    return [
      { timestamp: '2023-10-01T10:00:00Z', level: 'INFO', message: 'Application started', service: 'web' },
      { timestamp: '2023-10-01T10:05:00Z', level: 'ERROR', message: 'Database connection failed', service: 'web' },
      { timestamp: '2023-10-01T10:10:00Z', level: 'INFO', message: 'Retry successful', service: 'web' },
      { timestamp: '2023-10-01T10:15:00Z', level: 'WARN', message: 'High memory usage detected', service: 'api' },
      { timestamp: '2023-10-01T10:20:00Z', level: 'INFO', message: 'Cache cleared', service: 'worker' },
    ].slice(0, options.maxResults);
  }, [options.maxResults]);

  useEffect(() => {
    if (data?.series?.length > 0) {
      // Process data from Grafana data source
      const processedLogs = processData(data);
      setLogs(processedLogs);
    } else {
      // Generate mock data for development
      setLogs(generateMockLogs());
    }
  }, [data, processData, generateMockLogs]);

  const handleRefresh = () => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setLogs(generateMockLogs());
      setLoading(false);
    }, 1000);
  };

  const getLevelColor = (level: string) => {
    switch (level.toUpperCase()) {
      case 'ERROR': return '#e74c3c';
      case 'WARN': return '#f39c12';
      case 'INFO': return '#3498db';
      case 'DEBUG': return '#95a5a6';
      default: return '#34495e';
    }
  };

  return (
    <div className={styles.container} style={{ width, height }}>
      <div className={styles.header}>
        <div className={styles.controls}>
          <Input
            placeholder="Enter log query..."
            value={query}
            onChange={(e) => setQuery(e.currentTarget.value)}
            className={styles.queryInput}
          />
          <Select
            options={[
              { label: 'Last 1h', value: 'last 1h' },
              { label: 'Last 6h', value: 'last 6h' },
              { label: 'Last 24h', value: 'last 24h' },
              { label: 'Last 7d', value: 'last 7d' },
            ]}
            value={timeRange}
            onChange={(value) => setTimeRange(value.value || 'last 1h')}
            className={styles.timeSelect}
          />
          <Button variant="primary" onClick={handleRefresh} disabled={loading}>
            {loading ? 'Loading...' : 'Refresh'}
          </Button>
        </div>
      </div>

      <div className={styles.content}>
        {loading ? (
          <LoadingPlaceholder text="Loading logs..." />
        ) : (
          <div className={styles.logsContainer}>
            {logs.length === 0 ? (
              <div className={styles.empty}>No logs found</div>
            ) : (
              logs.map((log, index) => (
                <div key={index} className={styles.logEntry}>
                  {options.showTimestamp && (
                    <span className={styles.timestamp}>
                      {new Date(log.timestamp).toLocaleString()}
                    </span>
                  )}
                  {options.showLevel && (
                    <span
                      className={styles.level}
                      style={{ color: getLevelColor(log.level) }}
                    >
                      {log.level}
                    </span>
                  )}
                  {options.showService && (
                    <span className={styles.service}>{log.service}</span>
                  )}
                  <span className={styles.message}>{log.message}</span>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const getStyles = (theme: any) => ({
  container: css`
    display: flex;
    flex-direction: column;
    height: 100%;
    background: ${theme.colors.background.primary};
    border-radius: ${theme.shape.borderRadius()};
  `,
  header: css`
    padding: ${theme.spacing(1)};
    border-bottom: 1px solid ${theme.colors.border.medium};
    background: ${theme.colors.background.secondary};
  `,
  controls: css`
    display: flex;
    gap: ${theme.spacing(1)};
    align-items: center;
  `,
  queryInput: css`
    flex: 1;
    min-width: 200px;
  `,
  timeSelect: css`
    min-width: 100px;
  `,
  content: css`
    flex: 1;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  `,
  logsContainer: css`
    flex: 1;
    overflow-y: auto;
    padding: ${theme.spacing(1)};
  `,
  logEntry: css`
    display: flex;
    align-items: center;
    gap: ${theme.spacing(1)};
    padding: ${theme.spacing(0.5)};
    border-bottom: 1px solid ${theme.colors.border.weak};
    font-family: ${theme.typography.fontFamily.monospace};
    font-size: ${theme.typography.size.sm};
    &:hover {
      background: ${theme.colors.background.secondary};
    }
  `,
  timestamp: css`
    color: ${theme.colors.text.secondary};
    min-width: 160px;
    flex-shrink: 0;
  `,
  level: css`
    font-weight: bold;
    min-width: 60px;
    flex-shrink: 0;
  `,
  service: css`
    background: ${theme.colors.background.secondary};
    padding: ${theme.spacing(0.25)} ${theme.spacing(0.5)};
    border-radius: ${theme.shape.borderRadius()};
    font-size: ${theme.typography.size.xs};
    min-width: 80px;
    flex-shrink: 0;
  `,
  message: css`
    flex: 1;
    word-break: break-word;
  `,
  empty: css`
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    color: ${theme.colors.text.secondary};
  `,
});
