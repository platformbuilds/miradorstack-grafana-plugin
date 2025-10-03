import React, { useState, useEffect } from 'react';
import { css } from '@emotion/css';
import { GrafanaTheme2 } from '@grafana/data';
import { useStyles2, Button, Input, Field, TabsBar, Tab } from '@grafana/ui';
import { PluginPage } from '@grafana/runtime';
import DataVisualizer from '../../components/reports/DataVisualizer';
import { exportData, ExportFormat } from '../../utils/export';
import { SavedSearchesModal } from '../../components/SavedSearchesModal';
import { QueryHistoryModal } from '../../components/QueryHistoryModal';
import { queryHistoryManager } from '../../utils/queryHistory';
import { useNavigation } from '../../contexts/NavigationContext';
import NavigationBar from '../../components/NavigationBar';

type ReportType = 'logs' | 'metrics' | 'traces' | 'schema' | 'data-quality';

function ReportsPage() {
  const s = useStyles2(getStyles);
  const { navigationState, updateNavigationState } = useNavigation();
  const [activeTab, setActiveTab] = useState<ReportType>(navigationState.activeTab as ReportType || 'logs');
  const [reportName, setReportName] = useState('');
  const [query, setQuery] = useState(navigationState.query);
  const [timeRange, setTimeRange] = useState(navigationState.timeRange);
  const [reportData, setReportData] = useState<any[]>(navigationState.reportData || []);
  const [showSavedSearches, setShowSavedSearches] = useState(false);
  const [showQueryHistory, setShowQueryHistory] = useState(false);

  // Sync local state with navigation state
  useEffect(() => {
    setQuery(navigationState.query);
    setTimeRange(navigationState.timeRange);
    setReportData(navigationState.reportData || []);
    if (navigationState.activeTab) {
      setActiveTab(navigationState.activeTab as ReportType);
    }
  }, [navigationState]);

  // Update navigation state when local state changes
  useEffect(() => {
    updateNavigationState({
      currentPage: 'reports',
      query,
      timeRange,
      activeTab,
      reportData,
    });
  }, [query, timeRange, activeTab, reportData, updateNavigationState]);

  const tabs = [
    { label: 'Logs Report', value: 'logs' as ReportType },
    { label: 'Metrics Report', value: 'metrics' as ReportType },
    { label: 'Traces Report', value: 'traces' as ReportType },
    { label: 'Schema Explorer', value: 'schema' as ReportType },
    { label: 'Data Quality', value: 'data-quality' as ReportType },
  ];

  const handleGenerateReport = () => {
    // TODO: Implement actual data fetching from Mirador API
    // For now, generate mock data
    const mockData = generateMockData(activeTab);
    setReportData(mockData);
  };

  const generateMockData = (type: ReportType) => {
    if (type === 'logs') {
      return [
        { timestamp: '2023-10-01T10:00:00Z', level: 'INFO', message: 'Application started', service: 'web' },
        { timestamp: '2023-10-01T10:05:00Z', level: 'ERROR', message: 'Database connection failed', service: 'web' },
        { timestamp: '2023-10-01T10:10:00Z', level: 'INFO', message: 'Retry successful', service: 'web' },
      ];
    } else if (type === 'metrics') {
      return [
        { time: '2023-10-01T10:00:00Z', cpu_usage: 45.2, memory_usage: 67.8, response_time: 120 },
        { time: '2023-10-01T10:05:00Z', cpu_usage: 52.1, memory_usage: 71.3, response_time: 135 },
        { time: '2023-10-01T10:10:00Z', cpu_usage: 48.5, memory_usage: 69.2, response_time: 110 },
      ];
    } else if (type === 'traces') {
      return [
        { trace_id: 'abc123', span_id: 'span1', operation: 'http_request', duration: 150, status: 'success' },
        { trace_id: 'abc123', span_id: 'span2', operation: 'db_query', duration: 50, status: 'success' },
        { trace_id: 'def456', span_id: 'span3', operation: 'cache_get', duration: 5, status: 'success' },
      ];
    } else if (type === 'schema') {
      return [
        { name: 'timestamp', type: 'timestamp', nullable: false, indexed: true },
        { name: 'level', type: 'string', nullable: false, indexed: true },
        { name: 'message', type: 'text', nullable: false, indexed: false },
        { name: 'service', type: 'string', nullable: false, indexed: true },
        { name: 'user_id', type: 'integer', nullable: true, indexed: true },
        { name: 'request_id', type: 'string', nullable: true, indexed: false },
      ];
    } else if (type === 'data-quality') {
      return [
        {
          metric: 'Completeness',
          value: 98.5,
          status: 'Excellent',
          description: 'Percentage of records with all required fields populated'
        },
        {
          metric: 'Accuracy',
          value: 95.2,
          status: 'Good',
          description: 'Percentage of records passing validation rules'
        },
        {
          metric: 'Consistency',
          value: 87.3,
          status: 'Fair',
          description: 'Percentage of records with consistent data formats'
        },
        {
          metric: 'Timeliness',
          value: 92.1,
          status: 'Good',
          description: 'Percentage of records ingested within expected time window'
        },
        {
          metric: 'Validity',
          value: 89.7,
          status: 'Fair',
          description: 'Percentage of records conforming to defined schemas'
        },
      ];
    }
    return [];
  };

  const handleExport = (format: ExportFormat) => {
    if (reportData.length === 0) {
      return;
    }

    const filename = `${reportName || 'report'}_${activeTab}_${new Date().toISOString().split('T')[0]}`;
    exportData(reportData, { filename, format });
  };

  const handleLoadSavedSearch = (search: any) => {
    setReportName(search.name);
    setQuery(search.query);
    setTimeRange(search.timeRange);
    // Load the report data if available
    if (search.filters?.reportData) {
      setReportData(search.filters.reportData);
    }
  };

  const handleLoadFromHistory = (historyItem: any) => {
    setQuery(historyItem.query);
    setTimeRange(historyItem.timeRange);
    // Track this as a new history item
    queryHistoryManager.addToHistory({
      query: historyItem.query,
      filters: historyItem.filters,
      timeRange: historyItem.timeRange,
      page: 'reports',
      resultCount: historyItem.resultCount,
      executionTime: historyItem.executionTime,
    });
  };

  return (
    <PluginPage>
      <NavigationBar currentPage="reports" />
      <div className={s.container}>
        <h1>Reports</h1>
        <p>Generate custom reports from your Mirador Core data.</p>

        <TabsBar>
          {tabs.map((tab) => (
            <Tab
              key={tab.value}
              label={tab.label}
              active={activeTab === tab.value}
              onChangeTab={() => setActiveTab(tab.value)}
            />
          ))}
        </TabsBar>

        <div className={s.form}>
          <Field label="Report Name" className={s.field}>
            <Input
              value={reportName}
              onChange={(e) => setReportName(e.currentTarget.value)}
              placeholder="Enter report name"
            />
          </Field>

          <Field label="Query" className={s.field}>
            <Input
              value={query}
              onChange={(e) => setQuery(e.currentTarget.value)}
              placeholder={`Enter ${activeTab} query`}
            />
          </Field>

          <Field label="Time Range" className={s.field}>
            <Input
              value={timeRange}
              onChange={(e) => setTimeRange(e.currentTarget.value)}
              placeholder="e.g., last 1h"
            />
          </Field>

          <Button onClick={handleGenerateReport} className={s.button}>
            Generate Report
          </Button>

          <Button
            variant="secondary"
            onClick={() => setShowSavedSearches(true)}
            className={s.button}
          >
            Saved Searches
          </Button>

          <Button
            variant="secondary"
            onClick={() => setShowQueryHistory(true)}
            className={s.button}
          >
            Query History
          </Button>

          {reportData.length > 0 && (
            <div className={s.exportButtons}>
              <Button
                variant="secondary"
                onClick={() => handleExport('csv')}
                className={s.exportButton}
              >
                Export CSV
              </Button>
              <Button
                variant="secondary"
                onClick={() => handleExport('json')}
                className={s.exportButton}
              >
                Export JSON
              </Button>
            </div>
          )}
        </div>

        <DataVisualizer data={reportData} type={activeTab} />
      </div>

      <SavedSearchesModal
        isOpen={showSavedSearches}
        onClose={() => setShowSavedSearches(false)}
        currentPage="reports"
        currentQuery={query}
        currentFilters={{ reportData }}
        currentTimeRange={timeRange}
        onLoadSearch={handleLoadSavedSearch}
      />

      <QueryHistoryModal
        isOpen={showQueryHistory}
        onClose={() => setShowQueryHistory(false)}
        currentPage="reports"
        onLoadQuery={handleLoadFromHistory}
      />
    </PluginPage>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  container: css`
    padding: ${theme.spacing(2)};
  `,
  form: css`
    margin-top: ${theme.spacing(2)};
    padding: ${theme.spacing(2)};
    border: 1px solid ${theme.colors.border.medium};
    border-radius: ${theme.shape.borderRadius()};
    background: ${theme.colors.background.secondary};
  `,
  field: css`
    margin-bottom: ${theme.spacing(2)};
  `,
  button: css`
    margin-top: ${theme.spacing(2)};
  `,
  exportButtons: css`
    display: flex;
    gap: ${theme.spacing(1)};
    margin-top: ${theme.spacing(2)};
  `,
  exportButton: css`
    flex: 1;
  `,
});

export default ReportsPage;
