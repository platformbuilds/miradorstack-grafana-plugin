import React, { useState, useEffect } from 'react';
import { css } from '@emotion/css';
import { GrafanaTheme2 } from '@grafana/data';
import { useStyles2, Button, Switch } from '@grafana/ui';
import { PluginPage } from '@grafana/runtime';
import { SearchBar } from '../../components/discover/SearchBar';
import { QueryBuilder } from '../../components/discover/QueryBuilder';
import { TabNavigation } from '../../components/discover/TabNavigation';
import { LogsTab } from '../../components/discover/tabs/LogsTab';
import { MetricsTab } from '../../components/discover/tabs/MetricsTab';
import { TracesTab } from '../../components/discover/tabs/TracesTab';
import { ServiceMeshTab } from '../../components/discover/tabs/ServiceMeshTab';
import { LogsProvider } from '../../contexts/LogsContext';
import { SavedSearchesModal } from '../../components/SavedSearchesModal';
import { QueryHistoryModal } from '../../components/QueryHistoryModal';
import { queryHistoryManager } from '../../utils/queryHistory';
import { useNavigation } from '../../contexts/NavigationContext';
import NavigationBar from '../../components/NavigationBar';

export type DiscoverTab = 'logs' | 'metrics' | 'traces' | 'service-mesh';
export type QueryMode = 'raw' | 'builder';

function DiscoverPage() {
  const s = useStyles2(getStyles);
  const { navigationState, updateNavigationState } = useNavigation();
  const [activeTab, setActiveTab] = useState<DiscoverTab>(navigationState.activeTab as DiscoverTab || 'logs');
  const [showSavedSearches, setShowSavedSearches] = useState(false);
  const [showQueryHistory, setShowQueryHistory] = useState(false);
  const [currentQuery, setCurrentQuery] = useState(navigationState.query);
  const [currentFilters, setCurrentFilters] = useState<Record<string, any>>(navigationState.filters);
  const [currentTimeRange, setCurrentTimeRange] = useState(navigationState.timeRange);
  const [queryMode, setQueryMode] = useState<QueryMode>('raw');

  // Sync local state with navigation state
  useEffect(() => {
    setCurrentQuery(navigationState.query);
    setCurrentFilters(navigationState.filters);
    setCurrentTimeRange(navigationState.timeRange);
    if (navigationState.activeTab) {
      setActiveTab(navigationState.activeTab as DiscoverTab);
    }
  }, [navigationState]);

  // Update navigation state when local state changes
  useEffect(() => {
    updateNavigationState({
      currentPage: 'discover',
      query: currentQuery,
      filters: currentFilters,
      timeRange: currentTimeRange,
      activeTab,
    });
  }, [currentQuery, currentFilters, currentTimeRange, activeTab, updateNavigationState]);

  const handleLoadSavedSearch = (search: any) => {
    setCurrentQuery(search.query);
    setCurrentFilters(search.filters);
    setCurrentTimeRange(search.timeRange);
    // Here you would also update the SearchBar and other components with the loaded search
  };

  const handleLoadFromHistory = (historyItem: any) => {
    setCurrentQuery(historyItem.query);
    setCurrentFilters(historyItem.filters);
    setCurrentTimeRange(historyItem.timeRange);
    // Track this as a new history item
    queryHistoryManager.addToHistory({
      query: historyItem.query,
      filters: historyItem.filters,
      timeRange: historyItem.timeRange,
      page: 'discover',
    });
  };

  const tabs = [
    { id: 'logs', label: 'Logs', component: LogsTab },
    { id: 'metrics', label: 'Metrics', component: MetricsTab },
    { id: 'traces', label: 'Traces', component: TracesTab },
    { id: 'service-mesh', label: 'Service Mesh', component: ServiceMeshTab },
  ];

  const ActiveTabComponent = tabs.find(tab => tab.id === activeTab)?.component || LogsTab;

  return (
    <PluginPage>
      <NavigationBar currentPage="discover" />
      <div className={s.container}>
        {/* Header with Search Bar */}
        <div className={s.header}>
          <div className={s.searchControls}>
            <SearchBar queryMode={queryMode} />
            <div className={s.queryBuilderContainer}>
              <QueryBuilder onQueryChange={setCurrentQuery} queryMode={queryMode} />
            </div>
          </div>
          <div className={s.headerActions}>
            <div className={s.toggleContainer}>
              <span>Raw Query</span>
              <Switch
                value={queryMode === 'builder'}
                onChange={() => setQueryMode(queryMode === 'raw' ? 'builder' : 'raw')}
              />
              <span>Query Builder</span>
            </div>
            <Button
              variant="secondary"
              onClick={() => setShowSavedSearches(true)}
              className={s.headerButton}
            >
              Saved Searches
            </Button>
            <Button
              variant="secondary"
              onClick={() => setShowQueryHistory(true)}
              className={s.headerButton}
            >
              Query History
            </Button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className={s.tabNavigation}>
          <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />
        </div>

        {/* Tab Content */}
        <div className={s.content}>
          <LogsProvider>
            <ActiveTabComponent />
          </LogsProvider>
        </div>
      </div>

      <SavedSearchesModal
        isOpen={showSavedSearches}
        onClose={() => setShowSavedSearches(false)}
        currentPage="discover"
        currentQuery={currentQuery}
        currentFilters={currentFilters}
        currentTimeRange={currentTimeRange}
        onLoadSearch={handleLoadSavedSearch}
      />

      <QueryHistoryModal
        isOpen={showQueryHistory}
        onClose={() => setShowQueryHistory(false)}
        currentPage="discover"
        onLoadQuery={handleLoadFromHistory}
      />
    </PluginPage>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  container: css`
    display: flex;
    flex-direction: column;
    height: 100vh;
    background: ${theme.colors.background.primary};
  `,
  header: css`
    padding: ${theme.spacing(2)};
    border-bottom: 1px solid ${theme.colors.border.weak};
    background: ${theme.colors.background.secondary};
    display: flex;
    flex-direction: column;
    gap: ${theme.spacing(2)};
  `,
  searchControls: css`
    display: flex;
    flex-direction: column;
    width: 100%;
    gap: ${theme.spacing(1)};
  `,
  queryBuilderContainer: css`
    width: 100%;
  `,
  headerActions: css`
    display: flex;
    justify-content: flex-end;
    align-items: center;
    width: 100%;
    gap: ${theme.spacing(2)};
  `,
  toggleContainer: css`
    display: flex;
    align-items: center;
    gap: ${theme.spacing(1)};
    font-size: ${theme.typography.size.sm};
  `,
  headerButton: css`
    margin-left: ${theme.spacing(1)};
  `,
  tabNavigation: css`
    border-bottom: 1px solid ${theme.colors.border.weak};
    background: ${theme.colors.background.secondary};
  `,
  content: css`
    flex: 1;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  `,
});

export default DiscoverPage;
