// src/datasource/types.ts
import { DataQuery, DataSourceJsonData } from '@grafana/data';

export interface MiradorQuery extends DataQuery {
  queryType: QueryType;
  query: string;
  queryLanguage?: 'lucene' | 'promql';
  limit?: number;
  step?: string;
  fields?: string[];
}

export enum QueryType {
  Logs = 'logs',
  Metrics = 'metrics',
  Traces = 'traces',
}

export interface MiradorDataSourceOptions extends DataSourceJsonData {
  bearerToken: string;
  tenantId?: string;
  enableWebSocket?: boolean;
}

export interface MiradorSecureJsonData {
  bearerToken?: string;
}

// API Response Types
export interface LogsResponse {
  results: LogEntry[];
  total: number;
  took: number;
}

export interface LogEntry {
  _time: string;
  level?: string;
  service?: string;
  message?: string;
  _msg?: string;
  [key: string]: any;
}

export interface MetricsResponse {
  status: string;
  data: {
    resultType: string;
    result: MetricResult[];
  };
}

export interface MetricResult {
  metric: Record<string, string>;
  value?: [number, string];
  values?: Array<[number, string]>;
}

export interface TracesResponse {
  data: TraceData[];
}

export interface TraceData {
  traceID: string;
  spans: SpanData[];
  processes: Record<string, ProcessInfo>;
}

export interface SpanData {
  traceID: string;
  spanID: string;
  operationName: string;
  startTime: number;
  duration: number;
  tags: TagData[];
  process: ProcessInfo;
  references?: Reference[];
}

export interface TagData {
  key: string;
  type: string;
  value: string;
}

export interface ProcessInfo {
  serviceName: string;
  tags: TagData[];
}

export interface Reference {
  refType: string;
  traceID: string;
  spanID: string;
}

export interface HistogramResponse {
  values: Array<{
    timestamp: number;
    count: number;
  }>;
}

export interface FacetsResponse {
  facets: Record<string, FacetValue[]>;
}

export interface FacetValue {
  value: string;
  count: number;
}

// Schema Types
export interface SchemaMetric {
  tenantId?: string;
  metric: string;
  description?: string;
  owner?: string;
  tags?: string[];
  author?: string;
  labels?: SchemaLabel[];
}

export interface SchemaLogField {
  tenantId?: string;
  field: string;
  type?: string;
  description?: string;
  tags?: string[];
  examples?: Record<string, any>;
  author?: string;
}

export interface SchemaTraceService {
  tenantId?: string;
  service: string;
  purpose?: string;
  owner?: string;
  tags?: string[];
  author?: string;
  operations?: SchemaTraceOperation[];
}

export interface SchemaTraceOperation {
  tenantId?: string;
  service: string;
  operation: string;
  purpose?: string;
  owner?: string;
  tags?: string[];
  author?: string;
}

export interface SchemaLabel {
  name: string;
  type: string;
  required: boolean;
  allowedValues: Record<string, any>;
  description: string;
  author: string;
}

// Lucene Query Builder Types
export interface LuceneQueryField {
  name: string;
  type: 'string' | 'number' | 'date' | 'boolean';
  description?: string;
  examples?: string[];
}

export interface LuceneQueryClause {
  field?: string;
  operator: 'AND' | 'OR' | 'NOT';
  value: string;
  quoted?: boolean;
  wildcard?: boolean;
  range?: {
    from?: string;
    to?: string;
    inclusive?: boolean;
  };
}

export interface LuceneQuery {
  clauses: LuceneQueryClause[];
  timeRange?: {
    field: string;
    from: string;
    to: string;
  };
  sort?: {
    field: string;
    direction: 'asc' | 'desc';
  };
}

// UI State Types
export interface DiscoverState {
  selectedFields: string[];
  availableFields: string[];
  query: string;
  timeRange: {
    from: string;
    to: string;
  };
  filters: FilterState[];
  sortField: string;
  sortDirection: 'asc' | 'desc';
  pageSize: number;
  currentPage: number;
  viewMode: 'table' | 'json' | 'raw';
  autoRefresh: boolean;
  refreshInterval: number;
}

export interface FilterState {
  field: string;
  operator: 'is' | 'is not' | 'exists' | 'does not exist' | 'contains' | 'starts with' | 'ends with' | 'range';
  value?: string | string[];
  enabled: boolean;
}

// Field Statistics Types
export interface FieldStats {
  name: string;
  type: string;
  count: number;
  percentage: number;
  topValues?: Array<{
    value: string;
    count: number;
    percentage: number;
  }>;
  min?: number;
  max?: number;
  avg?: number;
  unique?: number;
}
