import React, { useEffect } from 'react';
import { css } from '@emotion/css';
import { GrafanaTheme2 } from '@grafana/data';
import { useStyles2 } from '@grafana/ui';
import { DocumentTable, LogEntry } from '../DocumentTable';
import { TimeHistogram } from '../TimeHistogram';
import { FieldSidebar, FieldInfo } from '../FieldSidebar';
import { useLogsData, useLogsUI, useLogsTimeRange } from '../../../contexts/LogsContext';

export function LogsTab() {
  const s = useStyles2(getStyles);

  // Use context hooks
  const { logs, histogram, loading, error } = useLogsData();
  const { expandedRows, selectedFields, pinnedFields, fieldInfo, toggleRowExpansion, toggleFieldSelection, toggleFieldPin, setFieldInfo } = useLogsUI();
  const { setTimeRange } = useLogsTimeRange();

  // Update field info when logs change
  useEffect(() => {
    const fieldMap = new Map<string, { count: number; values: Map<string, number>; type: string }>();

    logs.forEach(entry => {
      Object.entries(entry).forEach(([key, value]) => {
        if (!fieldMap.has(key)) {
          fieldMap.set(key, { count: 0, values: new Map(), type: typeof value });
        }
        const field = fieldMap.get(key)!;
        field.count++;

        if (typeof value === 'string' || typeof value === 'number') {
          const strValue = String(value);
          field.values.set(strValue, (field.values.get(strValue) || 0) + 1);
        }
      });
    });

    const newFieldInfo: FieldInfo[] = Array.from(fieldMap.entries()).map(([name, data]) => {
      const totalCount = logs.length;
      const topValues = Array.from(data.values.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([value, count]) => ({
          value,
          count,
          percentage: (count / totalCount) * 100
        }));

      return {
        name,
        type: data.type,
        count: data.count,
        percentage: (data.count / totalCount) * 100,
        topValues
      };
    }).sort((a, b) => b.count - a.count);

    setFieldInfo(newFieldInfo);
  }, [logs, setFieldInfo]);

  const handleRowExpand = (entry: LogEntry) => {
    const rowId = `row-${logs.indexOf(entry)}`;
    toggleRowExpansion(rowId);
  };

  const handleFieldToggle = (fieldName: string) => {
    toggleFieldSelection(fieldName);
  };

  const handleFieldPin = (fieldName: string) => {
    toggleFieldPin(fieldName);
  };

  const handleHistogramBarClick = (timeRangeClick: { from: number; to: number }) => {
    setTimeRange(timeRangeClick.from, timeRangeClick.to);
  };

  return (
    <div className={s.container}>
      {error && (
        <div className={s.error}>
          Error: {error}
        </div>
      )}

      <div className={s.content}>
        {/* Field Sidebar */}
        <div className={s.sidebar}>
          <FieldSidebar
            fields={fieldInfo}
            selectedFields={selectedFields}
            onFieldToggle={handleFieldToggle}
            pinnedFields={pinnedFields}
            onFieldPin={handleFieldPin}
          />
        </div>

        {/* Main Content Area */}
        <div className={s.main}>
          {/* Time Histogram */}
          <div className={s.histogram}>
            <TimeHistogram
              data={histogram}
              onBarClick={handleHistogramBarClick}
            />
          </div>

          {/* Document Table */}
          <div className={s.table}>
            {loading ? (
              <div className={s.loading}>Loading logs...</div>
            ) : (
              <DocumentTable
                data={logs}
                onRowExpand={handleRowExpand}
                expandedRows={expandedRows}
                height={500}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  container: css`
    height: 100%;
    display: flex;
    flex-direction: column;
  `,
  error: css`
    padding: ${theme.spacing(2)};
    background: ${theme.colors.error.main};
    color: ${theme.colors.error.contrastText};
    border-radius: ${theme.shape.radius.default};
    margin-bottom: ${theme.spacing(2)};
  `,
  loading: css`
    display: flex;
    align-items: center;
    justify-content: center;
    padding: ${theme.spacing(4)};
    color: ${theme.colors.text.secondary};
  `,
  content: css`
    flex: 1;
    display: flex;
    gap: ${theme.spacing(2)};
    padding: ${theme.spacing(2)};
    overflow: hidden;
  `,
  sidebar: css`
    flex-shrink: 0;
  `,
  main: css`
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: ${theme.spacing(2)};
    overflow: hidden;
  `,
  histogram: css`
    flex-shrink: 0;
  `,
  table: css`
    flex: 1;
    overflow: hidden;
  `,
});
