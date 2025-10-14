import React from 'react';
import { PanelProps, FieldType, GraphSeriesXY } from '@grafana/data';
import { Graph } from '@grafana/ui';
import { Options } from './types';

interface Props extends PanelProps<Options> {}

export const MetricsPanel: React.FC<Props> = ({ data, width, height, timeRange, timeZone, options }) => {
  if (!data || !data.series.length) {
    return <div>No data</div>;
  }

  const timeField = data.series[0].fields.find((field) => field.type === FieldType.time);
  const valueField = data.series[0].fields.find((field) => field.type === FieldType.number);

  if (!timeField || !valueField) {
    return <div>Invalid data format</div>;
  }

  // Convert data to the format expected by Graph
  const graphData = Array.from({ length: timeField.values.length }, (_, i) => [
    timeField.values.get(i),
    valueField.values.get(i),
  ]);

  const series: GraphSeriesXY = {
    data: graphData,
    color: 'rgb(31, 120, 193)',
    label: valueField.name || 'Value',
    isVisible: true,
    yAxis: {
      index: 1,
    },
    timeField: timeField,
    valueField: valueField,
    timeStep: 0,
    seriesIndex: 0,
  };

  return (
    <Graph
      width={width}
      height={height}
      timeRange={timeRange}
      timeZone={timeZone}
      showLines={!options.showPoints}
      showPoints={options.showPoints}
      series={[series]}
    />
  );
};

export default MetricsPanel;