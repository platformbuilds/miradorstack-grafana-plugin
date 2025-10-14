import React from 'react';
import { PanelProps, dateTime } from '@grafana/data';
import { Options } from './types';

interface Props extends PanelProps<Options> {}

export const LogsPanel: React.FC<Props> = ({ data, width, height }) => {
  if (!data || !data.series.length) {
    return <div>No logs data</div>;
  }

  const frame = data.series[0];
  const timeField = frame.fields.find((field) => field.type === 'time');
  const messageField = frame.fields.find((field) => field.name === 'message');
  const levelField = frame.fields.find((field) => field.name === 'level');

  if (!timeField || !messageField) {
    return <div>Invalid logs format</div>;
  }

  const rows = Array.from({ length: frame.length }, (_, i) => {
    const timestamp = timeField.values.get(i);
    const message = messageField.values.get(i);
    const level = levelField ? levelField.values.get(i) : 'info';
    const time = dateTime(timestamp);

    return {
      time: time.format('YYYY-MM-DD HH:mm:ss'),
      level,
      message,
    };
  });

  return (
    <div style={{ width, height, overflow: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #555' }}>Time</th>
            <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #555' }}>Level</th>
            <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #555' }}>Message</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} style={{ borderBottom: '1px solid #333' }}>
              <td style={{ padding: '8px', whiteSpace: 'nowrap' }}>{row.time}</td>
              <td style={{ padding: '8px', whiteSpace: 'nowrap' }}>{row.level}</td>
              <td style={{ padding: '8px', wordBreak: 'break-all' }}>{row.message}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default LogsPanel;