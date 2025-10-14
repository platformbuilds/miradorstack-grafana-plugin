import { TenantContext, AuthorInfo, TaggedEntity, VersionedEntity } from './common';

/**
 * Trace Service related interfaces
 */
export interface TraceService extends TenantContext, AuthorInfo, TaggedEntity, VersionedEntity {
  service: string;
  purpose?: string;
  owner?: string;
}

export interface TraceOperation extends TraceService {
  operation: string;
}

/**
 * Metric related interfaces
 */
export interface Metric extends TenantContext, AuthorInfo, TaggedEntity, VersionedEntity {
  metric: string;
  description?: string;
  owner?: string;
}

/**
 * Log Field related interfaces
 */
export interface LogField extends TenantContext, AuthorInfo, TaggedEntity, VersionedEntity {
  field: string;
  type: string;
  description?: string;
  examples?: Record<string, unknown>;
}

/**
 * Label related interfaces
 */
export interface Label extends TenantContext, AuthorInfo {
  name: string;
  type: string;
  required?: boolean;
  allowedValues?: Record<string, unknown>;
  description?: string;
}

/**
 * Service Graph related interfaces
 */
export interface ServiceGraphLatency {
  avg_ms: number;
  p50_ms?: number;
  p90_ms?: number;
  p95_ms?: number;
  p99_ms?: number;
}

export interface ServiceGraphEdge {
  source: string;
  target: string;
  latency: ServiceGraphLatency;
  errorRate: number;
  requestRate: number;
}

export interface ServiceGraphWindow {
  start: number;
  end: number;
  edges: ServiceGraphEdge[];
}

export interface ServiceGraphTimeWindowResponse {
  status: string;
  windows: ServiceGraphWindow[];
}