import React, { ChangeEvent } from 'react';
import { QueryEditorProps } from '@grafana/data';
import { Input, Select } from '@grafana/ui';
import { MiradorDataSource } from './MiradorDataSource';
import { MiradorQuery } from './MiradorDataSource';

type Props = QueryEditorProps<MiradorDataSource, MiradorQuery, any>;

export function QueryEditor(props: Props) {
  const { query, onChange, onRunQuery } = props;

  const onQueryTypeChange = (value: string) => {
    onChange({ ...query, queryType: value as any });
  };

  const onQueryChange = (event: ChangeEvent<HTMLInputElement>) => {
    onChange({ ...query, query: event.target.value });
  };

  const onQueryLanguageChange = (value: string) => {
    onChange({ ...query, queryLanguage: value as any });
  };

  const onLimitChange = (event: ChangeEvent<HTMLInputElement>) => {
    onChange({ ...query, limit: parseInt(event.target.value, 10) });
  };

  return (
    <div>
      <div style={{ marginBottom: '8px' }}>
        <Select
          options={[
            { label: 'Metrics', value: 'metrics' },
            { label: 'Logs', value: 'logs' },
            { label: 'Traces', value: 'traces' },
            { label: 'RCA', value: 'rca' },
          ]}
          value={query.queryType || 'logs'}
          onChange={(e) => onQueryTypeChange(e.value!)}
          placeholder="Select query type"
        />
      </div>
      <div style={{ marginBottom: '8px' }}>
        <Input
          label="Query"
          placeholder="Enter your query"
          value={query.query || ''}
          onChange={onQueryChange}
          onBlur={onRunQuery}
          width={50}
        />
      </div>
      {(query.queryType === 'logs' || query.queryType === 'traces') && (
        <div style={{ marginBottom: '8px' }}>
          <Select
            options={[
              { label: 'Lucene', value: 'lucene' },
              { label: 'LogSQL', value: 'logsql' },
            ]}
            value={query.queryLanguage || 'lucene'}
            onChange={(e) => onQueryLanguageChange(e.value!)}
            placeholder="Select query language"
          />
        </div>
      )}
      {query.queryType === 'logs' && (
        <div style={{ marginBottom: '8px' }}>
          <Input
            label="Limit"
            type="number"
            value={query.limit || 1000}
            onChange={onLimitChange}
            onBlur={onRunQuery}
            width={20}
          />
        </div>
      )}
    </div>
  );
}