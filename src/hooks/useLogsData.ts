import { useState, useEffect, useCallback } from 'react';
import { getDataSourceSrv } from '@grafana/runtime';
import { dateTime } from '@grafana/data';
import { LogEntry } from '../components/discover/DocumentTable';
import { HistogramDataPoint } from '../components/discover/TimeHistogram';

export interface LogsQueryParams {
  query: string;
  start: number;
  end: number;
  limit?: number;
  queryLanguage?: 'lucene' | 'logsql';
}

export interface UseLogsDataResult {
  logs: LogEntry[];
  histogram: HistogramDataPoint[];
  loading: boolean;
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
  const [currentParams, setCurrentParams] = useState<LogsQueryParams>(initialParams);

  const fetchLogs = useCallback(async (params: LogsQueryParams) => {
    setLoading(true);
    setError(null); // Clear previous errors at the start of a new fetch

    try {
      
      // Get the Mirador data source
      const dataSourceSrv = getDataSourceSrv();
      const dataSource = await dataSourceSrv.get('Mirador Core Connector');

      if (!dataSource) {
        throw new Error('Mirador Core Connector data source not found. Please configure the data source in Grafana.');
      }

      // Create a query for logs
      const query = {
        queryType: 'logs',
        query: params.query || '',
        queryLanguage: params.queryLanguage || 'lucene',
        start: params.start,
        end: params.end,
        limit: params.limit || 1000,
        refId: 'logs-query',
      };

      // Execute the query
      const queryResult = dataSource.query({
        targets: [query],
        range: {
          from: dateTime(params.start),
          to: dateTime(params.end),
          raw: {
            from: dateTime(params.start),
            to: dateTime(params.end),
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
          // It's an Observable
          queryResult.subscribe({
            next: (result: any) => resolve(result),
            error: (err: any) => reject(err),
          });
        }
      });

      if (!response || !response.data) {
        console.log('No data in response');
        setLogs([]);
        setHistogram([]);
        setTotalCount(0);
        return;
      }

      console.log('Response data:', JSON.stringify(response.data).substring(0, 200) + '...');

      // Process the response data
      const logsData: LogEntry[] = [];
      let totalCount = 0;
      
      console.log('Processing response:', response);
      
      // Handle different response formats
      if (Array.isArray(response.data)) {
        // Process each frame in the array
        response.data.forEach((frame: any) => {
          // Check if the frame has a direct logs property (from our custom processing)
          if (frame.logs && Array.isArray(frame.logs)) {
            console.log(`Found direct logs array with ${frame.logs.length} entries`);
            logsData.push(...frame.logs as LogEntry[]);
            totalCount += frame.logs.length;
          }
          // Traditional Grafana DataFrame format with fields
          else if (frame.fields && frame.fields.length > 0) {
            console.log('Processing traditional DataFrame format');
            const rows = frame.length || 0;
            
            for (let i = 0; i < rows; i++) {
              const logEntry: any = {};
              frame.fields.forEach((field: any, fieldIndex: number) => {
                logEntry[field.name] = field.values[i];
              });
              logsData.push(logEntry as LogEntry);
            }
            
            totalCount += rows;
          }
        });
      } 
      // Direct API response without DataFrame wrapping
      else if (response.data && response.data.logs && Array.isArray(response.data.logs)) {
        console.log(`Processing direct API response with ${response.data.logs.length} logs`);
        logsData.push(...response.data.logs as LogEntry[]);
        totalCount = response.data.logs.length;
      }

      setLogs(logsData);
      setTotalCount(totalCount);

      // Generate histogram data from the logs
      const histogramData = generateHistogramFromLogs(logsData, params.start, params.end);
      setHistogram(histogramData);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch logs from Mirador API';
      setError(errorMessage);
      setLogs([]);
      setHistogram([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, []);

  const refetch = useCallback((params?: Partial<LogsQueryParams>) => {
    const newParams = { ...currentParams, ...params };
    setCurrentParams(newParams);
    fetchLogs(newParams);
  }, [currentParams, fetchLogs]);

  // Initial fetch
  useEffect(() => {
    fetchLogs(currentParams);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  return {
    logs,
    histogram,
    loading,
    error,
    refetch,
    totalCount,
  };
}

function generateHistogramFromLogs(logs: LogEntry[], start: number, end: number): HistogramDataPoint[] {
  if (logs.length === 0) {
    return [];
  }

  // Create time buckets (5-minute intervals)
  const bucketSize = 5 * 60 * 1000; // 5 minutes in milliseconds
  const buckets: { [key: number]: number } = {};

  logs.forEach(log => {
    let timestamp: number;
    if (typeof log.timestamp === 'string') {
      timestamp = new Date(log.timestamp).getTime();
    } else if (typeof log.timestamp === 'number') {
      timestamp = log.timestamp;
    } else {
      return; // Skip invalid timestamps
    }

    const bucket = Math.floor(timestamp / bucketSize) * bucketSize;
    buckets[bucket] = (buckets[bucket] || 0) + 1;
  });

  // Convert to histogram data points
  return Object.entries(buckets)
    .map(([time, count]) => ({
      time: parseInt(time, 10),
      count,
    }))
    .sort((a, b) => a.time - b.time);
}
