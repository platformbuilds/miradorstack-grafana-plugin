import React, { Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import { AppRootProps } from '@grafana/data';
import { ROUTES } from '../../constants';
const DiscoverPage = React.lazy(() => import('../../pages/Discover'));
const SchemaPage = React.lazy(() => import('../../pages/Schema'));

function App(props: AppRootProps) {
  return (
    <Suspense fallback={null}>
      <Routes>
        <Route path={ROUTES.Discover} element={<DiscoverPage {...props} />} />
        <Route path={ROUTES.Schema} element={<SchemaPage {...props} />} />

        {/* Default page */}
        <Route path="*" element={<DiscoverPage {...props} />} />
      </Routes>
    </Suspense>
  );
}

export default App;
