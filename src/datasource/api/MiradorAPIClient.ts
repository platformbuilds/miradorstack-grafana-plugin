export class MiradorAPIError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public response?: any
  ) {
    super(message);
    this.name = 'MiradorAPIError';
  }
}

export interface MiradorAPIClientOptions {
  baseUrl: string;
  bearerToken: string;
  timeout?: number;
  tenantId?: string;
}

export interface LogsQueryRequest {
  query: string;
  query_language?: 'lucene' | 'logsql';
  start?: number;
  end?: number;
  limit?: number;
  tenantId?: string;
}

export interface MetricsQueryRequest {
  query: string;
  query_language?: 'lucene' | 'promql';
  time?: string;
  include_definitions?: boolean;
  label_keys?: string[];
}

export interface TracesSearchRequest {
  query?: string;
  query_language?: 'lucene';
  service?: string;
  operation?: string;
  tags?: string;
  minDuration?: string;
  maxDuration?: string;
  start?: string;
  end?: string;
  limit?: number;
}

export interface RCAInvestigateRequest {
  incident_id?: string;
  symptoms: string[];
  time_range: {
    start: string;
    end: string;
  };
}

export class MiradorAPIClient {
  private baseUrl: string;
  private bearerToken: string;
  private timeout: number;
  private tenantId?: string;

  constructor(options: MiradorAPIClientOptions) {
    this.baseUrl = options.baseUrl.replace(/\/$/, ''); // Remove trailing slash
    this.bearerToken = options.bearerToken;
    this.timeout = options.timeout || 30000; // 30 seconds default
    this.tenantId = options.tenantId;
  }

  private async request<T>(
    endpoint: string,
    method: 'GET' | 'POST' = 'GET',
    body?: any
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    const headers: Record<string, string> = {
      'Authorization': `Bearer ${this.bearerToken}`,
      'Content-Type': 'application/json',
    };

    if (this.tenantId) {
      headers['X-Tenant-ID'] = this.tenantId;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        throw new MiradorAPIError(
          `HTTP ${response.status}: ${errorText}`,
          response.status,
          errorText
        );
      }

      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof MiradorAPIError) {
        throw error;
      }

      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new MiradorAPIError(`Request timeout after ${this.timeout}ms`);
        }
        throw new MiradorAPIError(`Network error: ${error.message}`);
      }

      throw new MiradorAPIError('Unknown error occurred');
    }
  }

  async healthCheck(): Promise<any> {
    return this.request('/health');
  }

  async queryLogs(request: LogsQueryRequest): Promise<any> {
    return this.request('/logs/query', 'POST', request);
  }

  async queryMetrics(request: MetricsQueryRequest): Promise<any> {
    return this.request('/metrics/query', 'POST', request);
  }

  async searchTraces(request: TracesSearchRequest): Promise<any> {
    return this.request('/traces/search', 'POST', request);
  }

  async investigateRCA(request: RCAInvestigateRequest): Promise<any> {
    return this.request('/rca/investigate', 'POST', request);
  }

  // Update configuration
  updateConfig(options: Partial<MiradorAPIClientOptions>): void {
    if (options.baseUrl) {
      this.baseUrl = options.baseUrl.replace(/\/$/, '');
    }
    if (options.bearerToken) {
      this.bearerToken = options.bearerToken;
    }
    if (options.timeout) {
      this.timeout = options.timeout;
    }
    if (options.tenantId !== undefined) {
      this.tenantId = options.tenantId;
    }
  }
}
