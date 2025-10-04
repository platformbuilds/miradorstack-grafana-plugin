export interface SavedSearch {
  id: string;
  name: string;
  description?: string;
  query: string;
  filters: Record<string, any>;
  timeRange: string;
  page: 'reports' | 'ai-insights';
  createdAt: string;
  updatedAt: string;
  tags?: string[];
}

export interface QueryHistoryItem {
  id: string;
  query: string;
  filters: Record<string, any>;
  timeRange: string;
  page: 'reports' | 'ai-insights';
  timestamp: string;
  resultCount?: number;
  executionTime?: number;
  isFavorite?: boolean;
}

export type ExportFormat = 'csv' | 'json';

export type ReportType = 'logs' | 'metrics' | 'traces';
