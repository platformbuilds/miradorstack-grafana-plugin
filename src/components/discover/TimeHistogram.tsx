import React, { useMemo } from 'react';
import { css } from '@emotion/css';
import { GrafanaTheme2 } from '@grafana/data';
import { useStyles2 } from '@grafana/ui';

export interface HistogramDataPoint {
  time: number;
  count: number;
}

interface TimeHistogramProps {
  data: HistogramDataPoint[];
  onBarClick?: (timeRange: { from: number; to: number }) => void;
  height?: number;
  timeRange?: { from: number; to: number };
}

export function TimeHistogram({
  data,
  onBarClick,
  height = 120,
  timeRange
}: TimeHistogramProps) {
  const s = useStyles2(getStyles);

  const { bars, maxCount, timeRange: dataTimeRange } = useMemo(() => {
    if (data.length === 0) {
      return { bars: [], maxCount: 0, timeRange: { from: 0, to: 0 } };
    }

    const sortedData = [...data].sort((a, b) => a.time - b.time);
    const minTime = sortedData[0].time;
    const maxTime = sortedData[sortedData.length - 1].time;
    const maxCount = Math.max(...sortedData.map(d => d.count));

    // Create histogram bars (simplified - in real implementation would use proper binning)
    const bars = sortedData.map(point => ({
      ...point,
      height: maxCount > 0 ? (point.count / maxCount) * 100 : 0,
    }));

    return {
      bars,
      maxCount,
      timeRange: { from: minTime, to: maxTime }
    };
  }, [data]);

  const handleBarClick = (bar: HistogramDataPoint & { height: number }) => {
    if (onBarClick) {
      // Create a time range around this bar (e.g., ±30 minutes)
      const halfHour = 30 * 60 * 1000; // 30 minutes in milliseconds
      onBarClick({
        from: bar.time - halfHour,
        to: bar.time + halfHour,
      });
    }
  };

  if (data.length === 0) {
    return (
      <div className={s.container} style={{ height }}>
        <div className={s.emptyState}>
          No histogram data available
        </div>
      </div>
    );
  }

  return (
    <div className={s.container} style={{ height }}>
      <div className={s.header}>
        <span className={s.title}>Log Distribution Over Time</span>
        <span className={s.stats}>
          {bars.length} intervals, max {maxCount} logs
        </span>
      </div>

      <div className={s.chartContainer}>
        <div className={s.chart}>
          {bars.map((bar, index) => (
            <div
              key={index}
              className={s.bar}
              style={{
                height: `${bar.height}%`,
                backgroundColor: getBarColor(bar.count, maxCount),
              }}
              onClick={() => handleBarClick(bar)}
              title={`${new Date(bar.time).toLocaleString()}: ${bar.count} logs`}
            />
          ))}
        </div>

        <div className={s.xAxis}>
          <div className={s.timeLabel}>
            {new Date(dataTimeRange.from).toLocaleTimeString()}
          </div>
          <div className={s.timeLabel}>
            {new Date(dataTimeRange.to).toLocaleTimeString()}
          </div>
        </div>
      </div>
    </div>
  );
}

function getBarColor(count: number, maxCount: number): string {
  if (maxCount === 0) {
    return '#cccccc';
  }

  const ratio = count / maxCount;

  if (ratio >= 0.8) {
    return '#ff6b6b'; // High - red
  }
  if (ratio >= 0.6) {
    return '#ffa726'; // Medium-high - orange
  }
  if (ratio >= 0.4) {
    return '#42a5f5'; // Medium - blue
  }
  if (ratio >= 0.2) {
    return '#66bb6a'; // Low-medium - green
  }
  return '#cccccc'; // Low - gray
}

const getStyles = (theme: GrafanaTheme2) => ({
  container: css`
    display: flex;
    flex-direction: column;
    border: 1px solid ${theme.colors.border.weak};
    border-radius: ${theme.shape.radius.default};
    background: ${theme.colors.background.primary};
  `,
  header: css`
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: ${theme.spacing(1)} ${theme.spacing(2)};
    border-bottom: 1px solid ${theme.colors.border.weak};
    background: ${theme.colors.background.secondary};
  `,
  title: css`
    font-size: ${theme.typography.size.sm};
    font-weight: ${theme.typography.fontWeightMedium};
    color: ${theme.colors.text.primary};
  `,
  stats: css`
    font-size: ${theme.typography.size.xs};
    color: ${theme.colors.text.secondary};
  `,
  chartContainer: css`
    flex: 1;
    display: flex;
    flex-direction: column;
    padding: ${theme.spacing(1)} ${theme.spacing(2)};
  `,
  chart: css`
    flex: 1;
    display: flex;
    align-items: end;
    gap: 1px;
    padding-bottom: ${theme.spacing(1)};
  `,
  bar: css`
    flex: 1;
    min-width: 2px;
    cursor: pointer;
    transition: opacity 0.2s ease;
    border-radius: 1px 1px 0 0;

    &:hover {
      opacity: 0.8;
    }
  `,
  xAxis: css`
    display: flex;
    justify-content: space-between;
    padding-top: ${theme.spacing(0.5)};
  `,
  timeLabel: css`
    font-size: ${theme.typography.size.xs};
    color: ${theme.colors.text.secondary};
  `,
  emptyState: css`
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    color: ${theme.colors.text.secondary};
    font-size: ${theme.typography.size.sm};
  `,
});
