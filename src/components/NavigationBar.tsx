import React from 'react';
import { css } from '@emotion/css';
import { GrafanaTheme2 } from '@grafana/data';
import { useStyles2, Button, Icon } from '@grafana/ui';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../constants';
import { useNavigation } from '../contexts/NavigationContext';

interface NavigationBarProps {
  currentPage: string;
}

const NavigationBar: React.FC<NavigationBarProps> = ({ currentPage }) => {
  const s = useStyles2(getStyles);
  const { navigationState, navigateToPage } = useNavigation();
  const navigate = useNavigate();

  const navigationItems = [
    {
      id: 'reports',
      label: 'Reports',
      route: ROUTES.Reports,
      icon: 'document-info',
      description: 'Generate custom reports',
    },
    {
      id: 'ai-insights',
      label: 'AI Insights',
      route: ROUTES.AIInsights,
      icon: 'ai',
      description: 'AI-powered analysis and insights',
    },
  ];

  const handleNavigate = (pageId: string, route: string) => {
    // Preserve current state when navigating
    navigateToPage(pageId, {
      query: navigationState.query,
      filters: navigationState.filters,
      timeRange: navigationState.timeRange,
      activeTab: navigationState.activeTab,
    });

    // Use React Router navigation
    navigate(`/${route}`);
  };

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'create-report':
        navigateToPage('reports', {
          query: navigationState.query,
          filters: navigationState.filters,
          timeRange: navigationState.timeRange,
          activeTab: navigationState.activeTab,
        });
        navigate(`/${ROUTES.Reports}`);
        break;
      case 'analyze-data':
        navigateToPage('ai-insights', {
          query: navigationState.query,
          filters: navigationState.filters,
          timeRange: navigationState.timeRange,
          activeTab: 'rca',
        });
        navigate(`/${ROUTES.AIInsights}`);
        break;
    }
  };

  return (
    <div className={s.container}>
      <div className={s.navItems}>
        {navigationItems.map((item) => (
          <Button
            key={item.id}
            variant={currentPage === item.id ? 'primary' : 'secondary'}
            size="sm"
            icon={item.icon as any}
            onClick={() => handleNavigate(item.id, item.route)}
            className={s.navButton}
            title={item.description}
          >
            {item.label}
          </Button>
        ))}
      </div>

      <div className={s.quickActions}>
        {navigationState.query && (
          <>
            <Button
              variant="secondary"
              size="sm"
              icon="document-info"
              onClick={() => handleQuickAction('create-report')}
              title="Create report from current query"
            >
              Create Report
            </Button>
            <Button
              variant="secondary"
              size="sm"
              icon="bolt"
              onClick={() => handleQuickAction('analyze-data')}
              title="Analyze current data with AI"
            >
              Analyze
            </Button>
          </>
        )}
      </div>

      {navigationState.query && (
        <div className={s.currentContext}>
          <Icon name="filter" size="sm" />
          <span className={s.contextText}>
            Current query: {navigationState.query.length > 30
              ? `${navigationState.query.substring(0, 30)}...`
              : navigationState.query}
          </span>
        </div>
      )}
    </div>
  );
};

const getStyles = (theme: GrafanaTheme2) => ({
  container: css`
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: ${theme.spacing(1, 2)};
    border-bottom: 1px solid ${theme.colors.border.weak};
    background: ${theme.colors.background.secondary};
  `,
  navItems: css`
    display: flex;
    gap: ${theme.spacing(1)};
  `,
  navButton: css`
    min-width: 100px;
  `,
  quickActions: css`
    display: flex;
    gap: ${theme.spacing(1)};
    margin-left: ${theme.spacing(2)};
  `,
  currentContext: css`
    display: flex;
    align-items: center;
    gap: ${theme.spacing(1)};
    color: ${theme.colors.text.secondary};
    font-size: ${theme.typography.bodySmall.fontSize};
  `,
  contextText: css`
    max-width: 300px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  `,
});

export default NavigationBar;
