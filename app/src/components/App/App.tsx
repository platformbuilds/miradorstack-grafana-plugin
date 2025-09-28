import React from 'react';
import { Route, Routes } from 'react-router-dom';
import { AppRootProps } from '@grafana/data';
import { ROUTES } from '../../constants';
import DiscoverPage from '../../pages/Discover';
import SchemaPage from '../../pages/Schema';

function App(props: AppRootProps) {
  return (
    <Routes>
      <Route path={`/${ROUTES.Discover}`} element={<DiscoverPage {...props} />} />
      <Route path={`/${ROUTES.Schema}`} element={<SchemaPage {...props} />} />

      {/* Default page */}
      <Route path="*" element={<DiscoverPage {...props} />} />
    </Routes>
  );
}

export default App;
