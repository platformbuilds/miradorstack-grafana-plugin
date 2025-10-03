import React from 'react';
import { css } from '@emotion/css';
import { GrafanaTheme2 } from '@grafana/data';
import { useStyles2 } from '@grafana/ui';

interface DataVisualizerProps {
  data: any[];
  type: 'logs' | 'metrics' | 'traces' | 'schema' | 'data-quality';
}

function DataVisualizer({ data, type }: DataVisualizerProps) {
  const s = useStyles2(getStyles);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'good':
      case 'excellent':
        return '#73BF69';
      case 'warning':
      case 'fair':
        return '#FADE2A';
      case 'poor':
      case 'critical':
        return '#F2495C';
      default:
        return '#5794F2';
    }
  };

  if (!data || data.length === 0) {
    return <div className={s.empty}>No data to visualize</div>;
  }

  if (type === 'schema') {
    return (
      <div className={s.container}>
        <h3>Schema Visualization</h3>
        <div className={s.schemaGrid}>
          {data.map((field: any, index: number) => (
            <div key={index} className={s.schemaField}>
              <div className={s.fieldName}>{field.name}</div>
              <div className={s.fieldType}>{field.type}</div>
              <div className={s.fieldDetails}>
                <span>Nullable: {field.nullable ? 'Yes' : 'No'}</span>
                <span>Indexed: {field.indexed ? 'Yes' : 'No'}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (type === 'data-quality') {
    return (
      <div className={s.container}>
        <h3>Data Quality Metrics</h3>
        <div className={s.qualityMetrics}>
          {data.map((metric: any, index: number) => (
            <div key={index} className={s.metricCard}>
              <h4>{metric.metric}</h4>
              <div className={s.metricValue}>{metric.value}%</div>
              <div className={s.metricStatus} style={{ color: getStatusColor(metric.status) }}>
                {metric.status}
              </div>
              <p>{metric.description}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={s.container}>
      <h3>{type.charAt(0).toUpperCase() + type.slice(1)} Data</h3>
      <pre className={s.data}>
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  container: css`
    margin-top: ${theme.spacing(2)};
  `,
  empty: css`
    padding: ${theme.spacing(4)};
    text-align: center;
    color: ${theme.colors.text.secondary};
  `,
  data: css`
    background: ${theme.colors.background.secondary};
    padding: ${theme.spacing(2)};
    border-radius: ${theme.shape.borderRadius()};
    overflow-x: auto;
    font-family: monospace;
    font-size: ${theme.typography.size.sm};
  `,
  schemaGrid: css`
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: ${theme.spacing(2)};
    margin-top: ${theme.spacing(2)};
  `,
  schemaField: css`
    padding: ${theme.spacing(2)};
    border: 1px solid ${theme.colors.border.weak};
    border-radius: ${theme.shape.borderRadius()};
    background: ${theme.colors.background.secondary};
  `,
  fieldName: css`
    font-weight: ${theme.typography.fontWeightMedium};
    font-size: ${theme.typography.size.lg};
    margin-bottom: ${theme.spacing(1)};
    color: ${theme.colors.text.primary};
  `,
  fieldType: css`
    color: ${theme.colors.text.secondary};
    font-family: monospace;
    margin-bottom: ${theme.spacing(1)};
  `,
  fieldDetails: css`
    display: flex;
    gap: ${theme.spacing(2)};
    font-size: ${theme.typography.size.sm};
    color: ${theme.colors.text.secondary};

    span {
      padding: ${theme.spacing(0.5, 1)};
      background: ${theme.colors.background.primary};
      border-radius: ${theme.shape.borderRadius(1)};
    }
  `,
  qualityMetrics: css`
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: ${theme.spacing(2)};
    margin-top: ${theme.spacing(2)};
  `,
  metricCard: css`
    padding: ${theme.spacing(2)};
    border: 1px solid ${theme.colors.border.weak};
    border-radius: ${theme.shape.borderRadius()};
    background: ${theme.colors.background.secondary};
    text-align: center;
  `,
  metricValue: css`
    font-size: ${theme.typography.size.lg};
    font-weight: ${theme.typography.fontWeightBold};
    color: ${theme.colors.text.primary};
    margin: ${theme.spacing(1, 0)};
  `,
  metricStatus: css`
    font-size: ${theme.typography.size.md};
    font-weight: ${theme.typography.fontWeightMedium};
    margin-bottom: ${theme.spacing(1)};
  `,
});

export default DataVisualizer;
