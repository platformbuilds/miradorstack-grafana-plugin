import React, { useState, useEffect, useCallback } from 'react';
import { css } from '@emotion/css';
import { PanelProps } from '@grafana/data';
import { useStyles2, Button, Input, Select, LoadingPlaceholder, Icon } from '@grafana/ui';
import { TracesExplorerOptions } from './types';

interface Props extends PanelProps<TracesExplorerOptions> {}

interface TraceSpan {
  traceID: string;
  spanID: string;
  parentSpanID?: string;
  operationName: string;
  serviceName: string;
  serviceTags?: string;
  startTime: string | number;
  duration: number;
  logs?: string;
  references?: string;
  tags?: string;
  kind?: string;
  statusCode?: string | number;
  warnings?: string;
  stackTraces?: string;
  [key: string]: any;
}

export const TracesExplorerPanel: React.FC<Props> = ({ options, data, width, height }) => {
  // Panel-level debug: print type and value of first timestamp in DataFrame
  let timestampDebug: any = null;
  if (data?.series?.length > 0) {
    const series = data.series[0];
    const tsField = series.fields.find((f: any) => f.name === 'timestamp');
    if (tsField && tsField.values.length > 0) {
      const tsValue = tsField.values.get(0);
      timestampDebug = {
        value: tsValue,
        type: typeof tsValue,
        fieldType: tsField.type,
      };
    }
  }
  // Debug: extract DataFrame structure for display
  let debugInfo: any = null;
  if (data?.series?.length > 0) {
    const series = data.series[0];
    const fieldInfo = series.fields.map((f: any) => ({ name: f.name, type: f.type, valuesType: typeof f.values[0] }));
    let sampleRow: Record<string, any> = {};
    if (series.fields.length > 0 && series.fields[0].values.length > 0) {
      series.fields.forEach((f: any) => {
        sampleRow[f.name] = f.values.get(0);
      });
    }
    debugInfo = {
      refId: series.refId,
      fields: fieldInfo,
      meta: series.meta,
      sampleRow,
    };
  }
  const styles = useStyles2(getStyles);
  const [traces, setTraces] = useState<TraceSpan[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState(options.query);
  const [timeRange, setTimeRange] = useState(options.timeRange);
  const [expandedSpans, setExpandedSpans] = useState<Set<string>>(new Set());

  // Map DataFrame to TraceSpan[] using backend field names
  const processData = useCallback((data: any) => {
    if (!data?.series?.length) return [];
    const series = data.series[0];
    if (!series?.fields) return [];
    const fieldMap: Record<string, any> = {};
    series.fields.forEach((f: any) => {
      fieldMap[f.name] = f.values;
    });
    const len = series.fields[0]?.values.length || 0;
    const result: TraceSpan[] = [];
    for (let i = 0; i < len; i++) {
      result.push({
        traceID: fieldMap['traceID']?.[i] || '',
        spanID: fieldMap['spanID']?.[i] || '',
        parentSpanID: fieldMap['parentSpanID']?.[i] || '',
        operationName: fieldMap['operationName']?.[i] || '',
        serviceName: fieldMap['serviceName']?.[i] || '',
        serviceTags: fieldMap['serviceTags']?.[i] || '',
        startTime: fieldMap['startTime']?.[i] || '',
        duration: Number(fieldMap['duration']?.[i] || 0),
        logs: fieldMap['logs']?.[i] || '',
        references: fieldMap['references']?.[i] || '',
        tags: fieldMap['tags']?.[i] || '',
        kind: fieldMap['kind']?.[i] || '',
        statusCode: fieldMap['statusCode']?.[i] || '',
        warnings: fieldMap['warnings']?.[i] || '',
        stackTraces: fieldMap['stackTraces']?.[i] || '',
        ...Object.fromEntries(Object.entries(fieldMap).map(([k, v]) => [k, v?.[i]])),
      });
    }
    return result.slice(0, options.maxSpans);
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
        traceID: 'trace_abc123',
        spanID: 'span_1',
        operationName: 'http_request',
        serviceName: 'web',
        duration: 150,
        startTime: '2023-10-01T10:00:00Z',
        statusCode: 'success',
        tags: '{"method":"GET","url":"/api/users"}',
      },
      {
        traceID: 'trace_abc123',
        spanID: 'span_2',
        parentSpanID: 'span_1',
        operationName: 'db_query',
        serviceName: 'api',
        duration: 50,
        startTime: '2023-10-01T10:00:05Z',
        statusCode: 'success',
        tags: '{"table":"users","operation":"select"}',
      },
      {
        traceID: 'trace_def456',
        spanID: 'span_3',
        operationName: 'cache_get',
        serviceName: 'cache',
        duration: 5,
        startTime: '2023-10-01T10:05:00Z',
        statusCode: 'warning',
        tags: '{"key":"user:123","hit":"false"}',
      },
      {
        traceID: 'trace_xyz789',
        spanID: 'span_4',
        operationName: 'external_api_call',
        serviceName: 'payment',
        duration: 2000,
        startTime: '2023-10-01T10:10:00Z',
        statusCode: 'error',
        tags: '{"service":"stripe","error":"timeout"}',
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

  // Group by traceID, and sort spans by startTime
  const groupedTraces = traces.reduce((acc, span) => {
    if (!acc[span.traceID]) {
      acc[span.traceID] = [];
    }
    acc[span.traceID].push(span);
    return acc;
  }, {} as Record<string, TraceSpan[]>);
  Object.keys(groupedTraces).forEach(traceID => {
    groupedTraces[traceID].sort((a, b) => {
      const aTime = typeof a.startTime === 'number' ? a.startTime : Number(a.startTime);
      const bTime = typeof b.startTime === 'number' ? b.startTime : Number(b.startTime);
      return aTime - bTime;
    });
  });

  return (
    <div className={styles.container} style={{ width, height }}>
      {/* Debug section: show timestamp type and value */}
      {timestampDebug && (
        <div style={{ background: '#ffeef0', color: '#333', padding: 8, marginBottom: 8, border: '1px solid #ffb3b8', borderRadius: 4, fontSize: 12 }}>
          <strong>Timestamp Debug:</strong>
          <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all', margin: 0 }}>{JSON.stringify(timestampDebug, null, 2)}</pre>
        </div>
      )}
      {/* Debug section: show DataFrame structure */}
      {debugInfo && (
        <div style={{ background: '#fffbe6', color: '#333', padding: 8, marginBottom: 8, border: '1px solid #ffe58f', borderRadius: 4, fontSize: 12 }}>
          <strong>DataFrame Debug Info:</strong>
          <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all', margin: 0 }}>{JSON.stringify(debugInfo, null, 2)}</pre>
        </div>
      )}
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
              Object.entries(groupedTraces).map(([traceID, spans]) => (
                <div key={traceID} className={styles.traceGroup}>
                  <div className={styles.traceHeader}>
                    <Icon name="share-alt" />
                    <span className={styles.traceId}>Trace: {traceID}</span>
                    <span className={styles.spanCount}>{spans.length} spans</span>
                  </div>
                  <div className={styles.spansList}>
                    {spans.map((span) => (
                      <div key={span.spanID} className={styles.span}>
                        <div
                          className={styles.spanHeader}
                          onClick={() => toggleSpanExpansion(span.spanID)}
                        >
                          <Icon name={getStatusIcon(String(span.statusCode || ''))} style={{ color: getStatusColor(String(span.statusCode || '')) }} />
                          <span className={styles.operation}>{span.operationName}</span>
                          <span className={styles.service}>{span.serviceName}</span>
                          <span className={styles.duration}>{span.duration?.toFixed(2)}ms</span>
                          {span.parentSpanID && <span className={styles.parentId}>parent: {span.parentSpanID}</span>}
                          <Icon name={expandedSpans.has(span.spanID) ? 'angle-down' : 'angle-right'} />
                        </div>
                        {expandedSpans.has(span.spanID) && options.showDetails && (
                          <div className={styles.spanDetails}>
                            <div className={styles.detailRow}>
                              <strong>Span ID:</strong> {span.spanID}
                            </div>
                            <div className={styles.detailRow}>
                              <strong>Trace ID:</strong> {span.traceID}
                            </div>
                            {span.parentSpanID && (
                              <div className={styles.detailRow}>
                                <strong>Parent ID:</strong> {span.parentSpanID}
                              </div>
                            )}
                            <div className={styles.detailRow}>
                              <strong>Start Time:</strong> {span.startTime ? new Date(Number(span.startTime)).toLocaleString() : ''}
                            </div>
                            <div className={styles.detailRow}>
                              <strong>Duration:</strong> {span.duration}ms
                            </div>
                            {span.statusCode !== undefined && (
                              <div className={styles.detailRow}>
                                <strong>Status Code:</strong> {span.statusCode}
                              </div>
                            )}
                            {span.kind && (
                              <div className={styles.detailRow}>
                                <strong>Kind:</strong> {span.kind}
                              </div>
                            )}
                            {span.serviceTags && (
                              <div className={styles.detailRow}>
                                <strong>Service Tags:</strong> {span.serviceTags}
                              </div>
                            )}
                            {span.tags && (
                              <div className={styles.detailRow}>
                                <strong>Tags:</strong> {span.tags}
                              </div>
                            )}
                            {span.logs && (
                              <div className={styles.detailRow}>
                                <strong>Logs:</strong> {span.logs}
                              </div>
                            )}
                            {span.references && (
                              <div className={styles.detailRow}>
                                <strong>References:</strong> {span.references}
                              </div>
                            )}
                            {span.warnings && (
                              <div className={styles.detailRow}>
                                <strong>Warnings:</strong> {span.warnings}
                              </div>
                            )}
                            {span.stackTraces && (
                              <div className={styles.detailRow}>
                                <strong>Stack Traces:</strong> <pre style={{whiteSpace:'pre-wrap'}}>{span.stackTraces}</pre>
                              </div>
                            )}
                            {/* Show any extra fields */}
                            {Object.entries(span)
                              .filter(([k]) => !['traceID','spanID','parentSpanID','operationName','serviceName','serviceTags','startTime','duration','logs','references','tags','kind','statusCode','warnings','stackTraces'].includes(k))
                              .map(([k, v]) => (
                                <div className={styles.detailRow} key={k}>
                                  <strong>{k}:</strong> {String(v)}
                                </div>
                              ))}
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
  parentId: css`
    margin-left: 1em;
    color: ${theme.colors.text.secondary};
    font-size: ${theme.typography.size.xs};
  `,
  empty: css`
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    color: ${theme.colors.text.secondary};
  `,
});
