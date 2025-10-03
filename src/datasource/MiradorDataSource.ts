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
import { getBackendSrv } from '@grafana/runtime';
import { Observable } from 'rxjs';

// Define the data source options
export interface MiradorDataSourceOptions extends DataSourceJsonData {
  url: string;
  timeout?: number;
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

  constructor(instanceSettings: DataSourceInstanceSettings<MiradorDataSourceOptions>) {
    super(instanceSettings);
    this.instanceSettings = instanceSettings;
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
  testDatasource(): Promise<any> {
    return this.doRequest({ queryType: 'health', query: '', refId: 'test' }, 0, 0).then((response) => {
      if (response.status === 200) {
        return { status: 'success', message: 'Data source connected successfully' };
      } else {
        return { status: 'error', message: 'Failed to connect to Mirador Core' };
      }
    });
  }

  // Perform API request
  private async doRequest(target: MiradorQuery, start: number, end: number): Promise<any> {
    const { url } = this.instanceSettings.jsonData;
    const { bearerToken } = (this.instanceSettings as any).secureJsonData as MiradorSecureData;

    let endpoint = '';
    let method = 'POST';
    let body: any = {};

    switch (target.queryType) {
      case 'metrics':
        endpoint = '/metrics/query';
        body = {
          query: target.query,
          query_language: target.queryLanguage || 'lucene',
          time: new Date().toISOString(),
        };
        break;
      case 'logs':
        endpoint = '/logs/query';
        body = {
          query: target.query,
          query_language: target.queryLanguage || 'lucene',
          start,
          end,
          limit: target.limit || 1000,
        };
        break;
      case 'traces':
        endpoint = '/traces/search';
        body = {
          query: target.query,
          query_language: target.queryLanguage || 'lucene',
          start,
          end,
        };
        break;
      case 'rca':
        endpoint = '/rca/investigate';
        body = {
          incident_id: target.query,
          symptoms: ['latency', 'errors'], // Placeholder
          time_range: { start: new Date(start).toISOString(), end: new Date(end).toISOString() },
        };
        break;
      case 'health':
        endpoint = '/health';
        method = 'GET';
        body = undefined;
        break;
      default:
        throw new Error(`Unsupported query type: ${target.queryType}`);
    }

    const headers: any = {};
    if (bearerToken) {
      headers['Authorization'] = `Bearer ${bearerToken}`;
    }

    return getBackendSrv().fetch({
      url: `${url}${endpoint}`,
      method,
      headers,
      data: body,
    }).toPromise();
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