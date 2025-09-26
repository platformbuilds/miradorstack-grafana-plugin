import { DataSourcePlugin } from '@grafana/data';
import { DataSource } from './datasource';
import { ConfigEditor } from './components/ConfigEditor';
import { QueryEditor } from './components/QueryEditor';
import { MiradorDataSourceOptions, MiradorQuery } from './types';

export const plugin = new DataSourcePlugin<DataSource, MiradorQuery, MiradorDataSourceOptions>(DataSource)
  .setConfigEditor(ConfigEditor)
  .setQueryEditor(QueryEditor);
