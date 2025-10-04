import {
  DataSourceInstanceSettings,
  DataQueryRequest,
  DataQueryResponse,
  DataSourceApi,
  DataSourceJsonData,
  MutableDataFrame,
  FieldType,
  DataQuery,
  DataFrameType,
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
    const secureJsonData = (instanceSettings as any).secureJsonData as MiradorSecureData;
    const { bearerToken } = secureJsonData || {};

    if (!url) {
      throw new Error('Mirador data source URL is not configured');
    }

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

    // Instead of returning raw API responses, always return DataFrame arrays from processResponse
    return new Observable((subscriber) => {
      Promise.all(targets.map((target) => this.doRequest(target, start, end)))
        .then((responses) => {
          // Always transform API responses to DataFrames before returning
          const allFrames = responses.flatMap((response, idx) => this.processResponse(response, targets[idx]));
          subscriber.next({ data: allFrames });
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
      // Log the request for debugging
      console.log(`Making API request for ${target.queryType} with query: "${target.query}"`);
      
      switch (target.queryType) {
        case 'metrics':
          return await this.apiClient.queryMetrics({
            query: target.query,
            query_language: (target.queryLanguage as 'lucene' | 'promql') || 'lucene',
            time: new Date().toISOString(),
          });

        case 'logs':
          // Make sure we always have a valid query string (use * as default if empty)
          const queryString = target.query?.trim() || '*';
          
          // Enhanced time range logging in MiradorDataSource
          console.log(`🔍 MiradorDataSource: Sending logs query with params:`);
          console.log(`⏱️ Time range: start=${new Date(start).toISOString()} (${start}), end=${new Date(end).toISOString()} (${end})`);
          console.log(`🔎 Query string: "${queryString}"`);
          console.log(`🔧 Query language: ${(target.queryLanguage as string) || 'lucene'}`);
          console.log(`🔢 Limit: ${target.limit || 1000}`);
          
          const response = await this.apiClient.queryLogs({
            query: queryString,
            query_language: (target.queryLanguage as 'lucene' | 'logsql') || 'lucene',
            start,
            end,
            limit: target.limit || 1000,
          });
          
          // Log successful response
          console.log(`✅ Logs API response received: status=${response.status || 'unknown'}, logCount=${
            response.data?.logs?.length || 'unknown'
          }`);
          
          return response;

        case 'traces': {
          // Always use correct query format and required fields for backend
          let query = target.query;
          // If query is of the form 'service.name:otelgen', convert to 'service:otelgen'
          if (query && /^service\.name\s*:\s*([\w-]+)$/i.test(query.trim())) {
            const match = query.trim().match(/^service\.name\s*:\s*([\w-]+)$/i);
            if (match) {
              query = `service:${match[1]}`;
            }
          }
          // Always include search_engine and limit
          return await this.apiClient.searchTraces({
            query,
            query_language: (target.queryLanguage as 'lucene') || 'lucene',
            search_engine: 'lucene',
            start: new Date(start).toISOString(),
            end: new Date(end).toISOString(),
            limit: target.limit || 10,
          });
        }

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
    // --- PATCH: Always return traces as a DataFrame with correct fields and meta for Grafana traces UI ---
    if (target.queryType === 'traces') {
      // Find traces array in response
      let traces: any[] = [];
      if (response?.data?.data?.traces && Array.isArray(response.data.data.traces)) {
        traces = response.data.data.traces;
      } else if (response?.data?.traces && Array.isArray(response.data.traces)) {
        traces = response.data.traces;
      }
      // Flatten spans from all traces into a single array, mapping fields for Grafana Traces panel
      let spans: any[] = [];
      traces.forEach(trace => {
        const processes = trace.processes || {};
        if (Array.isArray(trace.spans)) {
          trace.spans.forEach((span: any, i: number) => {
            // Service name from processes, fallback to 'unknown-service' if missing
            let serviceName = '';
            if (span.processID && processes[span.processID] && processes[span.processID].serviceName) {
              serviceName = processes[span.processID].serviceName;
            }
            if (!serviceName) serviceName = span.serviceName || trace.serviceName || 'unknown-service';
            // ParentSpanID from first CHILD_OF reference
            let parentSpanIDRaw = '';
            if (Array.isArray(span.references)) {
              const parentRef = span.references.find((r: any) => r.refType === 'CHILD_OF');
              if (parentRef && parentRef.spanID) parentSpanIDRaw = parentRef.spanID;
            }
            // Tags: always array
            let tags = Array.isArray(span.tags) ? span.tags : [];
            // StartTime: always number (microseconds since epoch)
            let startTime = 0;
            if (typeof span.startTime === 'number') {
              startTime = span.startTime;
            } else if (typeof span.startTime === 'string') {
              // Try to parse ISO string to ms, then to microseconds
              const ms = Date.parse(span.startTime);
              if (!isNaN(ms)) startTime = ms * 1000;
            }
            // OperationName fallback
            let operationName = String(span.operationName || span.name || trace.operationName || '');
            // TraceID fallback
            let traceID = String(span.traceID || span.traceId || trace.traceID || trace.traceId || '');
            // SpanID fallback
            let spanID = String(span.spanID || span.id || '');
            // ParentSpanID fallback
            let parentSpanID = String(parentSpanIDRaw || '');
            // ServiceName fallback
            let serviceNameSafe = String(serviceName || '');
            // Kind
            let kind = String(span.kind || '');
            // StatusCode: always provide a valid number (0=UNSET, 1=OK, 2=ERROR) for Grafana compatibility
            let statusCode: number = 0; // 0=UNSET, 1=OK, 2=ERROR
            let rawStatus = span.statusCode ?? span.status ?? undefined;
            if (rawStatus !== undefined && rawStatus !== null) {
              if (typeof rawStatus === 'number') {
                if (rawStatus === 1) statusCode = 1;
                else if (rawStatus === 2) statusCode = 2;
                else if (rawStatus === 0) statusCode = 0;
                else statusCode = 0;
              } else if (typeof rawStatus === 'string') {
                const s = rawStatus.trim().toLowerCase();
                if (s === 'ok' || s === '1') statusCode = 1;
                else if (s === 'error' || s === '2') statusCode = 2;
                else if (s === 'unset' || s === '0') statusCode = 0;
                else statusCode = 0;
              }
            }
            // Defensive: always ensure statusCode is a number and valid value
            if (typeof statusCode !== 'number' || ![0,1,2].includes(statusCode)) {
              statusCode = 0;
            }
            // ServiceTags, logs, references, warnings, stackTraces: always arrays
            let serviceTags = Array.isArray(span.serviceTags) ? span.serviceTags : [];
            let logs = Array.isArray(span.logs) ? span.logs : [];
            let references = Array.isArray(span.references) ? span.references : [];
            let warnings = Array.isArray(span.warnings) ? span.warnings : [];
            let stackTraces = Array.isArray(span.stackTraces) ? span.stackTraces : [];
            // Duration: always number
            let duration = Number(span.duration) || 0;
            spans.push({
              traceID,
              spanID,
              parentSpanID,
              operationName,
              serviceName: serviceNameSafe,
              serviceTags,
              startTime,
              duration,
              logs,
              references,
              tags,
              kind,
              statusCode,
              warnings,
              stackTraces,
            });
          });
        }
      });
      // Normalize spans to required fields for Grafana Explore
      const fieldNames = [
        'traceID','spanID','parentSpanID','operationName','serviceName','serviceTags','startTime','duration','logs','references','tags','kind','statusCode','warnings','stackTraces'
      ];
      const fields = fieldNames.map(name => {
        let type = FieldType.string;
        if (name === 'duration') type = FieldType.number;
        if (name === 'startTime') type = FieldType.time;
        return { name, type, values: spans.map(s => s[name] ?? '') };
      });
      const frame = new MutableDataFrame({
        refId: target.refId,
        fields,
        meta: {
          preferredVisualisationType: 'trace',
          type: 'trace' as any,
          custom: {
            count: spans.length,
            limit: spans.length,
            debug: {
              traceCount: traces.length,
              spanCount: spans.length,
              sampleTrace: traces[0] || null,
              sampleSpan: spans[0] || null,
            },
          },
        },
      });
      // Debug: log DataFrame structure for troubleshooting
      try {
        const fieldInfo = frame.fields.map(f => ({ name: f.name, type: f.type, valuesType: typeof f.values[0] }));
        let sampleRow: Record<string, any> = {};
        if (frame.length > 0) {
          frame.fields.forEach((f, idx) => {
            sampleRow[f.name] = f.values.get(0);
          });
        }
        // eslint-disable-next-line no-console
        console.log('[Mirador Traces DataFrame]', {
          refId: frame.refId,
          fields: fieldInfo,
          meta: frame.meta,
          sampleRow,
        });
      } catch (e) {
        // eslint-disable-next-line no-console
        console.warn('Failed to log traces DataFrame:', e);
      }
      return [frame];
    }
    // --- PATCH: Always return logs as a DataFrame with correct fields and meta for Grafana logs UI ---
    if (target.queryType === 'logs') {
      // Find logs array in response
      let logs: any[] = [];
      if (response?.data?.data?.logs && Array.isArray(response.data.data.logs)) {
        logs = response.data.data.logs;
      } else if (response?.data?.logs && Array.isArray(response.data.logs)) {
        logs = response.data.logs;
      }
      // Normalize logs to required fields
      const timestamps: number[] = [];
      const bodies: string[] = [];
      const severities: string[] = [];
      const ids: string[] = [];
      const labels: Record<string, any>[] = [];
      logs.forEach((log, i) => {
        // Timestamp
        let ts = log.timestamp || log._time;
        if (!ts) ts = Date.now();
        timestamps.push(typeof ts === 'string' ? Date.parse(ts) : ts);
        // Body/message
        let body = log.body || log.message || log._msg || '';
        bodies.push(body);
        // Severity/level
        severities.push(log.severity || log.level || 'info');
        // ID
        ids.push(log.id || `${target.refId || 'A'}-${i}`);
        // Labels
        labels.push(log.labels || {});
      });
      // Build DataFrame
      const frame = new MutableDataFrame({
        refId: target.refId,
        fields: [
          { name: 'timestamp', type: FieldType.time, values: timestamps },
          { name: 'body', type: FieldType.string, values: bodies },
          { name: 'severity', type: FieldType.string, values: severities },
          { name: 'id', type: FieldType.string, values: ids },
          { name: 'labels', type: FieldType.other, values: labels },
        ],
        meta: {
          type: DataFrameType.LogLines,
          preferredVisualisationType: 'logs',
          custom: {
            count: logs.length,
            limit: logs.length,
          },
        },
      });
      return [frame];
    }
    // --- fallback: original logic for non-logs queries ---
    const frame = new MutableDataFrame({
      refId: target.refId,
      fields: [],
    });
    if (response.data) {
      if (response.data.logs && Array.isArray(response.data.logs)) {
        if (response.data.logs.length > 0) {
          const firstLog = response.data.logs[0];
          Object.keys(firstLog).forEach(key => {
            frame.addField({ name: key, type: FieldType.string });
          });
          response.data.logs.forEach((log: any) => {
            frame.add(log);
          });
          return [frame];
        }
      }
      if (Array.isArray(response.data)) {
        response.data.forEach((item: any, index: number) => {
          if (index === 0) {
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
