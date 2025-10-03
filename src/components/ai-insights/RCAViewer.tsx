import React, { useState } from 'react';
import { css } from '@emotion/css';
import { GrafanaTheme2 } from '@grafana/data';
import { useStyles2, Button, Icon, Badge } from '@grafana/ui';

interface RCAViewerProps {
  data: any;
  type: 'rca' | 'anomalies' | 'predictions';
}

function RCAViewer({ data, type }: RCAViewerProps) {
  const s = useStyles2(getStyles);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['root-cause']));

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.9) {return 'green';}
    if (confidence >= 0.7) {return 'orange';}
    return 'red';
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'red';
      case 'medium': return 'orange';
      case 'low': return 'green';
      default: return 'blue';
    }
  };

  if (type === 'rca') {
    return (
      <div className={s.container}>
        <div className={s.header}>
          <h3>Root Cause Analysis Results</h3>
          <Button variant="secondary" size="sm" icon="download-alt">
            Export Report
          </Button>
        </div>

        <div className={s.section}>
          <div
            className={s.sectionHeader}
            onClick={() => toggleSection('root-cause')}
          >
            <Icon name={expandedSections.has('root-cause') ? 'angle-down' : 'angle-right'} />
            <h4>Root Cause: {data.rootCause}</h4>
            <Badge
              text={`${(data.confidence * 100).toFixed(1)}%`}
              color={getConfidenceColor(data.confidence)}
            />
          </div>
          {expandedSections.has('root-cause') && (
            <div className={s.sectionContent}>
              <p>Analysis completed with high confidence. The identified root cause explains the observed symptoms.</p>
            </div>
          )}
        </div>

        <div className={s.section}>
          <div
            className={s.sectionHeader}
            onClick={() => toggleSection('evidence')}
          >
            <Icon name={expandedSections.has('evidence') ? 'angle-down' : 'angle-right'} />
            <h4>Evidence ({data.evidence.length} items)</h4>
          </div>
          {expandedSections.has('evidence') && (
            <div className={s.sectionContent}>
              <ul className={s.evidenceList}>
                {data.evidence.map((item: string, index: number) => (
                  <li key={index} className={s.evidenceItem}>
                    <Icon name="check" color="green" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className={s.section}>
          <div
            className={s.sectionHeader}
            onClick={() => toggleSection('recommendations')}
          >
            <Icon name={expandedSections.has('recommendations') ? 'angle-down' : 'angle-right'} />
            <h4>Recommendations ({data.recommendations.length} items)</h4>
          </div>
          {expandedSections.has('recommendations') && (
            <div className={s.sectionContent}>
              <ul className={s.recommendationsList}>
                {data.recommendations.map((item: string, index: number) => (
                  <li key={index} className={s.recommendationItem}>
                    <Icon name="info-circle" color="orange" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (type === 'anomalies') {
    return (
      <div className={s.container}>
        <div className={s.header}>
          <h3>Anomaly Detection Results</h3>
          <Button variant="secondary" size="sm" icon="download-alt">
            Export Anomalies
          </Button>
        </div>

        <div className={s.anomaliesSummary}>
          <p>Found {data.anomalies.length} anomalies in the selected time range</p>
        </div>

        {data.anomalies.map((anomaly: any, index: number) => (
          <div key={index} className={s.anomaly}>
            <div className={s.anomalyHeader}>
              <h4>{anomaly.type} in {anomaly.metric}</h4>
              <Badge
                text={anomaly.severity}
                color={getSeverityColor(anomaly.severity)}
              />
            </div>
            <div className={s.anomalyDetails}>
              <p><strong>Timestamp:</strong> {new Date(anomaly.timestamp).toLocaleString()}</p>
              <p><strong>Expected Value:</strong> {anomaly.expectedValue || 'N/A'}</p>
              <p><strong>Actual Value:</strong> {anomaly.actualValue || 'N/A'}</p>
              <p><strong>Deviation:</strong> {anomaly.deviation ? `${(anomaly.deviation * 100).toFixed(1)}%` : 'N/A'}</p>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (type === 'predictions') {
    return (
      <div className={s.container}>
        <div className={s.header}>
          <h3>Prediction Results</h3>
          <Button variant="secondary" size="sm" icon="download-alt">
            Export Predictions
          </Button>
        </div>

        <div className={s.predictionsSummary}>
          <p>Generated {data.predictions.length} predictions for the next time period</p>
        </div>

        {data.predictions.map((prediction: any, index: number) => (
          <div key={index} className={s.prediction}>
            <div className={s.predictionHeader}>
              <h4>{prediction.metric}</h4>
              <Badge
                text={`${(prediction.confidence * 100).toFixed(1)}%`}
                color={getConfidenceColor(prediction.confidence)}
              />
            </div>
            <div className={s.predictionDetails}>
              <p><strong>Forecast:</strong> {prediction.forecast}</p>
              <p><strong>Time Horizon:</strong> {prediction.timeHorizon || 'Next 1 hour'}</p>
              <p><strong>Trend:</strong> {prediction.trend || 'Unknown'}</p>
              <p><strong>Recommended Action:</strong> {prediction.action || 'Monitor closely'}</p>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return <div className={s.container}>No insights available</div>;
}

const getStyles = (theme: GrafanaTheme2) => ({
  container: css`
    margin-top: ${theme.spacing(4)};
    padding: ${theme.spacing(2)};
    border: 1px solid ${theme.colors.border.medium};
    border-radius: ${theme.shape.borderRadius()};
    background: ${theme.colors.background.secondary};
  `,
  header: css`
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: ${theme.spacing(3)};
  `,
  section: css`
    margin-bottom: ${theme.spacing(3)};
  `,
  sectionHeader: css`
    display: flex;
    align-items: center;
    gap: ${theme.spacing(1)};
    padding: ${theme.spacing(2)};
    background: ${theme.colors.background.primary};
    border: 1px solid ${theme.colors.border.weak};
    border-radius: ${theme.shape.borderRadius()};
    cursor: pointer;
    transition: background-color 0.2s ease;

    &:hover {
      background: ${theme.colors.background.secondary};
    }

    h4 {
      margin: 0;
      flex: 1;
    }
  `,
  sectionContent: css`
    padding: ${theme.spacing(2)};
    border: 1px solid ${theme.colors.border.weak};
    border-top: none;
    border-radius: 0 0 ${theme.shape.borderRadius()} ${theme.shape.borderRadius()};
    background: ${theme.colors.background.primary};
  `,
  evidenceList: css`
    list-style: none;
    padding: 0;
    margin: 0;
  `,
  evidenceItem: css`
    display: flex;
    align-items: center;
    gap: ${theme.spacing(1)};
    padding: ${theme.spacing(1, 0)};
    color: ${theme.colors.text.primary};
  `,
  recommendationsList: css`
    list-style: none;
    padding: 0;
    margin: 0;
  `,
  recommendationItem: css`
    display: flex;
    align-items: center;
    gap: ${theme.spacing(1)};
    padding: ${theme.spacing(1, 0)};
    color: ${theme.colors.text.primary};
  `,
  anomaly: css`
    margin-bottom: ${theme.spacing(2)};
    padding: ${theme.spacing(2)};
    border: 1px solid ${theme.colors.border.weak};
    border-radius: ${theme.shape.borderRadius()};
  `,
  anomaliesSummary: css`
    margin-bottom: ${theme.spacing(3)};
    padding: ${theme.spacing(2)};
    background: ${theme.colors.background.primary};
    border: 1px solid ${theme.colors.border.weak};
    border-radius: ${theme.shape.borderRadius()};
    text-align: center;
  `,
  anomalyHeader: css`
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: ${theme.spacing(2)};
  `,
  anomalyDetails: css`
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: ${theme.spacing(1)};
    font-size: ${theme.typography.bodySmall.fontSize};

    p {
      margin: 0;
    }
  `,
  prediction: css`
    margin-bottom: ${theme.spacing(2)};
    padding: ${theme.spacing(2)};
    border: 1px solid ${theme.colors.border.weak};
    border-radius: ${theme.shape.borderRadius()};
  `,
  predictionsSummary: css`
    margin-bottom: ${theme.spacing(3)};
    padding: ${theme.spacing(2)};
    background: ${theme.colors.background.primary};
    border: 1px solid ${theme.colors.border.weak};
    border-radius: ${theme.shape.borderRadius()};
    text-align: center;
  `,
  predictionHeader: css`
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: ${theme.spacing(2)};
  `,
  predictionDetails: css`
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: ${theme.spacing(1)};
    font-size: ${theme.typography.bodySmall.fontSize};

    p {
      margin: 0;
    }
  `,
});

export default RCAViewer;
