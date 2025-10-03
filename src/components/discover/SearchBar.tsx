import React, { useState } from 'react';
import { css } from '@emotion/css';
import { GrafanaTheme2 } from '@grafana/data';
import { useStyles2, Input, Button, TimeRangePicker } from '@grafana/ui';
import { useTimeRange } from '../../hooks/useTimeRange';

interface SearchBarProps {
  onQueryChange?: (query: string) => void;
  onTimeRangeChange?: (timeRange: any) => void;
}

export function SearchBar({ onQueryChange, onTimeRangeChange }: SearchBarProps) {
  const s = useStyles2(getStyles);
  const [query, setQuery] = useState('');
  const { timeRange, setTimeRange } = useTimeRange();

  const handleQueryChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = event.target.value;
    setQuery(newQuery);
    onQueryChange?.(newQuery);
  };

  const handleTimeRangeChange = (newTimeRange: any) => {
    setTimeRange(newTimeRange);
    onTimeRangeChange?.(newTimeRange);
  };

  const handleSearch = () => {
    // Trigger search with current query and time range
    console.log('Search triggered:', { query, timeRange });
  };

  return (
    <div className={s.container}>
      <div className={s.searchRow}>
        <div className={s.queryInput}>
          <Input
            placeholder="Enter your search query..."
            value={query}
            onChange={handleQueryChange}
            prefix={<span>🔍</span>}
            width={60}
          />
        </div>
        <div className={s.timePicker}>
          <TimeRangePicker
            value={timeRange}
            onChange={handleTimeRangeChange}
            onChangeTimeZone={() => {}}
            onMoveBackward={() => {}}
            onMoveForward={() => {}}
            onZoom={() => {}}
          />
        </div>
        <div className={s.searchButton}>
          <Button variant="primary" onClick={handleSearch}>
            Search
          </Button>
        </div>
      </div>
    </div>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  container: css`
    width: 100%;
  `,
  searchRow: css`
    display: flex;
    align-items: center;
    gap: ${theme.spacing(2)};
    flex-wrap: wrap;
  `,
  queryInput: css`
    flex: 1;
    min-width: 300px;
  `,
  timePicker: css`
    flex-shrink: 0;
  `,
  searchButton: css`
    flex-shrink: 0;
  `,
});
