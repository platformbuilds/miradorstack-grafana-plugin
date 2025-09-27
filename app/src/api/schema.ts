import { getBackendSrv } from '@grafana/runtime';
import { lastValueFrom } from 'rxjs';

import type {
  LogsSchema,
  MetricsSchema,
  SchemaField,
  MetricDescriptor,
  TraceServiceSchema,
  TracesSchema,
} from '../types/schema';

const buildResourceUrl = (datasourceUid: string, path: string) =>
  `/api/datasources/uid/${datasourceUid}/resources/${path}`;

export class SchemaApiError extends Error {
  constructor(message: string, public readonly status?: number) {
    super(message);
    this.name = 'SchemaApiError';
  }
}

export class SchemaApi {
  constructor(private readonly datasourceUid: string) {
    if (!datasourceUid) {
      throw new Error('SchemaApi requires a datasource UID');
    }
  }

  listLogFields() {
    return this.request<LogsSchema>('schema/logs', 'GET');
  }

  getLogField(field: string) {
    const encoded = encodeURIComponent(field.trim());
    return this.request<SchemaField>(`schema/logs/${encoded}`, 'GET');
  }

  saveLogField(field: SchemaField) {
    return this.request<SchemaField>('schema/logs', 'POST', field);
  }

  listMetrics() {
    return this.request<MetricsSchema>('schema/metrics', 'GET');
  }

  getMetric(metric: string) {
    const encoded = encodeURIComponent(metric.trim());
    return this.request<MetricDescriptor>(`schema/metrics/${encoded}`, 'GET');
  }

  saveMetric(metric: MetricDescriptor) {
    return this.request<MetricDescriptor>('schema/metrics', 'POST', metric);
  }

  listTraceServices() {
    return this.request<TracesSchema>('schema/traces', 'GET');
  }

  getTraceService(service: string) {
    const encoded = encodeURIComponent(service.trim());
    return this.request<TraceServiceSchema>(`schema/traces/${encoded}`, 'GET');
  }

  saveTraceService(service: TraceServiceSchema) {
    return this.request<TraceServiceSchema>('schema/traces', 'POST', service);
  }

  private async request<T>(path: string, method: string, body?: unknown): Promise<T> {
    try {
      const response = await lastValueFrom(
        getBackendSrv().fetch<T>({
          method,
          url: buildResourceUrl(this.datasourceUid, path),
          data: body,
        })
      );
      return response.data;
    } catch (error) {
      throw this.toError(error);
    }
  }

  private toError(error: unknown): SchemaApiError {
    if (error instanceof SchemaApiError) {
      return error;
    }

    if (typeof error === 'object' && error !== null) {
      const status = (error as { status?: number }).status;
      const data = (error as { data?: Record<string, unknown> }).data ?? {};
      const message =
        (typeof (data as { error?: unknown }).error === 'string' && (data as { error?: string }).error) ||
        (typeof (data as { message?: unknown }).message === 'string' && (data as { message?: string }).message) ||
        (typeof (error as { message?: unknown }).message === 'string' && (error as { message?: string }).message) ||
        'Schema request failed';

      return new SchemaApiError(message, status);
    }

    return new SchemaApiError('Schema request failed');
  }
}
