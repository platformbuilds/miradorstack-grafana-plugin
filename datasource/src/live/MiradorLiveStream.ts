import { Observable } from 'rxjs';
import { DataQueryResponse, FieldType, LoadingState, toDataFrame } from '@grafana/data';
import type { MiradorDataSourceOptions, MiradorQuery } from '../types';

export interface MiradorLiveStreamOptions {
  baseUrl?: string;
  websocketUrl?: string;
  tenantId?: string;
  reconnectIntervalMs?: number;
  WebSocketImpl?: typeof WebSocket;
}

interface LiveLogMessage {
  timestamp: string;
  message: string;
  fields?: Record<string, unknown>;
}

export class MiradorLiveStream {
  private readonly options: Required<Omit<MiradorLiveStreamOptions, 'WebSocketImpl'>>;
  private readonly WebSocketImpl: typeof WebSocket;

  constructor(options: MiradorLiveStreamOptions = {}) {
    this.options = {
      baseUrl: options.baseUrl ?? '',
      websocketUrl: options.websocketUrl ?? '',
      tenantId: options.tenantId ?? '',
      reconnectIntervalMs: options.reconnectIntervalMs ?? 5_000,
    };

    this.WebSocketImpl = options.WebSocketImpl ?? WebSocket;
  }

  stream(query: MiradorQuery): Observable<DataQueryResponse> {
    return new Observable<DataQueryResponse>((observer) => {
      let closedByClient = false;
      let socket: WebSocket | null = null;

      const connect = () => {
        const url = this.buildUrl(query);
        socket = new this.WebSocketImpl(url);

        socket.addEventListener('open', () => {
          const payload = {
            action: 'subscribe',
            query: query.query,
            limit: query.limit ?? 500,
          };
          socket?.send(JSON.stringify(payload));
        });

        socket.addEventListener('message', (event) => {
          try {
            const payload = JSON.parse(event.data) as LiveLogMessage | LiveLogMessage[];
            const messages = Array.isArray(payload) ? payload : [payload];
            const frame = createFrame(messages, query.refId ?? 'A');
            observer.next({
              key: `mirador-logs-${query.refId ?? 'A'}`,
              state: LoadingState.Streaming,
              data: [frame],
            });
          } catch (error) {
            observer.error(error);
          }
        });

        socket.addEventListener('error', (error) => observer.error(error));

        socket.addEventListener('close', (event) => {
          if (closedByClient) {
            observer.complete();
            return;
          }

          if (event.code === 1000) {
            observer.complete();
            return;
          }

          setTimeout(connect, this.options.reconnectIntervalMs);
        });
      };

      connect();

      return () => {
        closedByClient = true;
        socket?.close(1000, 'Client closed');
      };
    });
  }

  private buildUrl(query: MiradorQuery): string {
    if (this.options.websocketUrl) {
      return appendQueryParams(this.options.websocketUrl, query, this.options.tenantId);
    }

    if (!this.options.baseUrl) {
      throw new Error('WebSocket URL or base URL must be provided');
    }

    const base = this.options.baseUrl.replace(/^http/i, 'ws');
    return appendQueryParams(`${base}/api/v1/logs/stream`, query, this.options.tenantId);
  }
}

function appendQueryParams(baseUrl: string, query: MiradorQuery, tenantId?: string): string {
  const url = new URL(baseUrl);
  if (query.query) {
    url.searchParams.set('query', query.query);
  }
  if (query.limit) {
    url.searchParams.set('limit', String(query.limit));
  }
  if (tenantId) {
    url.searchParams.set('tenant', tenantId);
  }
  return url.toString();
}

function createFrame(messages: LiveLogMessage[], refId: string) {
  const fieldMap = new Map<string, { type: FieldType; values: unknown[] }>();
  fieldMap.set('time', { type: FieldType.time, values: [] });
  fieldMap.set('message', { type: FieldType.string, values: [] });

  for (const message of messages) {
    const timeValue = message.timestamp ? new Date(message.timestamp) : new Date();
    fieldMap.get('time')?.values.push(timeValue);
    fieldMap.get('message')?.values.push(message.message ?? '');

    if (message.fields) {
      for (const [key, value] of Object.entries(message.fields)) {
        if (!fieldMap.has(key)) {
          fieldMap.set(key, { type: FieldType.string, values: [] });
        }
        fieldMap.get(key)?.values.push(value);
      }
    }

    for (const field of fieldMap.values()) {
      if (field.values.length < fieldMap.get('time')!.values.length) {
        field.values.push(undefined);
      }
    }
  }

  return toDataFrame({
    refId,
    fields: Array.from(fieldMap.entries()).map(([name, info]) => ({
      name,
      type: info.type,
      values: info.values,
    })),
  });
}

export function createLiveStreamOptions(options: MiradorDataSourceOptions): MiradorLiveStreamOptions {
  return {
    baseUrl: options.url,
    websocketUrl: options.websocketUrl,
    tenantId: options.tenantId,
  };
}
