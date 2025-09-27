import React, { useEffect, useMemo, useRef, useState } from 'react';
import { MutableDataFrame, FieldType, type TimeRange, dateTime } from '@grafana/data';
import { TimeSeries, Spinner, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';
import type { HistogramBucket } from '../../types/discover';

interface TimeHistogramProps {
  buckets: HistogramBucket[];
  loading: boolean;
  timeRange: TimeRange;
  onBucketSelect: (range: TimeRange) => void;
}

const DEFAULT_HEIGHT = 220;

export const TimeHistogram: React.FC<TimeHistogramProps> = ({ buckets, loading, timeRange, onBucketSelect }) => {
  const styles = useStyles2(getStyles);
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(800);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) {
      return;
    }
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        setWidth(entry.contentRect.width);
      }
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const frame = useMemo(() => {
    const times = buckets.map((bucket) => dateTime(bucket.time).toDate());
    const counts = buckets.map((bucket) => bucket.count);
    return new MutableDataFrame({
      fields: [
        { name: 'time', type: FieldType.time, values: times },
        { name: 'count', type: FieldType.number, values: counts },
      ],
    });
  }, [buckets]);

  return (
    <div className={styles.wrapper} ref={containerRef} data-testid="discover-time-histogram">
      {loading && (
        <div className={styles.overlay}>
          <Spinner />
        </div>
      )}
      <TimeSeries
        height={DEFAULT_HEIGHT}
        width={width}
        frames={[frame]}
        timeRange={timeRange}
        timeZone="browser"
        legend={{ showLegend: false } as any}
        options={{
          custom: {
            drawStyle: 'bars',
            fillOpacity: 80,
          },
        }}
      />
      <div className={styles.hitTargets}>
        {buckets.map((bucket, index) => {
          const bucketWidth = buckets.length > 0 ? width / buckets.length : width;
          const from = dateTime(bucket.time);
          const to = buckets[index + 1]
            ? dateTime(buckets[index + 1].time)
            : dateTime(from.valueOf()).add(1, 'minute');
          return (
            <button
              type="button"
              key={bucket.time}
              className={styles.hitTarget}
              style={{ left: index * bucketWidth, width: bucketWidth }}
              onClick={() =>
                onBucketSelect({
                  from,
                  to,
                  raw: { from: from.toISOString(), to: to.toISOString() },
                })
              }
            >
              <span className="sr-only">Select bucket starting {new Date(bucket.time).toISOString()}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

const getStyles = () => ({
  wrapper: css`
    position: relative;
    min-height: ${DEFAULT_HEIGHT}px;
  `,
  overlay: css`
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(29, 34, 37, 0.35);
    z-index: 1;
  `,
  hitTargets: css`
    pointer-events: none;
    position: absolute;
    inset: 0;
  `,
  hitTarget: css`
    pointer-events: auto;
    position: absolute;
    top: 0;
    bottom: 0;
    background: transparent;
    border: none;
    cursor: pointer;
  `,
});
