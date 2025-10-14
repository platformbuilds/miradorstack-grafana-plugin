import React from 'react';
import { Select, Input } from '@grafana/ui';
import { SelectableValue } from '@grafana/data';
import { QueryEditorProps } from './types';

export const QueryEditor: React.FC<QueryEditorProps> = ({
  query,
  onChange,
  onRunQuery,
}) => {
  const queryTypes: Array<SelectableValue<string>> = [
    { label: 'Metrics', value: 'metrics' },
    { label: 'Logs', value: 'logs' },
    { label: 'Traces', value: 'traces' },
  ];

  const onQueryTypeChange = (value: SelectableValue<string>) => {
    onChange({ ...query, queryType: value.value || 'metrics' });
    onRunQuery();
  };

  const onExprChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ ...query, expr: event.target.value });
  };

  return (
    <div className="gf-form">
      <Select
        options={queryTypes}
        value={queryTypes.find((qType) => qType.value === query.queryType)}
        onChange={onQueryTypeChange}
        width={20}
      />
      <div className="gf-form gf-form--grow">
        <Input
          value={query.expr || ''}
          onChange={onExprChange}
          onBlur={onRunQuery}
          placeholder="Enter query expression"
        />
      </div>
    </div>
  );
};

export default QueryEditor;