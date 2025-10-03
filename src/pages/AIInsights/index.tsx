import React, { useState, useEffect } from 'react';
import { css } from '@emotion/css';
import { GrafanaTheme2 } from '@grafana/data';
import { useStyles2, Button, Input, Field, TabsBar, Tab } from '@grafana/ui';
import { PluginPage } from '@grafana/runtime';
import RCAViewer from '../../components/ai-insights/RCAViewer';
import { SavedSearchesModal } from '../../components/SavedSearchesModal';
import { QueryHistoryModal } from '../../components/QueryHistoryModal';
import { queryHistoryManager } from '../../utils/queryHistory';
import { exportData, ExportFormat } from '../../utils/export';
import { useNavigation } from '../../contexts/NavigationContext';
import NavigationBar from '../../components/NavigationBar';

type InsightType = 'rca' | 'anomalies' | 'predictions';

function AIInsightsPage() {
  const s = useStyles2(getStyles);
  const { navigationState, updateNavigationState } = useNavigation();
  const [activeTab, setActiveTab] = useState<InsightType>(navigationState.activeTab as InsightType || 'rca');
  const [query, setQuery] = useState(navigationState.query);
  const [timeRange, setTimeRange] = useState(navigationState.timeRange);
  const [insightsData, setInsightsData] = useState<any>(navigationState.insightsData || null);
  const [showSavedSearches, setShowSavedSearches] = useState(false);
  const [showQueryHistory, setShowQueryHistory] = useState(false);

  // Sync local state with navigation state
  useEffect(() => {
    setQuery(navigationState.query);
    setTimeRange(navigationState.timeRange);
    setInsightsData(navigationState.insightsData || null);
    if (navigationState.activeTab) {
      setActiveTab(navigationState.activeTab as InsightType);
    }
  }, [navigationState]);

  // Update navigation state when local state changes
  useEffect(() => {
    updateNavigationState({
      currentPage: 'ai-insights',
      query,
      timeRange,
      activeTab,
      insightsData,
    });
  }, [query, timeRange, activeTab, insightsData, updateNavigationState]);

  const tabs = [
    { label: 'Root Cause Analysis', value: 'rca' as InsightType },
    { label: 'Anomaly Detection', value: 'anomalies' as InsightType },
    { label: 'Predictions', value: 'predictions' as InsightType },
  ];

  const handleAnalyze = () => {
    // TODO: Implement actual AI analysis from Mirador API
    // For now, generate mock insights
    const mockData = generateMockInsights(activeTab);
    setInsightsData(mockData);
  };

  const handleLoadSavedSearch = (search: any) => {
    setQuery(search.query);
    setTimeRange(search.timeRange);
    // Load insights data if available
    if (search.filters?.insightsData) {
      setInsightsData(search.filters.insightsData);
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
      page: 'ai-insights',
      resultCount: historyItem.resultCount,
      executionTime: historyItem.executionTime,
    });
  };

  const handleExport = (format: ExportFormat) => {
    if (!insightsData) {
      return;
    }

    let exportDataArray: any[] = [];
    const filename = `ai-insights-${activeTab}_${new Date().toISOString().split('T')[0]}`;

    if (activeTab === 'rca') {
      exportDataArray = [{
        rootCause: insightsData.rootCause,
        confidence: insightsData.confidence,
        evidence: insightsData.evidence.join('; '),
        recommendations: insightsData.recommendations.join('; '),
      }];
    } else if (activeTab === 'anomalies') {
      exportDataArray = insightsData.anomalies;
    } else if (activeTab === 'predictions') {
      exportDataArray = insightsData.predictions;
    }

    exportData(exportDataArray, { filename, format });
  };

  const generateMockInsights = (type: InsightType) => {
    if (type === 'rca') {
      return {
        rootCause: 'Database connection timeout',
        confidence: 0.95,
        evidence: [
          'High latency in db_query spans',
          'Connection pool exhausted',
          'Error rate increased by 300%',
          'Memory usage spiked during peak hours',
          'Slow query execution times observed',
        ],
        recommendations: [
          'Increase connection pool size from 10 to 20',
          'Add retry logic with exponential backoff',
          'Implement connection pooling with proper cleanup',
          'Monitor database performance metrics continuously',
          'Consider database query optimization',
        ],
      };
    } else if (type === 'anomalies') {
      return {
        anomalies: [
          {
            type: 'Spike',
            metric: 'error_rate',
            timestamp: '2023-10-01T10:05:00Z',
            severity: 'high',
            expectedValue: 0.02,
            actualValue: 0.15,
            deviation: 6.5,
          },
          {
            type: 'Drop',
            metric: 'throughput',
            timestamp: '2023-10-01T10:10:00Z',
            severity: 'medium',
            expectedValue: 1500,
            actualValue: 850,
            deviation: -0.43,
          },
          {
            type: 'Spike',
            metric: 'memory_usage',
            timestamp: '2023-10-01T10:15:00Z',
            severity: 'low',
            expectedValue: 70,
            actualValue: 85,
            deviation: 0.21,
          },
        ],
      };
    } else if (type === 'predictions') {
      return {
        predictions: [
          {
            metric: 'cpu_usage',
            forecast: 'Increase to 80% in 2 hours',
            confidence: 0.85,
            timeHorizon: 'Next 2 hours',
            trend: 'Increasing',
            action: 'Scale up resources',
          },
          {
            metric: 'memory_usage',
            forecast: 'Stable for next 4 hours',
            confidence: 0.92,
            timeHorizon: 'Next 4 hours',
            trend: 'Stable',
            action: 'Monitor closely',
          },
          {
            metric: 'error_rate',
            forecast: 'Gradual decrease to 0.5%',
            confidence: 0.78,
            timeHorizon: 'Next 6 hours',
            trend: 'Decreasing',
            action: 'Continue monitoring',
          },
        ],
      };
    }
    return null;
  };

  return (
    <PluginPage>
      <NavigationBar currentPage="ai-insights" />
      <div className={s.container}>
        <h1>AI Insights</h1>
        <p>Leverage AI-powered analysis for root cause analysis, anomaly detection, and predictive insights.</p>

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
          <Field label="Query" className={s.field}>
            <Input
              value={query}
              onChange={(e) => setQuery(e.currentTarget.value)}
              placeholder={`Enter query for ${activeTab}`}
            />
          </Field>

          <Field label="Time Range" className={s.field}>
            <Input
              value={timeRange}
              onChange={(e) => setTimeRange(e.currentTarget.value)}
              placeholder="e.g., last 1h"
            />
          </Field>

          <Button onClick={handleAnalyze} className={s.button}>
            Analyze
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
        </div>

        {insightsData && <RCAViewer data={insightsData} type={activeTab} />}

        {insightsData && (
          <div className={s.exportSection}>
            <h3>Export Results</h3>
            <div className={s.exportButtons}>
              <Button
                variant="secondary"
                onClick={() => handleExport('csv')}
                icon="download-alt"
              >
                Export as CSV
              </Button>
              <Button
                variant="secondary"
                onClick={() => handleExport('json')}
                icon="download-alt"
              >
                Export as JSON
              </Button>
            </div>
          </div>
        )}
      </div>

      <SavedSearchesModal
        isOpen={showSavedSearches}
        onClose={() => setShowSavedSearches(false)}
        currentPage="ai-insights"
        currentQuery={query}
        currentFilters={{ insightsData }}
        currentTimeRange={timeRange}
        onLoadSearch={handleLoadSavedSearch}
      />

      <QueryHistoryModal
        isOpen={showQueryHistory}
        onClose={() => setShowQueryHistory(false)}
        currentPage="ai-insights"
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
  exportSection: css`
    margin-top: ${theme.spacing(4)};
    padding: ${theme.spacing(2)};
    border: 1px solid ${theme.colors.border.medium};
    border-radius: ${theme.shape.borderRadius()};
    background: ${theme.colors.background.secondary};
  `,
  exportButtons: css`
    display: flex;
    gap: ${theme.spacing(2)};
    margin-top: ${theme.spacing(2)};
  `,
});

export default AIInsightsPage;
