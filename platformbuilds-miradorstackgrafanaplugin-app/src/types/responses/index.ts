/**
 * Base response interface for all API responses
 */
export interface BaseResponse {
  status: string;
  error?: string;
}

/**
 * Log Response interfaces
 */
export interface LogEntry {
  timestamp: string;
  [key: string]: any;
}

export interface LogsQueryResponse extends BaseResponse {
  hits: LogEntry[];
  total: number;
  scrollId?: string;
}

export interface LogsHistogramResponse extends BaseResponse {
  buckets: {
    timestamp: string;
    count: number;
  }[];
}

export interface LogsFacetResponse extends BaseResponse {
  facets: {
    [field: string]: {
      value: any;
      count: number;
    }[];
  };
}

/**
 * Metrics Response interfaces
 */
export interface MetricDataPoint {
  timestamp: number;
  value: number;
}

export interface MetricSeries {
  name: string;
  labels: Record<string, string>;
  points: MetricDataPoint[];
}

export interface MetricsQueryResponse extends BaseResponse {
  series: MetricSeries[];
}

/**
 * Traces Response interfaces
 */
export interface Span {
  id: string;
  traceId: string;
  parentId?: string;
  name: string;
  service: string;
  operation: string;
  startTime: number;
  duration: number;
  tags: Record<string, string>;
}

export interface Trace {
  traceId: string;
  spans: Span[];
  startTime: number;
  duration: number;
  services: string[];
  operations: string[];
}

export interface TracesQueryResponse extends BaseResponse {
  traces: Trace[];
  total: number;
}

/**
 * Schema Response interfaces
 */
export interface SchemaVersionResponse extends BaseResponse {
  versions: {
    version: string;
    timestamp: string;
    author: string;
  }[];
}

export interface SchemaResponse extends BaseResponse {
  items: any[];
}

/**
 * Service Graph Response interfaces
 */
export interface ServiceNode {
  id: string;
  name: string;
  type: string;
  metadata?: Record<string, any>;
}

export interface ServiceEdge {
  source: string;
  target: string;
  metadata?: {
    requestRate?: number;
    errorRate?: number;
    latency?: {
      p50?: number;
      p90?: number;
      p99?: number;
    };
    [key: string]: any;
  };
}

export interface ServiceGraphResponse extends BaseResponse {
  nodes: ServiceNode[];
  edges: ServiceEdge[];
  timestamp: string;
}

/**
 * Health Response interfaces
 */
export interface HealthResponse extends BaseResponse {
  version: string;
  uptime: number;
  timestamp: string;
}

export interface ReadinessResponse extends BaseResponse {
  ready: boolean;
  details: {
    [component: string]: {
      status: string;
      message?: string;
    };
  };
}