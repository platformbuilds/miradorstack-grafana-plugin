import React, { useEffect, useMemo, useState } from 'react';
import { Button, HorizontalGroup, Icon, InlineField, Input, TimeRangePicker, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';
import type { TimeRange } from '@grafana/data';

interface SearchBarProps {
  query: string;
  limit: number;
  timeRange: TimeRange;
  onQueryChange: (next: string) => void;
  onTimeRangeChange: (range: TimeRange) => void;
  onLimitChange: (limit: number) => void;
  onRunQuery: () => void;
}

const DEBOUNCE_MS = 300;

export const SearchBar: React.FC<SearchBarProps> = ({
  query,
  limit,
  timeRange,
  onQueryChange,
  onTimeRangeChange,
  onLimitChange,
  onRunQuery,
}) => {
  const styles = useStyles2(getStyles);
  const [draftQuery, setDraftQuery] = useState(query);
  const [draftLimit, setDraftLimit] = useState(String(limit));

  useEffect(() => {
    setDraftQuery(query);
  }, [query]);

  useEffect(() => {
    setDraftLimit(String(limit));
  }, [limit]);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      if (draftQuery !== query) {
        onQueryChange(draftQuery);
      }
    }, DEBOUNCE_MS);
    return () => window.clearTimeout(handle);
  }, [draftQuery, query, onQueryChange]);

  const parsedLimit = useMemo(() => {
    const numeric = Number(draftLimit);
    return Number.isFinite(numeric) && numeric > 0 ? numeric : limit;
  }, [draftLimit, limit]);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      if (parsedLimit !== limit) {
        onLimitChange(parsedLimit);
      }
    }, DEBOUNCE_MS);
    return () => window.clearTimeout(handle);
  }, [parsedLimit, limit, onLimitChange]);

  const noop = () => {};

  return (
    <div className={styles.wrapper} data-testid="discover-search-bar">
      <HorizontalGroup justify="space-between" align="flex-end">
        <InlineField label="Search" labelWidth={10} grow tooltip="Enter a Lucene query or keywords">
          <Input
            placeholder="service:payments AND level:ERROR"
            value={draftQuery}
            onChange={(event) => setDraftQuery(event.currentTarget.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                onRunQuery();
              }
            }}
          />
        </InlineField>
        <InlineField label="Limit" labelWidth={8} tooltip="Maximum documents to fetch">
          <Input
            type="number"
            min={1}
            value={draftLimit}
            onChange={(event) => setDraftLimit(event.currentTarget.value)}
            width={16}
          />
        </InlineField>
        <Button icon="search" onClick={onRunQuery} variant="primary">
          Run query
        </Button>
      </HorizontalGroup>
      <div className={styles.pickerRow}>
        <InlineField label="Time range" labelWidth={10} grow tooltip="Restrict documents by time">
          <TimeRangePicker
            value={timeRange}
            onChange={onTimeRangeChange}
            onChangeTimeZone={noop}
            onMoveBackward={noop}
            onMoveForward={noop}
            onZoom={noop}
            hideQuickRanges={false}
          />
        </InlineField>
        <div className={styles.hint}>
          <Icon name="info-circle" />
          <span>Type to filter automatically; press Enter or Run query to fetch new results.</span>
        </div>
      </div>
    </div>
  );
};

const getStyles = () => ({
  wrapper: css`
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  `,
  pickerRow: css`
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
    align-items: center;
  `,
  hint: css`
    display: inline-flex;
    gap: 0.4rem;
    font-size: 12px;
    color: var(--grafana-text-secondary);
    align-items: center;
  `,
});
