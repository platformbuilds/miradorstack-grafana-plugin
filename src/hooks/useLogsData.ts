import { useState, useEffect, useCallback } from 'react';
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

// Sample data for demonstration - will be replaced with real API calls
const sampleLogData: LogEntry[] = [
  {
    timestamp: '2025-01-15T10:30:00Z',
    level: 'INFO',
    message: 'User login successful',
    source: 'auth-service',
    userId: 'user123',
    ip: '192.168.1.100',
    sessionId: 'sess_abc123'
  },
  {
    timestamp: '2025-01-15T10:31:15Z',
    level: 'ERROR',
    message: 'Database connection failed',
    source: 'user-service',
    error: 'Connection timeout',
    database: 'users',
    retryCount: 3
  },
  {
    timestamp: '2025-01-15T10:32:30Z',
    level: 'WARN',
    message: 'High memory usage detected',
    source: 'monitoring',
    memoryUsage: 85,
    threshold: 80,
    service: 'api-gateway'
  },
  {
    timestamp: '2025-01-15T10:33:45Z',
    level: 'INFO',
    message: 'Payment processed successfully',
    source: 'payment-service',
    amount: 99.99,
    currency: 'USD',
    transactionId: 'txn_123456'
  },
  {
    timestamp: '2025-01-15T10:35:00Z',
    level: 'DEBUG',
    message: 'Cache miss for key: user_profile_123',
    source: 'cache-service',
    key: 'user_profile_123',
    operation: 'get'
  }
];

export function useLogsData(initialParams: LogsQueryParams): UseLogsDataResult {
  const [logs, setLogs] = useState<LogEntry[]>(sampleLogData);
  const [histogram, setHistogram] = useState<HistogramDataPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(sampleLogData.length);
  const [currentParams, setCurrentParams] = useState<LogsQueryParams>(initialParams);

  const fetchLogs = useCallback(async (params: LogsQueryParams) => {
    setLoading(true);
    setError(null);

    try {
      // TODO: Replace with real API call when data source integration is complete
      // For now, simulate API delay and return sample data
      await new Promise(resolve => setTimeout(resolve, 500));

      // Filter sample data based on query (simple text matching)
      let filteredLogs = sampleLogData;
      if (params.query && params.query.trim()) {
        const query = params.query.toLowerCase();
        filteredLogs = sampleLogData.filter(log =>
          log.message.toLowerCase().includes(query) ||
          log.level?.toLowerCase().includes(query) ||
          log.source?.toLowerCase().includes(query) ||
          Object.values(log).some(value =>
            typeof value === 'string' && value.toLowerCase().includes(query)
          )
        );
      }

      // Apply time range filtering
      filteredLogs = filteredLogs.filter(log => {
        const logTime = new Date(log.timestamp).getTime();
        return logTime >= params.start && logTime <= params.end;
      });

      // Apply limit
      if (params.limit) {
        filteredLogs = filteredLogs.slice(0, params.limit);
      }

      setLogs(filteredLogs);
      setTotalCount(filteredLogs.length);

      // Generate histogram data from filtered logs
      const histogramData = generateHistogramFromLogs(filteredLogs, params.start, params.end);
      setHistogram(histogramData);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch logs';
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
