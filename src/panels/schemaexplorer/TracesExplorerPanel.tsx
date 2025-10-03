import React, { useState, useEffect, useCallback } from 'react';
import { css } from '@emotion/css';
import { PanelProps } from '@grafana/data';
import { useStyles2, Button, Input, Select, LoadingPlaceholder, Icon } from '@grafana/ui';
import { TracesExplorerOptions } from './types';

interface Props extends PanelProps<TracesExplorerOptions> {}

interface TraceSpan {
  id: string;
  traceId: string;
  parentId?: string;
  operation: string;
  service: string;
  duration: number;
  timestamp: string;
  status: 'success' | 'error' | 'warning';
  tags: Record<string, string>;
}

export const TracesExplorerPanel: React.FC<Props> = ({ options, data, width, height }) => {
  const styles = useStyles2(getStyles);
  const [traces, setTraces] = useState<TraceSpan[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState(options.query);
  const [timeRange, setTimeRange] = useState(options.timeRange);
  const [expandedSpans, setExpandedSpans] = useState<Set<string>>(new Set());

  const processData = useCallback((data: any) => {
    // Process Grafana data into trace spans
    return data.series.flatMap((series: any) =>
      series.fields[0]?.values.map((value: any, index: number) => ({
        id: `span_${index}`,
        traceId: series.fields.find((f: any) => f.name === 'trace_id')?.values[index] || `trace_${index}`,
        operation: value,
        service: series.fields.find((f: any) => f.name === 'service')?.values[index] || 'unknown',
        duration: series.fields.find((f: any) => f.name === 'duration')?.values[index] || Math.random() * 1000,
        timestamp: series.fields.find((f: any) => f.name === 'timestamp')?.values[index] || new Date().toISOString(),
        status: series.fields.find((f: any) => f.name === 'status')?.values[index] || 'success',
        tags: {},
      }))
    ).slice(0, options.maxSpans);
  }, [options.maxSpans]);

  useEffect(() => {
    if (data?.series?.length > 0) {
      setTraces(processData(data));
    } else {
      setTraces(generateMockTraces());
    }
  }, [data, processData]);

  const generateMockTraces = (): TraceSpan[] => {
    return [
      {
        id: 'span_1',
        traceId: 'trace_abc123',
        operation: 'http_request',
        service: 'web',
        duration: 150,
        timestamp: '2023-10-01T10:00:00Z',
        status: 'success' as const,
        tags: { method: 'GET', url: '/api/users' },
      },
      {
        id: 'span_2',
        traceId: 'trace_abc123',
        parentId: 'span_1',
        operation: 'db_query',
        service: 'api',
        duration: 50,
        timestamp: '2023-10-01T10:00:05Z',
        status: 'success' as const,
        tags: { table: 'users', operation: 'select' },
      },
      {
        id: 'span_3',
        traceId: 'trace_def456',
        operation: 'cache_get',
        service: 'cache',
        duration: 5,
        timestamp: '2023-10-01T10:05:00Z',
        status: 'warning' as const,
        tags: { key: 'user:123', hit: 'false' },
      },
      {
        id: 'span_4',
        traceId: 'trace_xyz789',
        operation: 'external_api_call',
        service: 'payment',
        duration: 2000,
        timestamp: '2023-10-01T10:10:00Z',
        status: 'error' as const,
        tags: { service: 'stripe', error: 'timeout' },
      },
    ];
  };

  const handleRefresh = () => {
    setLoading(true);
    setTimeout(() => {
      setTraces(generateMockTraces());
      setLoading(false);
    }, 1000);
  };

  const toggleSpanExpansion = (spanId: string) => {
    const newExpanded = new Set(expandedSpans);
    if (newExpanded.has(spanId)) {
      newExpanded.delete(spanId);
    } else {
      newExpanded.add(spanId);
    }
    setExpandedSpans(newExpanded);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'error': return '#e74c3c';
      case 'warning': return '#f39c12';
      case 'success': return '#27ae60';
      default: return '#95a5a6';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'error': return 'exclamation-triangle';
      case 'warning': return 'exclamation-circle';
      case 'success': return 'check-circle';
      default: return 'circle';
    }
  };

  const groupedTraces = traces.reduce((acc, span) => {
    if (!acc[span.traceId]) {
      acc[span.traceId] = [];
    }
    acc[span.traceId].push(span);
    return acc;
  }, {} as Record<string, TraceSpan[]>);

  return (
    <div className={styles.container} style={{ width, height }}>
      <div className={styles.header}>
        <div className={styles.controls}>
          <Input
            placeholder="Enter trace query..."
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
          <LoadingPlaceholder text="Loading traces..." />
        ) : (
          <div className={styles.tracesContainer}>
            {Object.keys(groupedTraces).length === 0 ? (
              <div className={styles.empty}>No traces found</div>
            ) : (
              Object.entries(groupedTraces).map(([traceId, spans]) => (
                <div key={traceId} className={styles.traceGroup}>
                  <div className={styles.traceHeader}>
                    <Icon name="share-alt" />
                    <span className={styles.traceId}>Trace: {traceId}</span>
                    <span className={styles.spanCount}>{spans.length} spans</span>
                  </div>
                  <div className={styles.spansList}>
                    {spans.map((span) => (
                      <div key={span.id} className={styles.span}>
                        <div
                          className={styles.spanHeader}
                          onClick={() => toggleSpanExpansion(span.id)}
                        >
                          <Icon name={getStatusIcon(span.status)} style={{ color: getStatusColor(span.status) }} />
                          <span className={styles.operation}>{span.operation}</span>
                          <span className={styles.service}>{span.service}</span>
                          <span className={styles.duration}>{span.duration.toFixed(2)}ms</span>
                          <Icon name={expandedSpans.has(span.id) ? 'angle-down' : 'angle-right'} />
                        </div>
                        {expandedSpans.has(span.id) && options.showDetails && (
                          <div className={styles.spanDetails}>
                            <div className={styles.detailRow}>
                              <strong>Timestamp:</strong> {new Date(span.timestamp).toLocaleString()}
                            </div>
                            <div className={styles.detailRow}>
                              <strong>Duration:</strong> {span.duration}ms
                            </div>
                            {Object.keys(span.tags).length > 0 && (
                              <div className={styles.detailRow}>
                                <strong>Tags:</strong>
                                <div className={styles.tags}>
                                  {Object.entries(span.tags).map(([key, value]) => (
                                    <span key={key} className={styles.tag}>
                                      {key}: {value}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
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
  tracesContainer: css`
    flex: 1;
    overflow-y: auto;
    padding: ${theme.spacing(1)};
  `,
  traceGroup: css`
    margin-bottom: ${theme.spacing(2)};
    border: 1px solid ${theme.colors.border.medium};
    border-radius: ${theme.shape.borderRadius()};
  `,
  traceHeader: css`
    display: flex;
    align-items: center;
    gap: ${theme.spacing(1)};
    padding: ${theme.spacing(1)};
    background: ${theme.colors.background.secondary};
    border-bottom: 1px solid ${theme.colors.border.weak};
    font-weight: bold;
  `,
  traceId: css`
    font-family: ${theme.typography.fontFamily.monospace};
  `,
  spanCount: css`
    margin-left: auto;
    color: ${theme.colors.text.secondary};
    font-size: ${theme.typography.size.sm};
  `,
  spansList: css`
    padding: ${theme.spacing(1)};
  `,
  span: css`
    margin-bottom: ${theme.spacing(0.5)};
  `,
  spanHeader: css`
    display: flex;
    align-items: center;
    gap: ${theme.spacing(1)};
    padding: ${theme.spacing(0.5)};
    background: ${theme.colors.background.secondary};
    border-radius: ${theme.shape.borderRadius()};
    cursor: pointer;
    &:hover {
      background: ${theme.colors.background.primary};
    }
  `,
  operation: css`
    flex: 1;
    font-weight: 500;
  `,
  service: css`
    background: ${theme.colors.background.primary};
    padding: ${theme.spacing(0.25)} ${theme.spacing(0.5)};
    border-radius: ${theme.shape.borderRadius()};
    font-size: ${theme.typography.size.sm};
  `,
  duration: css`
    color: ${theme.colors.text.secondary};
    font-size: ${theme.typography.size.sm};
  `,
  spanDetails: css`
    padding: ${theme.spacing(1)};
    margin-top: ${theme.spacing(0.5)};
    background: ${theme.colors.background.primary};
    border-radius: ${theme.shape.borderRadius()};
    border: 1px solid ${theme.colors.border.weak};
  `,
  detailRow: css`
    margin-bottom: ${theme.spacing(0.5)};
    font-size: ${theme.typography.size.sm};
  `,
  tags: css`
    display: flex;
    flex-wrap: wrap;
    gap: ${theme.spacing(0.5)};
    margin-top: ${theme.spacing(0.5)};
  `,
  tag: css`
    background: ${theme.colors.background.secondary};
    padding: ${theme.spacing(0.25)} ${theme.spacing(0.5)};
    border-radius: ${theme.shape.borderRadius()};
    font-size: ${theme.typography.size.xs};
    font-family: ${theme.typography.fontFamily.monospace};
  `,
  empty: css`
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    color: ${theme.colors.text.secondary};
  `,
});
