import React, { Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import { AppRootProps } from '@grafana/data';
import { ROUTES } from '../../constants';
const DiscoverPage = React.lazy(() => import('../../pages/Discover'));
const PageTwo = React.lazy(() => import('../../pages/PageTwo'));
const PageThree = React.lazy(() => import('../../pages/PageThree'));
const PageFour = React.lazy(() => import('../../pages/PageFour'));

function App(props: AppRootProps) {
  return (
    <Suspense fallback={null}>
      <Routes>
        <Route path={ROUTES.Discover} element={<DiscoverPage {...props} />} />
        <Route path={ROUTES.Two} element={<PageTwo />} />
        <Route path={`${ROUTES.Three}/:id?`} element={<PageThree />} />

        {/* Full-width page (this page will have no side navigation) */}
        <Route path={ROUTES.Four} element={<PageFour />} />

        {/* Default page */}
        <Route path="*" element={<DiscoverPage {...props} />} />
      </Routes>
    </Suspense>
  );
}

export default App;
