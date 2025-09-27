import type { TimeRange } from '@grafana/data';

export interface LogDocument {
  id: string;
  timestamp: string;
  message: string;
  level: string;
  service: string;
  tenant?: string;
  traceId?: string;
  spanId?: string;
  attributes: Record<string, unknown>;
}

export interface DiscoverQueryState {
  query: string;
  timeRange: TimeRange;
  limit: number;
}

export interface FieldStat {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'date';
  count: number;
  examples: Array<string | number | boolean>;
  excluded?: boolean;
}

export interface HistogramBucket {
  time: string;
  count: number;
}

export type FilterComparator = 'is' | 'is_not' | 'contains' | 'exists' | 'range';

export interface DiscoverFilter {
  id: string;
  field: string;
  comparator: FilterComparator;
  value?: string | number | Array<string | number>;
}

export interface SavedFilterGroup {
  id: string;
  name: string;
  description?: string;
  filters: DiscoverFilter[];
  createdAt: string;
}

export interface HistogramState {
  buckets: HistogramBucket[];
  loading: boolean;
}
