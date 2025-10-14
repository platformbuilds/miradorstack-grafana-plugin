import { DataQuery, DataSourceJsonData } from '@grafana/data';

export interface MiradorQuery extends DataQuery {
  queryType: string;
  expr: string;
  from?: string;
  to?: string;
}

export interface MiradorDataSourceOptions extends DataSourceJsonData {
  baseURL: string;
  error?: string | null;
}

export interface MiradorSecureJsonData {
  authToken?: string;
}

export interface QueryEditorProps {
  query: MiradorQuery;
  onChange: (query: MiradorQuery) => void;
  onRunQuery: () => void;
}