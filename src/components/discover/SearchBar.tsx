import React from 'react';
import { css } from '@emotion/css';
import { GrafanaTheme2, TimeRange, dateTime } from '@grafana/data';
import { useStyles2, Input, Button, TimeRangePicker } from '@grafana/ui';
import { useLogsQuery, useLogsTimeRange, useLogsContext } from '../../contexts/LogsContext';

export function SearchBar() {
  const s = useStyles2(getStyles);
  const { query, setQuery } = useLogsQuery();
  const { timeRange, setTimeRange } = useLogsTimeRange();
  const { search } = useLogsContext();

  // Convert context timeRange to TimeRange format expected by TimeRangePicker
  const timeRangeValue: TimeRange = {
    from: dateTime(timeRange.from),
    to: dateTime(timeRange.to),
    raw: {
      from: dateTime(timeRange.from).toISOString(),
      to: dateTime(timeRange.to).toISOString(),
    },
  };

  const handleQueryChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = event.target.value;
    setQuery(newQuery);
  };

  const handleTimeRangeChange = (newTimeRange: TimeRange) => {
    setTimeRange(newTimeRange.from.valueOf(), newTimeRange.to.valueOf());
  };

  const handleSearch = () => {
    // Trigger search with current query and time range
    console.log('Search triggered:', { query, timeRange });
    search();
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
            value={timeRangeValue}
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
