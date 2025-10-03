import React from 'react';
import { css } from '@emotion/css';
import { GrafanaTheme2 } from '@grafana/data';
import { useStyles2, Tab, TabsBar } from '@grafana/ui';
import { DiscoverTab } from '../../pages/Discover';

interface TabNavigationProps {
  activeTab: DiscoverTab;
  onTabChange: (tab: DiscoverTab) => void;
}

const tabs = [
  { id: 'logs' as const, label: 'Logs' },
  { id: 'metrics' as const, label: 'Metrics' },
  { id: 'traces' as const, label: 'Traces' },
  { id: 'service-mesh' as const, label: 'Service Mesh' },
];

export function TabNavigation({ activeTab, onTabChange }: TabNavigationProps) {
  const s = useStyles2(getStyles);

  return (
    <div className={s.container}>
      <TabsBar>
        {tabs.map((tab) => (
          <Tab
            key={tab.id}
            label={tab.label}
            active={activeTab === tab.id}
            onChangeTab={() => onTabChange(tab.id)}
          />
        ))}
      </TabsBar>
    </div>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  container: css`
    padding: 0 ${theme.spacing(2)};
  `,
});
