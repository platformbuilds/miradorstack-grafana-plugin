import {
  LogsQuery,
  LogsStreamQuery,
  MetricsQuery,
  TracesQuery,
  TracesByIdQuery,
  SchemaQuery,
  BulkSchemaRequest,
  ServiceGraphRequest
} from '../requests';

import {
  LogsQueryResponse,
  LogsHistogramResponse,
  LogsFacetResponse,
  MetricsQueryResponse,
  TracesQueryResponse,
  SchemaResponse,
  SchemaVersionResponse,
  HealthResponse,
  ReadinessResponse,
  ServiceGraphResponse
} from '../responses';

/**
 * Mirador Core API Client Interface
 */
export interface MiradorAPIClient {
  // Health & Status
  getHealth(): Promise<HealthResponse>;
  getReadiness(): Promise<ReadinessResponse>;

  // Logs
  queryLogs(query: LogsQuery): Promise<LogsQueryResponse>;
  streamLogs(query: LogsStreamQuery): Promise<void>;
  getLogsHistogram(query: LogsQuery): Promise<LogsHistogramResponse>;
  getLogsFacets(query: LogsQuery): Promise<LogsFacetResponse>;

  // Metrics
  queryMetrics(query: MetricsQuery): Promise<MetricsQueryResponse>;
  getMetricNames(): Promise<string[]>;
  getMetricLabels(metric: string): Promise<Record<string, string[]>>;

  // Traces
  queryTraces(query: TracesQuery): Promise<TracesQueryResponse>;
  getTraceById(query: TracesByIdQuery): Promise<TracesQueryResponse>;
  getTraceServices(): Promise<string[]>;
  getTraceOperations(service: string): Promise<string[]>;

  // Schema Management
  getSchemaVersions(type: string, name: string): Promise<SchemaVersionResponse>;
  createSchema(type: string, schema: any): Promise<SchemaResponse>;
  updateSchema(type: string, name: string, schema: any): Promise<SchemaResponse>;
  deleteSchema(type: string, name: string): Promise<void>;
  bulkCreateSchema(type: string, request: BulkSchemaRequest): Promise<SchemaResponse>;

  // Service Graph
  getServiceGraph(request: ServiceGraphRequest): Promise<ServiceGraphResponse>;
}