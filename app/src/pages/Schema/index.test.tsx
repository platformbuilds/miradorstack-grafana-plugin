import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AppRootProps, PluginType } from '@grafana/data';

import SchemaPage from './index';
import { testIds } from '../../components/testIds';
import { useSchema } from '../../hooks/useSchema';
import { SchemaApi } from '../../api/schema';

jest.mock('../../hooks/useSchema');
jest.mock('../../api/schema', () => {
  const actual = jest.requireActual('../../api/schema');
  return {
    ...actual,
    SchemaApi: jest.fn().mockImplementation(() => ({
      saveLogField: jest.fn().mockResolvedValue(undefined),
      saveMetric: jest.fn().mockResolvedValue(undefined),
      saveTraceService: jest.fn().mockResolvedValue(undefined),
    })),
  };
});

const mockedUseSchema = useSchema as jest.MockedFunction<typeof useSchema>;
const SchemaApiMock = SchemaApi as unknown as jest.Mock;

describe('Pages/Schema', () => {
  const createProps = (jsonData?: Record<string, unknown>): AppRootProps =>
    ({
      basename: 'a/mirador',
      meta: {
        id: 'mirador-app',
        name: 'Mirador Explorer',
        type: PluginType.app,
        enabled: true,
        jsonData: jsonData ?? { datasourceUid: 'uid-123' },
      },
      path: '',
      query: {},
      onNavChanged: jest.fn(),
    } as unknown as AppRootProps);

  beforeEach(() => {
    mockedUseSchema.mockReset();
    SchemaApiMock.mockClear();
  });

  it('shows datasource warning when UID is missing', () => {
    mockedUseSchema.mockReturnValue({
      logs: undefined,
      metrics: undefined,
      traces: undefined,
      loading: false,
      error: undefined,
      reload: jest.fn(),
      hasDatasource: false,
    });

    render(<SchemaPage {...createProps({})} />);

    expect(screen.getByText(/Datasource missing/i)).toBeInTheDocument();
    expect(screen.getByTestId(testIds.schemaPage.reload)).toBeDisabled();
  });

  it('renders schema details and filters by user input', () => {
    const reload = jest.fn();
    mockedUseSchema.mockReturnValue({
      logs: {
        version: '2025-01-01',
        fields: [
          {
            name: 'service',
            type: 'keyword',
            description: 'Service name',
            examples: ['payments'],
            aggregatable: true,
            filterable: true,
          },
          {
            name: 'traceId',
            type: 'keyword',
          },
        ],
      },
      metrics: {
        version: '2025-02-01',
        metrics: [
          {
            name: 'http_requests_total',
            type: 'counter',
            unit: 'requests',
            labels: ['service'],
            aggregations: ['sum'],
          },
        ],
      },
      traces: {
        version: '2025-03-01',
        services: [
          {
            name: 'checkout',
            operations: [
              {
                name: 'GET /health',
                spanKinds: ['server'],
                description: 'Health check handler',
              },
            ],
          },
        ],
      },
      loading: false,
      error: undefined,
      reload,
      hasDatasource: true,
    });

    render(<SchemaPage {...createProps()} />);

    expect(screen.getByText('service')).toBeInTheDocument();
    expect(screen.getByText(/Schema version: 2025-01-01/)).toBeInTheDocument();

    const searchInput = screen.getByTestId(testIds.schemaPage.search) as HTMLInputElement;
    fireEvent.change(searchInput, { target: { value: 'http' } });

    expect(screen.getByText(/No schema entries match your filter/i)).toBeInTheDocument();

    fireEvent.click(screen.getByTestId(testIds.schemaPage.tabMetrics));

    expect(screen.getByText('http_requests_total')).toBeInTheDocument();
    expect(screen.getByText(/Schema version: 2025-02-01/)).toBeInTheDocument();

    fireEvent.click(screen.getByTestId(testIds.schemaPage.reload));
    expect(reload).toHaveBeenCalled();
  });

  it('allows adding a log field through the editor', async () => {
    const reload = jest.fn();
    const apiInstance = {
      saveLogField: jest.fn().mockResolvedValue(undefined),
      saveMetric: jest.fn(),
      saveTraceService: jest.fn(),
    };
    SchemaApiMock.mockReturnValue(apiInstance);

    mockedUseSchema.mockReturnValue({
      logs: { version: 'v1', fields: [] },
      metrics: { version: 'v1', metrics: [] },
      traces: { version: 'v1', services: [] },
      loading: false,
      error: undefined,
      reload,
      hasDatasource: true,
    });

    render(<SchemaPage {...createProps()} />);

    fireEvent.click(screen.getByText(/New log field/i));

    fireEvent.change(screen.getByPlaceholderText('service'), { target: { value: 'component' } });

    fireEvent.click(screen.getByRole('button', { name: /save/i }));

    await waitFor(() =>
      expect(apiInstance.saveLogField).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'component' })
      )
    );
    await waitFor(() => expect(reload).toHaveBeenCalled());
  });

  it('surfaces backend errors when present', () => {
    mockedUseSchema.mockReturnValue({
      logs: undefined,
      metrics: undefined,
      traces: undefined,
      loading: false,
      error: 'Upstream error',
      reload: jest.fn(),
      hasDatasource: true,
    });

    render(<SchemaPage {...createProps()} />);

    expect(screen.getByText(/Unable to load schema/i)).toBeInTheDocument();
    expect(screen.getByText(/Upstream error/)).toBeInTheDocument();
  });
});
