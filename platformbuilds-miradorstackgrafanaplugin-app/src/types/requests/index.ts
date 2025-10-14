import { TimeRange } from '../models/common';

/**
 * Base query interface for all data queries
 */
export interface BaseQuery {
  tenantId?: string;
  timeRange?: TimeRange;
  maxDataPoints?: number;
}

/**
 * Log Query interfaces
 */
export interface LogsQuery extends BaseQuery {
  query: string;
  queryLanguage?: 'lucene' | 'bleve';
  limit?: number;
  fields?: string[];
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
}

export interface LogsStreamQuery extends BaseQuery {
  query: string;
  tailMode?: boolean;
  maxLines?: number;
}

/**
 * Metrics Query interfaces
 */
export interface MetricsQuery extends BaseQuery {
  query: string;
  step?: number;
}

export interface MetricsQLFunctionRequest {
  query: string;
  start?: number;
  end?: number;
  step?: number;
}

/**
 * Traces Query interfaces
 */
export interface TracesQuery extends BaseQuery {
  service?: string;
  operation?: string;
  tags?: Record<string, string>;
  minDuration?: string;
  maxDuration?: string;
  limit?: number;
}

export interface TracesByIdQuery extends BaseQuery {
  traceId: string;
}

/**
 * Schema Management interfaces
 */
export interface SchemaQuery extends BaseQuery {
  name?: string;
  type?: string;
  version?: string;
}

export interface BulkSchemaRequest {
  items: any[];
  dryRun?: boolean;
}

/**
 * Service Graph Request
 */
export interface ServiceGraphRequest {
  start: number;
  end: number;
  step?: number;
  services?: string[];
  aggregation?: 'avg' | 'p50' | 'p90' | 'p95' | 'p99';
}