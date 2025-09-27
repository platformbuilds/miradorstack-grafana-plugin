import {
  DataQueryRequest,
  DataQueryResponse,
  DataSourceInstanceSettings,
  CoreApp,
  ScopedVars,
} from '@grafana/data';
import { DataSourceWithBackend, getTemplateSrv } from '@grafana/runtime';
import type { Observable } from 'rxjs';

import { DEFAULT_QUERY, MiradorDataSourceOptions, MiradorQuery, QueryType } from './types';
import { MiradorLiveStream, createLiveStreamOptions } from './live/MiradorLiveStream';

export class DataSource extends DataSourceWithBackend<MiradorQuery, MiradorDataSourceOptions> {
  private readonly options: MiradorDataSourceOptions;
  private liveStream?: MiradorLiveStream;

  constructor(instanceSettings: DataSourceInstanceSettings<MiradorDataSourceOptions>) {
    super(instanceSettings);
    this.options = instanceSettings.jsonData ?? {};
    this.liveStream = this.options.enableWebSocket
      ? new MiradorLiveStream(createLiveStreamOptions(this.options))
      : undefined;
  }

  getDefaultQuery(_: CoreApp): Partial<MiradorQuery> {
    return DEFAULT_QUERY;
  }

  applyTemplateVariables(query: MiradorQuery, scopedVars: ScopedVars) {
    return {
      ...query,
      query: getTemplateSrv().replace(query.query, scopedVars),
    };
  }

  filterQuery(query: MiradorQuery): boolean {
    return Boolean(query.query?.trim());
  }

  query(request: DataQueryRequest<MiradorQuery>): Observable<DataQueryResponse> {
    const target = request.targets?.[0];
    if (
      target &&
      target.queryType === QueryType.Logs &&
      target.query &&
      this.options.enableWebSocket &&
      this.liveStream
    ) {
      return this.liveStream.stream(target);
    }

    return super.query(request);
  }
}
