export interface TracesExplorerOptions {
  query: string;
  timeRange: string;
  maxSpans: number;
  showTimeline: boolean;
  showDetails: boolean;
  autoRefresh: boolean;
  refreshInterval: number;
}

export const defaults: TracesExplorerOptions = {
  query: '',
  timeRange: 'last 1h',
  maxSpans: 50,
  showTimeline: true,
  showDetails: true,
  autoRefresh: false,
  refreshInterval: 30000,
};
