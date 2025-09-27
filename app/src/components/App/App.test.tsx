import React, { Suspense } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { AppRootProps, PluginType } from '@grafana/data';
import { render, screen } from '@testing-library/react';
import App from './App';

jest.mock('../../pages/Discover', () => {
  const DiscoverMock = () => <div data-testid="discover-search-bar" />;
  DiscoverMock.displayName = 'DiscoverMock';
  return DiscoverMock;
});

describe('Components/App', () => {
  let props: AppRootProps;

  beforeEach(() => {
    jest.resetAllMocks();

    props = {
      basename: 'a/sample-app',
      meta: {
        id: 'sample-app',
        name: 'Sample App',
        type: PluginType.app,
        enabled: true,
        jsonData: {},
      },
      query: {},
      path: '',
      onNavChanged: jest.fn(),
    } as unknown as AppRootProps;
  });

  test('renders Discover by default', async () => {
    render(
      <Suspense fallback={null}>
        <MemoryRouter initialEntries={['/discover']}>
          <App {...props} />
        </MemoryRouter>
      </Suspense>
    );

    expect(await screen.findByTestId('discover-search-bar')).toBeInTheDocument();
  });
});
