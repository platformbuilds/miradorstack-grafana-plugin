import React, { useState, useEffect } from 'react';
import { css } from '@emotion/css';
import { PanelProps, FieldType } from '@grafana/data';
import { useStyles2, Button, Input, Select, LoadingPlaceholder } from '@grafana/ui';
import { MetricsExplorerOptions } from './types';

interface Props extends PanelProps<MetricsExplorerOptions> {}

export const MetricsExplorerPanel: React.FC<Props> = ({ options, data, width, height }) => {
  const styles = useStyles2(getStyles);
  const [metrics, setMetrics] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState(options.query);
  const [timeRange, setTimeRange] = useState(options.timeRange);

  useEffect(() => {
    if (data?.series?.length > 0) {
      setMetrics(processData(data));
    } else {
      setMetrics(generateMockMetrics());
    }
  }, [data]);

  const processData = (data: any) => {
    return data.series.map((series: any) => ({
      name: series.name || 'Metric',
      data: series.fields.find((f: any) => f.type === FieldType.number)?.values || [],
      timestamps: series.fields.find((f: any) => f.type === FieldType.time)?.values || [],
    }));
  };

  const generateMockMetrics = () => {
    const now = Date.now();
    const timestamps = Array.from({ length: 20 }, (_, i) => now - (19 - i) * 300000); // 5min intervals

    return [
      {
        name: 'CPU Usage (%)',
        data: Array.from({ length: 20 }, () => Math.random() * 100),
        timestamps,
      },
      {
        name: 'Memory Usage (%)',
        data: Array.from({ length: 20 }, () => Math.random() * 100),
        timestamps,
      },
      {
        name: 'Response Time (ms)',
        data: Array.from({ length: 20 }, () => Math.random() * 1000 + 100),
        timestamps,
      },
    ];
  };

  const handleRefresh = () => {
    setLoading(true);
    setTimeout(() => {
      setMetrics(generateMockMetrics());
      setLoading(false);
    }, 1000);
  };

  const renderChart = () => {
    if (metrics.length === 0) {return null;}

    // Simple chart representation - in a real implementation, you'd use a charting library
    return (
      <div className={styles.chart}>
        {metrics.map((metric, index) => (
          <div key={index} className={styles.metricSeries}>
            <h4>{metric.name}</h4>
            <div className={styles.dataPoints}>
              {metric.data.slice(0, 10).map((value: number, i: number) => (
                <div
                  key={i}
                  className={styles.dataPoint}
                  style={{
                    height: `${Math.min(value, 100)}%`,
                    backgroundColor: `hsl(${index * 120}, 70%, 50%)`,
                  }}
                  title={`${value.toFixed(2)}`}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className={styles.container} style={{ width, height }}>
      <div className={styles.header}>
        <div className={styles.controls}>
          <Input
            placeholder="Enter metrics query..."
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
          <Select
            options={[
              { label: 'Line', value: 'line' },
              { label: 'Bar', value: 'bar' },
              { label: 'Area', value: 'area' },
            ]}
            value={options.chartType}
            onChange={() => {}} // Would update options in real implementation
            className={styles.chartSelect}
          />
          <Button variant="primary" onClick={handleRefresh} disabled={loading}>
            {loading ? 'Loading...' : 'Refresh'}
          </Button>
        </div>
      </div>

      <div className={styles.content}>
        {loading ? (
          <LoadingPlaceholder text="Loading metrics..." />
        ) : (
          renderChart()
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
    flex-wrap: wrap;
  `,
  queryInput: css`
    flex: 1;
    min-width: 200px;
  `,
  timeSelect: css`
    min-width: 100px;
  `,
  chartSelect: css`
    min-width: 80px;
  `,
  content: css`
    flex: 1;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    padding: ${theme.spacing(1)};
  `,
  chart: css`
    display: flex;
    flex-direction: column;
    gap: ${theme.spacing(2)};
    height: 100%;
  `,
  metricSeries: css`
    flex: 1;
    display: flex;
    flex-direction: column;
    h4 {
      margin: 0 0 ${theme.spacing(1)} 0;
      font-size: ${theme.typography.size.md};
    }
  `,
  dataPoints: css`
    display: flex;
    align-items: end;
    gap: 2px;
    height: 100px;
    padding: ${theme.spacing(1)} 0;
    border: 1px solid ${theme.colors.border.medium};
    border-radius: ${theme.shape.borderRadius()};
  `,
  dataPoint: css`
    flex: 1;
    min-width: 8px;
    border-radius: 2px 2px 0 0;
    transition: opacity 0.2s;
    &:hover {
      opacity: 0.8;
    }
  `,
});
