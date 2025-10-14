import React from 'react';
import { PanelProps, DataFrame } from '@grafana/data';
import { Table } from '@grafana/ui';
import { Options } from './types';

interface Props extends PanelProps<Options> {}

export const TracesPanel: React.FC<Props> = ({ data, width, height }) => {
  if (!data || !data.series.length) {
    return <div>No traces data</div>;
  }

  const frame = data.series[0];
  
  return (
    <div style={{ width, height, overflow: 'auto' }}>
      <Table
        data={frame}
        width={width}
        height={height}
      />
    </div>
  );
};

export default TracesPanel;