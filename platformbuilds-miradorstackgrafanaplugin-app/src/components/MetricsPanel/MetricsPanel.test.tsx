import React from 'react';
import { render, screen } from '@testing-library/react';
import { MetricsPanel } from './MetricsPanel';
import {
  createDataFrame,
  FieldType,
  LoadingState,
  dateTime,
  PanelProps,
} from '@grafana/data';
import { Options } from './types';

describe('MetricsPanel', () => {
  const mockData = {
    series: [
      createDataFrame({
        fields: [
          {
            name: 'time',
            type: FieldType.time,
            values: [1633027200000, 1633027500000],
          },
          {
            name: 'value',
            type: FieldType.number,
            values: [100, 200],
          },
        ],
      }),
    ],
    state: LoadingState.Done,
    timeRange: {
      from: dateTime(1633027200000),
      to: dateTime(1633027500000),
      raw: {
        from: 'now-1h',
        to: 'now',
      },
    },
  };

  const baseProps: PanelProps<Options> = {
    id: 1,
    data: mockData,
    timeRange: mockData.timeRange,
    timeZone: 'browser',
    width: 800,
    height: 600,
    options: { showLegend: true, showPoints: false },
    transparent: false,
    renderCounter: 0,
    title: 'Metrics Panel',
    fieldConfig: { defaults: {}, overrides: [] },
    eventBus: {
      subscribe: jest.fn(),
      publish: jest.fn(),
      getStream: jest.fn(),
      removeAllListeners: jest.fn(),
      newScopedBus: jest.fn(),
    },
    replaceVariables: (str: string) => str,
    onOptionsChange: jest.fn(),
    onFieldConfigChange: jest.fn(),
    onChangeTimeRange: jest.fn(),
  };

  it('renders without crashing', () => {
    render(<MetricsPanel {...baseProps} />);
  });

  it('shows no data message when data is empty', () => {
    render(
      <MetricsPanel
        {...baseProps}
        data={{
          ...mockData,
          series: [],
        }}
      />
    );
    expect(screen.getByText('No data')).toBeInTheDocument();
  });
});