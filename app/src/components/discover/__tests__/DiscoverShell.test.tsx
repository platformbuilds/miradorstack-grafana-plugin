import React from 'react';
import { render, screen } from '@testing-library/react';
import DiscoverPage from '../../../pages/Discover';
import { PluginType, type AppRootProps } from '@grafana/data';

describe('DiscoverPage', () => {
  const props: AppRootProps = {
    meta: {
      id: 'mirador-explorer',
      name: 'Mirador Explorer',
      type: PluginType.app,
      info: { author: { name: 'Miradorstack' } },
    } as AppRootProps['meta'],
    basename: '/a/mirador-explorer',
    query: {},
    path: '',
    onNavChanged: jest.fn(),
  };

  it('renders core discover primitives', () => {
    render(<DiscoverPage {...props} />);
    expect(screen.getByTestId('discover-search-bar')).toBeInTheDocument();
    expect(screen.getByTestId('discover-time-histogram')).toBeInTheDocument();
    expect(screen.getByTestId('discover-field-sidebar')).toBeInTheDocument();
    expect(screen.getByTestId('discover-document-table')).toBeInTheDocument();
  });
});
