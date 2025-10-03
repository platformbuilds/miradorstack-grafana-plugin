import React, { useMemo, useCallback, memo } from 'react';
import { css } from '@emotion/css';
import { GrafanaTheme2 } from '@grafana/data';
import { useStyles2, Button } from '@grafana/ui';
import { RowDetails } from './RowDetails';

export interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
  source?: string;
  [key: string]: any;
}

interface DocumentTableProps {
  data: LogEntry[];
  onRowClick?: (entry: LogEntry) => void;
  onRowExpand?: (entry: LogEntry) => void;
  expandedRows?: Set<string>;
  height?: number;
}

export const DocumentTable = memo(function DocumentTable({
  data,
  onRowClick,
  onRowExpand,
  expandedRows = new Set(),
  height = 400
}: DocumentTableProps) {
  const s = useStyles2(getStyles);
  
  // Log received data for debugging
  console.log(`DocumentTable: Rendering with ${data ? data.length : 0} log entries`);
  if (data && data.length > 0) {
    console.log('Sample log entry:', JSON.stringify(data[0]).substring(0, 200) + '...');
    
    // Normalize the field names
    data = data.map(entry => {
      // Convert _time to timestamp if needed
      if (entry._time && !entry.timestamp) {
        entry.timestamp = entry._time;
      }
      
      // Convert _msg to message if needed
      if (entry._msg && !entry.message) {
        entry.message = entry._msg;
      }
      
      // Convert severity to level if needed
      if (entry.severity && !entry.level) {
        entry.level = entry.severity;
      }
      
      return entry;
    });
  }

  // Extract columns from data
  const columns = useMemo(() => {
    if (data.length === 0) {
      return ['timestamp', 'level', 'message'];
    }

    const allKeys = new Set<string>();
    data.forEach(entry => {
      Object.keys(entry).forEach(key => allKeys.add(key));
    });

    // Prioritize common log fields
    const priorityFields = ['timestamp', 'level', 'message', 'source', 'service', 'host'];
    const otherFields = Array.from(allKeys).filter(key => !priorityFields.includes(key));

    return [...priorityFields.filter(key => allKeys.has(key)), ...otherFields];
  }, [data]);

  const handleRowClick = useCallback((entry: LogEntry) => {
    onRowClick?.(entry);
  }, [onRowClick]);

  const handleExpandClick = useCallback((entry: LogEntry, event: React.MouseEvent) => {
    event.stopPropagation();
    onRowExpand?.(entry);
  }, [onRowExpand]);

  return (
    <div className={s.container} style={{ height }}>
      <div className={s.tableContainer}>
        {/* Table Header */}
        <div className={s.header}>
          <div className={s.headerRow}>
            <div className={s.expandColumn}></div>
            {columns.map(column => (
              <div key={column} className={s.headerCell}>
                {column.charAt(0).toUpperCase() + column.slice(1)}
              </div>
            ))}
          </div>
        </div>

        {/* Table Body */}
        <div className={s.body}>
          {data.map((entry, index) => {
            const rowId = `row-${index}`;
            const isExpanded = expandedRows.has(rowId);

            return (
              <div key={rowId}>
                <div
                  className={s.row}
                  onClick={() => handleRowClick(entry)}
                >
                  <div className={s.expandColumn}>
                    {onRowExpand && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={(e) => handleExpandClick(entry, e)}
                        icon={isExpanded ? 'angle-down' : 'angle-right'}
                        aria-label={isExpanded ? 'Collapse row' : 'Expand row'}
                      />
                    )}
                  </div>
                  {columns.map(column => (
                    <div key={column} className={s.cell} title={String(entry[column] || '')}>
                      {formatCellValue(entry[column], column)}
                    </div>
                  ))}
                </div>

                {/* Expanded Row */}
                {isExpanded && (
                  <div className={s.expandedRow}>
                    <RowDetails
                      entry={entry}
                      onClose={() => onRowExpand?.(entry)}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
});

function formatCellValue(value: any, column: string): string {
  if (value === null || value === undefined) {
    return '';
  }

  if (column === 'timestamp' && typeof value === 'string') {
    try {
      const date = new Date(value);
      return date.toLocaleString();
    } catch {
      return String(value);
    }
  }

  if (typeof value === 'object') {
    return JSON.stringify(value);
  }

  return String(value);
}

const getStyles = (theme: GrafanaTheme2) => ({
  container: css`
    display: flex;
    flex-direction: column;
    border: 1px solid ${theme.colors.border.weak};
    border-radius: ${theme.shape.radius.default};
    overflow: hidden;
  `,
  tableContainer: css`
    display: flex;
    flex-direction: column;
    height: 100%;
  `,
  header: css`
    background: ${theme.colors.background.secondary};
    border-bottom: 1px solid ${theme.colors.border.weak};
  `,
  headerRow: css`
    display: flex;
    padding: ${theme.spacing(1)};
  `,
  headerCell: css`
    flex: 1;
    font-weight: ${theme.typography.fontWeightMedium};
    font-size: ${theme.typography.size.sm};
    color: ${theme.colors.text.secondary};
    padding: 0 ${theme.spacing(1)};
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  `,
  body: css`
    flex: 1;
    overflow-y: auto;
  `,
  row: css`
    display: flex;
    padding: ${theme.spacing(1)};
    border-bottom: 1px solid ${theme.colors.border.weak};
    cursor: pointer;
    transition: background-color 0.1s ease;

    &:hover {
      background: ${theme.colors.background.secondary};
    }
  `,
  expandColumn: css`
    width: 40px;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
  `,
  cell: css`
    flex: 1;
    font-size: ${theme.typography.size.sm};
    padding: 0 ${theme.spacing(1)};
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  `,
  expandedRow: css`
    background: ${theme.colors.background.secondary};
    border-bottom: 1px solid ${theme.colors.border.weak};
  `,
  expandedContent: css`
    margin: ${theme.spacing(2)};
    padding: ${theme.spacing(2)};
    background: ${theme.colors.background.primary};
    border: 1px solid ${theme.colors.border.weak};
    border-radius: ${theme.shape.radius.default};
    font-size: ${theme.typography.size.sm};
    overflow-x: auto;
    white-space: pre-wrap;
    word-break: break-all;
  `,
});
