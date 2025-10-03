// POC API Client for Mirador Core using fetch
// This script tests key endpoints to validate integration

interface MiradorConfig {
  baseUrl: string;
  bearerToken?: string;
}

class MiradorApiClient {
  constructor(private config: MiradorConfig) {}

  private async request(endpoint: string, options: RequestInit = {}): Promise<Response> {
    const url = `${this.config.baseUrl}${endpoint}`;
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(this.config.bearerToken && { Authorization: `Bearer ${this.config.bearerToken}` }),
    };

    return fetch(url, {
      ...options,
      headers: { ...headers, ...options.headers },
    });
  }

  async healthCheck(): Promise<any> {
    const response = await this.request('/health');
    return response.json();
  }

  async logsQuery(query: string, limit = 100): Promise<any> {
    const response = await this.request('/logs/query', {
      method: 'POST',
      body: JSON.stringify({
        query,
        query_language: 'lucene',
        limit,
      }),
    });
    return response.json();
  }

  async metricsQuery(query: string): Promise<any> {
    const response = await this.request('/metrics/query', {
      method: 'POST',
      body: JSON.stringify({
        query,
        query_language: 'lucene',
      }),
    });
    return response.json();
  }

  async tracesSearch(query: string): Promise<any> {
    const response = await this.request('/traces/search', {
      method: 'POST',
      body: JSON.stringify({
        query,
        query_language: 'lucene',
      }),
    });
    return response.json();
  }

  async rcaInvestigate(incidentId: string, symptoms: string[]): Promise<any> {
    const response = await this.request('/rca/investigate', {
      method: 'POST',
      body: JSON.stringify({
        incident_id: incidentId,
        symptoms,
        time_range: {
          start: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
          end: new Date().toISOString(),
        },
      }),
    });
    return response.json();
  }
}

// Example usage (run with ts-node or in Node.js with fetch polyfill)
async function runPOC() {
  const config: MiradorConfig = {
    baseUrl: 'http://localhost:8080/api/v1', // Adjust as needed
    bearerToken: process.env.MIRADOR_BEARER_TOKEN, // Set env var
  };

  const client = new MiradorApiClient(config);

  try {
    console.log('Testing /health...');
    const health = await client.healthCheck();
    console.log('Health check response:', health);

    console.log('Testing /logs/query...');
    const logs = await client.logsQuery('level:ERROR', 10);
    console.log('Logs query response:', logs);

    console.log('Testing /metrics/query...');
    const metrics = await client.metricsQuery('__name__:cpu_usage');
    console.log('Metrics query response:', metrics);

    console.log('Testing /traces/search...');
    const traces = await client.tracesSearch('service:api');
    console.log('Traces search response:', traces);

    console.log('Testing /rca/investigate...');
    const rca = await client.rcaInvestigate('incident-123', ['high latency', 'error spikes']);
    console.log('RCA investigate response:', rca);

  } catch (error) {
    console.error('POC Error:', error);
  }
}

// Run if executed directly (in Node.js environment)
runPOC();

export { MiradorApiClient };
