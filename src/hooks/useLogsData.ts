import { useState, useEffect, useCallback } from 'react';
// Helper to generate histogram data from logs
function generateHistogramFromLogs(logs: LogEntry[], start: number, end: number): HistogramDataPoint[] {
  const bucketSize = 5 * 60 * 1000; // 5 minutes
  const buckets: { [key: number]: number } = {};
  logs.forEach(log => {
    let timestamp: number;
    if (typeof log.timestamp === 'string') {
      timestamp = new Date(log.timestamp).getTime();
    } else if (typeof log.timestamp === 'number') {
      timestamp = log.timestamp;
    } else {
      return;
    }
    const bucket = Math.floor(timestamp / bucketSize) * bucketSize;
    buckets[bucket] = (buckets[bucket] || 0) + 1;
  });
  return Object.entries(buckets)
    .map(([time, count]) => ({ time: parseInt(time, 10), count }))
    .sort((a, b) => a.time - b.time);
}
import { getDataSourceSrv } from '@grafana/runtime';
import { dateTime } from '@grafana/data';

// Temporary local types to replace removed Discover types
type LogEntry = Record<string, any>;
type HistogramDataPoint = { time: number; count: number };

export interface LogsQueryParams {
  query: string;
  start: number;
  end: number;
  limit?: number;
  queryLanguage?: 'lucene' | 'logsql';
  cacheBuster?: number;
}

export interface UseLogsDataResult {
  logs: LogEntry[];
  histogram: HistogramDataPoint[];
  loading: boolean;
// Move this helper function above fetchLogs so it's available
  error: string | null;
  refetch: (params?: Partial<LogsQueryParams>) => void;
  totalCount: number;
}



export function useLogsData(initialParams: LogsQueryParams): UseLogsDataResult {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [histogram, setHistogram] = useState<HistogramDataPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [params, setParams] = useState<LogsQueryParams>({ ...initialParams, cacheBuster: Date.now() });

  const fetchLogs = useCallback(async (fetchParams: LogsQueryParams) => {
    try {
      setLoading(true);
      setError(null);
      setLogs([]);
      setHistogram([]);
      const dataSourceSrv = getDataSourceSrv();
      const dataSource = await dataSourceSrv.get('Mirador Core Connector');
      if (!dataSource) {
        throw new Error('Mirador Core Connector data source not found. Please configure the data source in Grafana.');
      }
      const query = {
        queryType: 'logs',
        query: fetchParams.query || '',
        queryLanguage: fetchParams.queryLanguage || 'lucene',
        start: fetchParams.start,
        end: fetchParams.end,
        limit: fetchParams.limit || 1000,
        refId: 'logs-query',
      };
      const queryResult = dataSource.query({
        targets: [query],
        range: {
          from: dateTime(fetchParams.start),
          to: dateTime(fetchParams.end),
          raw: {
            from: dateTime(fetchParams.start),
            to: dateTime(fetchParams.end),
          },
        },
        requestId: `logs-${Date.now()}`,
        interval: '1s',
        intervalMs: 1000,
        scopedVars: {},
        timezone: 'UTC',
        app: 'mirador-plugin',
        startTime: Date.now(),
      });
      const response = await new Promise<any>((resolve, reject) => {
        if (queryResult instanceof Promise) {
          queryResult.then(resolve).catch(reject);
        } else {
          queryResult.subscribe({
            next: (result: any) => resolve(result),
            error: (err: any) => reject(err),
          });
        }
      });
      if (!response || !response.data) {
        setLogs([]);
        setHistogram([]);
        setTotalCount(0);
        return;
      }
      // --- NEW: Extract logs from DataFrames returned by Grafana data source ---
      let logsData: LogEntry[] = [];
      let total = 0;
      if (Array.isArray(response.data)) {
        response.data.forEach((frame: any) => {
          if (frame.logs && Array.isArray(frame.logs)) {
            logsData.push(...frame.logs.map((log: any) => ({ ...log })));
            total += frame.logs.length;
          }
        });
      } else if (response.data?.logs && Array.isArray(response.data.logs)) {
        logsData = response.data.logs.map((log: any) => ({ ...log }));
        total = logsData.length;
      } else if (response.data?.data?.logs && Array.isArray(response.data.data.logs)) {
        logsData = response.data.data.logs.map((log: any) => ({ ...log }));
        total = logsData.length;
      }
      setLogs([...logsData]);
      setTotalCount(total);
      setHistogram(generateHistogramFromLogs(logsData, fetchParams.start, fetchParams.end));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch logs from Mirador API');
      setLogs([]);
      setHistogram([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch logs when params change
  useEffect(() => {
    fetchLogs(params);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  // Expose a refetch function
  const refetch = (newParams?: Partial<LogsQueryParams>) => {
    setParams(prev => ({
      ...prev,
      ...newParams,
      cacheBuster: Date.now(), // always change to force fetch
    }));
  };

  return {
    logs,
    histogram,
    loading,
    error,
    refetch,
    totalCount,
  };
}
