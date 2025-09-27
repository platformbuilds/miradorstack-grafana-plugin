import { dateTime, type TimeRange } from '@grafana/data';
import { useEffect, useMemo, useState } from 'react';
import type { HistogramBucket, LogDocument } from '../types/discover';

interface HistogramOptions {
  bucketMinutes?: number;
}

interface UseHistogramResult {
  data: HistogramBucket[];
  loading: boolean;
  setTimeRange: (next: TimeRange) => void;
}

export function useHistogramQuery(documents: LogDocument[], initialRange: TimeRange, options: HistogramOptions = {}): UseHistogramResult {
  const [timeRange, setTimeRange] = useState<TimeRange>(initialRange);
  const [loading, setLoading] = useState(false);
  const bucketMinutes = options.bucketMinutes ?? 1;

  useEffect(() => {
    setTimeRange(initialRange);
  }, [initialRange]);

  const data = useMemo(() => {
    if (!documents.length) {
      return [];
    }
    const buckets = new Map<string, number>();
    const fromMs = timeRange.from.valueOf();
    const toMs = timeRange.to.valueOf();
    const bucketMs = bucketMinutes * 60_000;

    for (const doc of documents) {
      const ts = dateTime(doc.timestamp);
      if (!ts.isValid()) {
        continue;
      }
      const timestamp = ts.valueOf();
      if (timestamp < fromMs || timestamp > toMs) {
        continue;
      }
      const bucketKey = Math.floor(timestamp / bucketMs) * bucketMs;
      const rounded = dateTime(bucketKey).toISOString();
      buckets.set(rounded, (buckets.get(rounded) ?? 0) + 1);
    }

    return Array.from(buckets.entries())
      .map(([time, count]) => ({ time, count }))
      .sort((a, b) => dateTime(a.time).valueOf() - dateTime(b.time).valueOf());
  }, [documents, timeRange, bucketMinutes]);

  useEffect(() => {
    setLoading(true);
    const timeout = setTimeout(() => setLoading(false), 120);
    return () => clearTimeout(timeout);
  }, [documents, timeRange]);

  return { data, loading, setTimeRange };
}
