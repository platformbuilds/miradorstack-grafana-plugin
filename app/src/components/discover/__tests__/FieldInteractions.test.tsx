import React from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import DiscoverPage from '../../../pages/Discover';
import { PluginType, type AppRootProps } from '@grafana/data';

describe('Discover interactions', () => {
  const props: AppRootProps = {
    meta: {
      id: 'mirador-explorer',
      name: 'Mirador Explorer',
      type: PluginType.app,
    } as AppRootProps['meta'],
    basename: '/a/mirador-explorer',
    query: {},
    path: '',
    onNavChanged: jest.fn(),
  };

  let dateNowSpy: jest.SpyInstance<number, []>;

  beforeAll(() => {
    dateNowSpy = jest.spyOn(Date, 'now').mockReturnValue(Date.parse('2025-02-14T10:05:00.000Z'));

    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn(() => JSON.stringify([])),
        setItem: jest.fn(),
        removeItem: jest.fn(),
        clear: jest.fn(),
      },
      writable: true,
    });
  });

  afterAll(() => {
    dateNowSpy.mockRestore();
  });

  it('adds filter pills when quick filter clicked', async () => {
    render(<DiscoverPage {...props} />);

    const sidebar = await screen.findByTestId('discover-field-sidebar');

    const serviceField = await within(sidebar).findByText('service');
    const serviceRow = serviceField.closest('li');
    expect(serviceRow).not.toBeNull();
    const quickFilterButton = within(serviceRow as HTMLElement).getByLabelText(/Add filter for service/i);
    fireEvent.click(quickFilterButton);

    expect(await screen.findByText(/service exists/i)).toBeInTheDocument();
  });

  it('opens field stats overlay and applies value filter', async () => {
    render(<DiscoverPage {...props} />);

    const sidebar = await screen.findByTestId('discover-field-sidebar');
    const serviceField = await within(sidebar).findByText('service');
    const serviceRow = serviceField.closest('li');
    expect(serviceRow).not.toBeNull();

    const statsButton = within(serviceRow as HTMLElement).getByLabelText(/Show stats for service/i);
    fireEvent.click(statsButton);

    const modal = await screen.findByText(/Top values for service/i);
    expect(modal).toBeInTheDocument();

    const filterButtons = await screen.findAllByRole('button', { name: 'Filter' });
    fireEvent.click(filterButtons[0]);

    expect(await screen.findByText(/service is/i)).toBeInTheDocument();
  });
});
