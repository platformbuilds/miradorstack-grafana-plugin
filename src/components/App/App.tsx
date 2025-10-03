import React from 'react';
import { Route, Routes } from 'react-router-dom';
import { AppRootProps } from '@grafana/data';
import { ROUTES } from '../../constants';
import { NavigationProvider } from '../../contexts/NavigationContext';
import { LogsProvider } from '../../contexts/LogsContext';
const ExplorerPage = React.lazy(() => import('../../pages/PageOne'));
const SchemaPage = React.lazy(() => import('../../pages/PageTwo'));
const PageThree = React.lazy(() => import('../../pages/PageThree'));
const PageFour = React.lazy(() => import('../../pages/PageFour'));
const DiscoverPage = React.lazy(() => import('../../pages/Discover'));
const ReportsPage = React.lazy(() => import('../../pages/Reports'));
const AIInsightsPage = React.lazy(() => import('../../pages/AIInsights'));

function App(props: AppRootProps) {
  return (
    <NavigationProvider>
      <Routes>
        <Route path={ROUTES.Discover} element={<LogsProvider><DiscoverPage /></LogsProvider>} />
        <Route path={`${ROUTES.Discover}/*`} element={<LogsProvider><DiscoverPage /></LogsProvider>} />
        <Route path={ROUTES.Reports} element={<ReportsPage />} />
        <Route path={ROUTES.AIInsights} element={<AIInsightsPage />} />
        <Route path={ROUTES.Schema} element={<SchemaPage />} />
        <Route path={`${ROUTES.Three}/:id?`} element={<PageThree />} />

        {/* Full-width page (this page will have no side navigation) */}
        <Route path={ROUTES.Four} element={<PageFour />} />

        {/* Default page */}
        <Route path="/" element={<ExplorerPage />} />
        <Route path="" element={<ExplorerPage />} />
        <Route path="*" element={<ExplorerPage />} />
      </Routes>
    </NavigationProvider>
  );
}

export default App;
