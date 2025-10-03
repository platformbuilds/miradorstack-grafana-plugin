export interface MetricsExplorerOptions {
  query: string;
  timeRange: string;
  chartType: 'line' | 'bar' | 'area';
  showLegend: boolean;
  showGrid: boolean;
  autoRefresh: boolean;
  refreshInterval: number;
}

export const defaults: MetricsExplorerOptions = {
  query: '',
  timeRange: 'last 1h',
  chartType: 'line',
  showLegend: true,
  showGrid: true,
  autoRefresh: false,
  refreshInterval: 30000,
};
