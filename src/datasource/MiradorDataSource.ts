import {
  DataSourceInstanceSettings,
  DataQueryRequest,
  DataQueryResponse,
  DataSourceApi,
  DataSourceJsonData,
  MutableDataFrame,
  FieldType,
  DataQuery,
} from '@grafana/data';
import { Observable } from 'rxjs';
import { MiradorAPIClient, MiradorAPIError } from './api/MiradorAPIClient';

// Define the data source options
export interface MiradorDataSourceOptions extends DataSourceJsonData {
  url: string;
  timeout?: number;
  tenantId?: string;
}

// Define the secure data (for tokens)
export interface MiradorSecureData {
  bearerToken?: string;
}

// Define query types
export interface MiradorQuery extends DataQuery {
  queryType: 'metrics' | 'logs' | 'traces' | 'rca' | 'health';
  query: string;
  queryLanguage?: 'lucene' | 'promql' | 'logsql';
  start?: number;
  end?: number;
  limit?: number;
}

export class MiradorDataSource extends DataSourceApi<MiradorQuery, MiradorDataSourceOptions> {
  protected instanceSettings: DataSourceInstanceSettings<MiradorDataSourceOptions>;
  private apiClient: MiradorAPIClient;

  constructor(instanceSettings: DataSourceInstanceSettings<MiradorDataSourceOptions>) {
    super(instanceSettings);
    this.instanceSettings = instanceSettings;

    // Initialize API client
    const { url, timeout, tenantId } = instanceSettings.jsonData;
    const { bearerToken } = (instanceSettings as any).secureJsonData as MiradorSecureData;

    this.apiClient = new MiradorAPIClient({
      baseUrl: url,
      bearerToken: bearerToken || '',
      timeout,
      tenantId,
    });
  }

  // Query method
  query(options: DataQueryRequest<MiradorQuery>): Observable<DataQueryResponse> {
    const { range, targets } = options;
    const start = range.from.valueOf();
    const end = range.to.valueOf();

    const promises = targets.map((target) => this.doRequest(target, start, end));

    return new Observable((subscriber) => {
      Promise.all(promises)
        .then((responses) => {
          const data = responses.flatMap((response, index) => this.processResponse(response, targets[index]));
          subscriber.next({ data });
          subscriber.complete();
        })
        .catch((error) => {
          subscriber.error(error);
        });
    });
  }

  // Test data source connection
  async testDatasource(): Promise<any> {
    try {
      await this.apiClient.healthCheck();
      return { status: 'success', message: 'Data source connected successfully' };
    } catch (error) {
      if (error instanceof MiradorAPIError) {
        return { status: 'error', message: `Failed to connect to Mirador Core: ${error.message}` };
      }
      return { status: 'error', message: 'Failed to connect to Mirador Core' };
    }
  }

  // Perform API request
  private async doRequest(target: MiradorQuery, start: number, end: number): Promise<any> {
    try {
      switch (target.queryType) {
        case 'metrics':
          return await this.apiClient.queryMetrics({
            query: target.query,
            query_language: (target.queryLanguage as 'lucene' | 'promql') || 'lucene',
            time: new Date().toISOString(),
          });

        case 'logs':
          return await this.apiClient.queryLogs({
            query: target.query,
            query_language: (target.queryLanguage as 'lucene' | 'logsql') || 'lucene',
            start,
            end,
            limit: target.limit || 1000,
          });

        case 'traces':
          return await this.apiClient.searchTraces({
            query: target.query,
            query_language: target.queryLanguage as 'lucene' || 'lucene',
            start: new Date(start).toISOString(),
            end: new Date(end).toISOString(),
            limit: target.limit,
          });

        case 'rca':
          return await this.apiClient.investigateRCA({
            incident_id: target.query,
            symptoms: ['latency', 'errors'], // Placeholder - could be made configurable
            time_range: {
              start: new Date(start).toISOString(),
              end: new Date(end).toISOString(),
            },
          });

        case 'health':
          return await this.apiClient.healthCheck();

        default:
          throw new Error(`Unsupported query type: ${target.queryType}`);
      }
    } catch (error) {
      if (error instanceof MiradorAPIError) {
        throw error;
      }
      throw new Error(`Request failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Process response into DataFrame
  private processResponse(response: any, target: MiradorQuery): MutableDataFrame[] {
    const frame = new MutableDataFrame({
      refId: target.refId,
      fields: [],
    });

    // Basic processing - customize based on response structure
    if (response.data) {
      // Assume response.data is an array of objects
      if (Array.isArray(response.data)) {
        response.data.forEach((item: any, index: number) => {
          if (index === 0) {
            // Set fields from first item
            Object.keys(item).forEach((key) => {
              frame.addField({ name: key, type: FieldType.string });
            });
          }
          frame.add(item);
        });
      }
    }

    return [frame];
  }
}
