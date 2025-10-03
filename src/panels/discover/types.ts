export interface LogsExplorerOptions {
  query: string;
  timeRange: string;
  maxResults: number;
  showTimestamp: boolean;
  showLevel: boolean;
  showService: boolean;
  autoRefresh: boolean;
  refreshInterval: number;
}

export const defaults: LogsExplorerOptions = {
  query: '',
  timeRange: 'last 1h',
  maxResults: 100,
  showTimestamp: true,
  showLevel: true,
  showService: true,
  autoRefresh: false,
  refreshInterval: 30000, // 30 seconds
};
