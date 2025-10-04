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
  search_engine?: 'lucene';
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
    if (!options.baseUrl) {
      throw new Error('baseUrl is required for MiradorAPIClient');
    }
    this.baseUrl = options.baseUrl.replace(/\/$/, ''); // Remove trailing slash
    this.bearerToken = options.bearerToken;
    // Allow provisioning or UI to specify timeout in seconds (common short numbers like 30)
    // If a timeout looks like seconds (e.g. <= 1000), treat it as seconds and convert to ms.
    if (options.timeout && options.timeout > 0 && options.timeout < 1000) {
      this.timeout = options.timeout * 1000;
    } else {
      this.timeout = options.timeout || 30000; // default 30 seconds
    }
    this.tenantId = options.tenantId;
  }

  private async request<T>(
    endpoint: string,
    method: 'GET' | 'POST' = 'GET',
    body?: any
  ): Promise<T> {
    // Ensure requests target the API prefix. Many users will configure the base URL
    // as the host root (e.g. http://localhost:8080) or already with /api/v1. Normalize
    // so final URL always contains /api/v1 before the endpoint path.
  const apiPrefix = '/api/v1';
  // Remove trailing slash for accurate endsWith check, then only append apiPrefix when missing
  const baseNoSlash = this.baseUrl.replace(/\/$/, '');
  const normalizedBase = baseNoSlash.endsWith(apiPrefix) ? baseNoSlash : baseNoSlash + apiPrefix;
  const url = `${normalizedBase}${endpoint}`;

    const headers: Record<string, string> = {
      'Authorization': `Bearer ${this.bearerToken}`,
      'Content-Type': 'application/json',
    };

    if (this.tenantId) {
      headers['X-Tenant-ID'] = this.tenantId;
    }
    
    // Enhanced debugging for API request
    console.log(`⚡ API REQUEST: ${method} ${url}`);
    console.log(`🔷 Headers:`, JSON.stringify(headers, null, 2));
    if (body) {
      console.log(`📦 Request body:`, JSON.stringify(body, null, 2));
      
      // Special handling for logs query to show time range explicitly
      if (endpoint === '/logs/query' && body.start && body.end) {
        console.log(`⏱️ Time range: start=${new Date(body.start).toISOString()} (${body.start}), end=${new Date(body.end).toISOString()} (${body.end})`);
      }
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
        console.log(`❌ API ERROR: HTTP ${response.status}`);
        console.log(`❌ Error details: ${errorText}`);
        throw new MiradorAPIError(
          `HTTP ${response.status}: ${errorText}`,
          response.status,
          errorText
        );
      }
      
      // Parse the JSON response
      const jsonData = await response.json();
      
      // Log the response for debugging (limited to avoid flooding the console)
      console.log(`✅ API RESPONSE: ${response.status} ${response.statusText}`);
      if (jsonData) {
        // Try to safely stringify and truncate the response
        let jsonStr;
        try {
          jsonStr = JSON.stringify(jsonData);
          if (jsonStr.length > 500) {
            jsonStr = jsonStr.substring(0, 500) + '... (truncated)';
          }
          console.log(`📊 Response data: ${jsonStr}`);
        } catch (e) {
          console.log(`📊 Response data: [Complex object that couldn't be stringified]`);
        }
        
        // Special handling for logs response to check if time range was honored
        if (endpoint === '/logs/query' && body?.start && body?.end) {
          const logs = jsonData.data?.logs || [];
          if (logs.length > 0) {
            // Check the first and last log timestamps
            let timestamps = logs
              .map((log: any) => typeof log.timestamp === 'string' ? new Date(log.timestamp).getTime() : 
                   typeof log.timestamp === 'number' ? log.timestamp : null)
              .filter((ts: any) => ts !== null);
            
            if (timestamps.length > 0) {
              const minTimestamp = Math.min(...timestamps);
              const maxTimestamp = Math.max(...timestamps);
              console.log(`📅 Log timestamps: min=${new Date(minTimestamp).toISOString()}, max=${new Date(maxTimestamp).toISOString()}`);
              console.log(`📅 Requested time range: start=${new Date(body.start).toISOString()}, end=${new Date(body.end).toISOString()}`);
              
              // Check if logs fall outside the requested time range
              if (minTimestamp < body.start) {
                console.log(`⚠️ WARNING: Found logs with timestamps earlier than requested start time`);
              }
              if (maxTimestamp > body.end) {
                console.log(`⚠️ WARNING: Found logs with timestamps later than requested end time`);
              }
            }
          }
        }
      }

      return jsonData;
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

  async getLogFields(): Promise<any> {
    return this.request('/logs/fields', 'GET');
  }

  async healthCheck(): Promise<any> {
    return this.request('/health');
  }

  async queryLogs(request: LogsQueryRequest): Promise<any> {
    console.log(`MiradorAPIClient: Sending logs query request:`, {
      query: request.query,
      start: request.start ? new Date(request.start).toISOString() : 'undefined',
      end: request.end ? new Date(request.end).toISOString() : 'undefined',
      limit: request.limit,
      query_language: request.query_language
    });
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
      // Same coercion as constructor: interpret small numeric values as seconds
      if (options.timeout > 0 && options.timeout < 1000) {
        this.timeout = options.timeout * 1000;
      } else {
        this.timeout = options.timeout;
      }
    }
    if (options.tenantId !== undefined) {
      this.tenantId = options.tenantId;
    }
  }
}
