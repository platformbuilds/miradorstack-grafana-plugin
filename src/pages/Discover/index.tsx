import React, { useState } from 'react';
import { css } from '@emotion/css';
import { GrafanaTheme2 } from '@grafana/data';
import { useStyles2 } from '@grafana/ui';
import { PluginPage } from '@grafana/runtime';
import { SearchBar } from '../../components/discover/SearchBar';
import { TabNavigation } from '../../components/discover/TabNavigation';
import { LogsTab } from '../../components/discover/tabs/LogsTab';
import { MetricsTab } from '../../components/discover/tabs/MetricsTab';
import { TracesTab } from '../../components/discover/tabs/TracesTab';
import { ServiceMeshTab } from '../../components/discover/tabs/ServiceMeshTab';
import { LogsProvider } from '../../contexts/LogsContext';

export type DiscoverTab = 'logs' | 'metrics' | 'traces' | 'service-mesh';

function DiscoverPage() {
  const s = useStyles2(getStyles);
  const [activeTab, setActiveTab] = useState<DiscoverTab>('logs');

  const tabs = [
    { id: 'logs', label: 'Logs', component: LogsTab },
    { id: 'metrics', label: 'Metrics', component: MetricsTab },
    { id: 'traces', label: 'Traces', component: TracesTab },
    { id: 'service-mesh', label: 'Service Mesh', component: ServiceMeshTab },
  ];

  const ActiveTabComponent = tabs.find(tab => tab.id === activeTab)?.component || LogsTab;

  return (
    <PluginPage>
      <div className={s.container}>
        {/* Header with Search Bar */}
        <div className={s.header}>
          <SearchBar />
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
