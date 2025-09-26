import type {
  FacetsResponse,
  HistogramResponse,
  LogsResponse,
  MetricsResponse,
  MiradorDataSourceOptions,
  QueryType,
  TracesResponse,
} from '../types';

export interface MiradorAPIClientConfig {
  baseUrl: string;
  bearerToken?: string;
  tenantId?: string;
  timeoutMs?: number;
}

export interface LogsQueryPayload {
  query: string;
  limit?: number;
  fields?: string[];
  timeRange?: {
    from: string;
    to: string;
  };
}

export interface MetricsQueryPayload {
  query: string;
  step?: string;
  start?: string;
  end?: string;
}

export interface TracesQueryPayload {
  query: string;
  limit?: number;
  start?: string;
  end?: string;
}

export interface HistogramPayload {
  query: string;
  interval: string;
  timeRange?: {
    from: string;
    to: string;
  };
}

const DEFAULT_TIMEOUT_MS = 30_000;

export class MiradorAPIError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'MiradorAPIError';
  }
}

export class MiradorAPIClient {
  private readonly config: MiradorAPIClientConfig;

  constructor(config: MiradorAPIClientConfig) {
    this.config = {
      baseUrl: config.baseUrl,
      bearerToken: config.bearerToken,
      tenantId: config.tenantId,
      timeoutMs: config.timeoutMs ?? DEFAULT_TIMEOUT_MS,
    };

    if (!this.config.baseUrl) {
      throw new Error('MiradorAPIClient requires a baseUrl');
    }
  }

  private buildHeaders(extra?: HeadersInit): HeadersInit {
    const headers: Record<string, string> = {};

    if (extra) {
      if (Array.isArray(extra)) {
        for (const [key, value] of extra) {
          headers[key] = value as string;
        }
      } else if (typeof Headers !== 'undefined' && extra instanceof Headers) {
        (extra as Headers).forEach((value, key) => {
          headers[key] = value;
        });
      } else {
        Object.assign(headers, extra as Record<string, string>);
      }
    }

    headers['Content-Type'] = headers['Content-Type'] ?? 'application/json';
    if (this.config.bearerToken) {
      headers['Authorization'] = `Bearer ${this.config.bearerToken}`;
    }
    if (this.config.tenantId) {
      headers['X-Mirador-Tenant'] = this.config.tenantId;
    }

    return headers;
  }

  private resolveUrl(path: string): string {
    return new URL(path, this.config.baseUrl).toString();
  }

  private async request<T>(path: string, init?: RequestInit): Promise<T> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.config.timeoutMs ?? DEFAULT_TIMEOUT_MS);

    try {
      const response = await fetch(this.resolveUrl(path), {
        method: 'GET',
        ...init,
        headers: this.buildHeaders(init?.headers as HeadersInit),
        signal: controller.signal,
      });

      if (!response.ok) {
        const message = await response.text().catch(() => response.statusText || 'Unknown error');
        throw new MiradorAPIError(response.status, message || 'Request failed');
      }

      if (response.status === 204) {
        return undefined as T;
      }

      const contentType = response.headers.get('content-type') ?? '';
      if (contentType.includes('application/json')) {
        return (await response.json()) as T;
      }

      throw new MiradorAPIError(response.status, 'Unexpected response content type');
    } catch (error) {
      if (error instanceof MiradorAPIError) {
        throw error;
      }

      if ((error as Error).name === 'AbortError') {
        throw new MiradorAPIError(408, 'Mirador API request timed out');
      }

      throw new MiradorAPIError(500, (error as Error).message || 'Unknown error');
    } finally {
      clearTimeout(timeout);
    }
  }

  queryLogs(payload: LogsQueryPayload): Promise<LogsResponse> {
    return this.request<LogsResponse>('/api/v1/logs/query', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  queryMetrics(payload: MetricsQueryPayload): Promise<MetricsResponse> {
    return this.request<MetricsResponse>('/api/v1/query', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  queryTraces(payload: TracesQueryPayload): Promise<TracesResponse> {
    return this.request<TracesResponse>('/api/v1/traces/search', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  fetchHistogram(payload: HistogramPayload): Promise<HistogramResponse> {
    return this.request<HistogramResponse>('/api/v1/logs/histogram', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  fetchFacets(query: string, fields: string[]): Promise<FacetsResponse> {
    return this.request<FacetsResponse>('/api/v1/logs/facets', {
      method: 'POST',
      body: JSON.stringify({ query, fields }),
    });
  }

  testConnection(): Promise<{ status: string }> {
    return this.request<{ status: string }>('/api/v1/health');
  }

  static fromOptions(options: MiradorDataSourceOptions, secure?: { bearerToken?: string }) {
    return new MiradorAPIClient({
      baseUrl: options.url,
      tenantId: options.tenantId,
      bearerToken: secure?.bearerToken,
      timeoutMs: options.timeoutMs,
    });
  }
}

export type MiradorQueryType = QueryType;
