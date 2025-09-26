import { DataSourceInstanceSettings, CoreApp, ScopedVars } from '@grafana/data';
import { DataSourceWithBackend, getTemplateSrv } from '@grafana/runtime';

import { DEFAULT_QUERY, MiradorDataSourceOptions, MiradorQuery } from './types';

export class DataSource extends DataSourceWithBackend<MiradorQuery, MiradorDataSourceOptions> {
  constructor(instanceSettings: DataSourceInstanceSettings<MiradorDataSourceOptions>) {
    super(instanceSettings);
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
}
