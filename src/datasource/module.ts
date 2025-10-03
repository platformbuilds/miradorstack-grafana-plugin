import { DataSourcePlugin } from '@grafana/data';
import { MiradorDataSource } from './MiradorDataSource';
import { ConfigEditor } from './ConfigEditor';
import { QueryEditor } from './QueryEditor';

export const plugin = new DataSourcePlugin(MiradorDataSource)
  .setConfigEditor(ConfigEditor)
  .setQueryEditor(QueryEditor);
