import React from 'react';
import { css } from '@emotion/css';
import { GrafanaTheme2 } from '@grafana/data';
import { useStyles2, Badge, CodeEditor } from '@grafana/ui';
import { LogEntry } from './DocumentTable';

export interface RowDetailsProps {
  entry: LogEntry;
  onClose?: () => void;
}

export function RowDetails({ entry, onClose }: RowDetailsProps) {
  const s = useStyles2(getStyles);

  // Format the log entry as JSON for display
  const jsonData = JSON.stringify(entry, null, 2);

  // Get log level color
  const getLevelColor = (level?: string): 'red' | 'orange' | 'blue' | 'green' | 'purple' => {
    switch (level?.toUpperCase()) {
      case 'ERROR':
        return 'red';
      case 'WARN':
      case 'WARNING':
        return 'orange';
      case 'INFO':
        return 'blue';
      case 'DEBUG':
        return 'purple';
      default:
        return 'green';
    }
  };

  // Format timestamp
  const formatTimestamp = (timestamp: string | number) => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleString();
    } catch {
      return String(timestamp);
    }
  };

  return (
    <div className={s.container}>
      {/* Header */}
      <div className={s.header}>
        <div className={s.headerLeft}>
          <h4 className={s.title}>Log Entry Details</h4>
          {entry.level && (
            <Badge
              text={entry.level}
              color={getLevelColor(entry.level)}
              className={s.levelBadge}
            />
          )}
        </div>
        {onClose && (
          <button className={s.closeButton} onClick={onClose} aria-label="Close details">
            ×
          </button>
        )}
      </div>

      {/* Summary */}
      <div className={s.summary}>
        <div className={s.summaryItem}>
          <span className={s.summaryLabel}>Timestamp:</span>
          <span className={s.summaryValue}>{formatTimestamp(entry.timestamp)}</span>
        </div>
        {entry.source && (
          <div className={s.summaryItem}>
            <span className={s.summaryLabel}>Source:</span>
            <span className={s.summaryValue}>{entry.source}</span>
          </div>
        )}
        {entry.level && (
          <div className={s.summaryItem}>
            <span className={s.summaryLabel}>Level:</span>
            <span className={s.summaryValue}>{entry.level}</span>
          </div>
        )}
      </div>

      {/* Message */}
      <div className={s.section}>
        <h5 className={s.sectionTitle}>Message</h5>
        <div className={s.message}>
          {entry.message}
        </div>
      </div>

      {/* Structured Data */}
      <div className={s.section}>
        <h5 className={s.sectionTitle}>Structured Data</h5>
        <div className={s.jsonContainer}>
          <CodeEditor
            value={jsonData}
            language="json"
            showLineNumbers={true}
            readOnly={true}
            height="300px"
            containerStyles={s.codeEditor}
          />
        </div>
      </div>

      {/* Key-Value Pairs */}
      <div className={s.section}>
        <h5 className={s.sectionTitle}>Fields</h5>
        <div className={s.fieldsGrid}>
          {Object.entries(entry).map(([key, value]) => (
            <div key={key} className={s.fieldItem}>
              <div className={s.fieldName}>{key}:</div>
              <div className={s.fieldValue}>
                {typeof value === 'object' ? JSON.stringify(value) : String(value)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  container: css`
    background: ${theme.colors.background.secondary};
    border: 1px solid ${theme.colors.border.weak};
    border-radius: ${theme.shape.radius.default};
    padding: ${theme.spacing(3)};
    margin-top: ${theme.spacing(1)};
  `,
  header: css`
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: ${theme.spacing(2)};
    padding-bottom: ${theme.spacing(2)};
    border-bottom: 1px solid ${theme.colors.border.weak};
  `,
  headerLeft: css`
    display: flex;
    align-items: center;
    gap: ${theme.spacing(2)};
  `,
  title: css`
    margin: 0;
    font-size: ${theme.typography.size.lg};
    font-weight: ${theme.typography.fontWeightMedium};
    color: ${theme.colors.text.primary};
  `,
  levelBadge: css`
    font-size: ${theme.typography.size.sm};
  `,
  closeButton: css`
    background: none;
    border: none;
    font-size: ${theme.typography.size.lg};
    color: ${theme.colors.text.secondary};
    cursor: pointer;
    padding: ${theme.spacing(0.5)};
    border-radius: ${theme.shape.radius.default};
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;

    &:hover {
      background: ${theme.colors.action.hover};
      color: ${theme.colors.text.primary};
    }
  `,
  summary: css`
    display: flex;
    flex-wrap: wrap;
    gap: ${theme.spacing(3)};
    margin-bottom: ${theme.spacing(3)};
    padding: ${theme.spacing(2)};
    background: ${theme.colors.background.primary};
    border-radius: ${theme.shape.radius.default};
  `,
  summaryItem: css`
    display: flex;
    flex-direction: column;
    min-width: 150px;
  `,
  summaryLabel: css`
    font-size: ${theme.typography.size.sm};
    font-weight: ${theme.typography.fontWeightMedium};
    color: ${theme.colors.text.secondary};
    margin-bottom: ${theme.spacing(0.5)};
  `,
  summaryValue: css`
    font-size: ${theme.typography.size.md};
    color: ${theme.colors.text.primary};
    font-family: ${theme.typography.fontFamilyMonospace};
  `,
  section: css`
    margin-bottom: ${theme.spacing(3)};
  `,
  sectionTitle: css`
    margin: 0 0 ${theme.spacing(2)} 0;
    font-size: ${theme.typography.size.md};
    font-weight: ${theme.typography.fontWeightMedium};
    color: ${theme.colors.text.primary};
  `,
  message: css`
    background: ${theme.colors.background.primary};
    border: 1px solid ${theme.colors.border.weak};
    border-radius: ${theme.shape.radius.default};
    padding: ${theme.spacing(2)};
    font-family: ${theme.typography.fontFamilyMonospace};
    font-size: ${theme.typography.size.sm};
    color: ${theme.colors.text.primary};
    white-space: pre-wrap;
    word-break: break-all;
    line-height: 1.4;
  `,
  jsonContainer: css`
    border: 1px solid ${theme.colors.border.weak};
    border-radius: ${theme.shape.radius.default};
    overflow: hidden;
  `,
  codeEditor: css`
    border: none !important;
    border-radius: 0 !important;
  `,
  fieldsGrid: css`
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: ${theme.spacing(2)};
  `,
  fieldItem: css`
    display: flex;
    flex-direction: column;
    padding: ${theme.spacing(2)};
    background: ${theme.colors.background.primary};
    border: 1px solid ${theme.colors.border.weak};
    border-radius: ${theme.shape.radius.default};
  `,
  fieldName: css`
    font-size: ${theme.typography.size.sm};
    font-weight: ${theme.typography.fontWeightMedium};
    color: ${theme.colors.text.secondary};
    margin-bottom: ${theme.spacing(1)};
    font-family: ${theme.typography.fontFamilyMonospace};
  `,
  fieldValue: css`
    font-size: ${theme.typography.size.sm};
    color: ${theme.colors.text.primary};
    font-family: ${theme.typography.fontFamilyMonospace};
    word-break: break-all;
    line-height: 1.4;
  `,
});
