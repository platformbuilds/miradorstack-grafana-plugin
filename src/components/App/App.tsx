import React from 'react';
import { Route, Routes } from 'react-router-dom';
import { AppRootProps } from '@grafana/data';
import { ROUTES } from '../../constants';
const ExplorerPage = React.lazy(() => import('../../pages/PageOne'));
const SchemaPage = React.lazy(() => import('../../pages/PageTwo'));
const PageThree = React.lazy(() => import('../../pages/PageThree'));
const PageFour = React.lazy(() => import('../../pages/PageFour'));

function App(props: AppRootProps) {
  return (
    <Routes>
      <Route path={ROUTES.Schema} element={<SchemaPage />} />
      <Route path={`${ROUTES.Three}/:id?`} element={<PageThree />} />

      {/* Full-width page (this page will have no side navigation) */}
      <Route path={ROUTES.Four} element={<PageFour />} />

      {/* Default page */}
      <Route path="*" element={<ExplorerPage />} />
    </Routes>
  );
}

export default App;
