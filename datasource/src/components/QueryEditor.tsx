import React, { ChangeEvent } from 'react';
import { QueryEditorProps, SelectableValue } from '@grafana/data';
import { InlineField, Input, Select, Stack } from '@grafana/ui';
import { DataSource } from '../datasource';
import { MiradorDataSourceOptions, MiradorQuery, QueryType } from '../types';

type Props = QueryEditorProps<DataSource, MiradorQuery, MiradorDataSourceOptions>;

const QUERY_TYPE_OPTIONS: Array<SelectableValue<QueryType>> = [
  { value: QueryType.Logs, label: 'Logs' },
  { value: QueryType.Metrics, label: 'Metrics' },
  { value: QueryType.Traces, label: 'Traces' },
];

const QUERY_LANGUAGE_OPTIONS: Array<SelectableValue<NonNullable<MiradorQuery['queryLanguage']>>> = [
  { value: 'lucene', label: 'Lucene' },
  { value: 'promql', label: 'PromQL' },
];

export function QueryEditor({ query, onChange, onRunQuery }: Props) {
  const onQueryStringChange = (event: ChangeEvent<HTMLInputElement>) => {
    onChange({ ...query, query: event.target.value });
  };

  const onQueryTypeChange = (option: SelectableValue<QueryType>) => {
    if (!option.value) {
      return;
    }

    onChange({ ...query, queryType: option.value });
    onRunQuery();
  };

  const onQueryLanguageChange = (
    option: SelectableValue<NonNullable<MiradorQuery['queryLanguage']>>
  ) => {
    if (!option.value) {
      return;
    }

    onChange({ ...query, queryLanguage: option.value });
  };

  const onLimitChange = (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value.trim();
    onChange({ ...query, limit: value ? Number(value) : undefined });
  };

  const { queryType = QueryType.Logs, query: queryString = '', queryLanguage = 'lucene', limit } = query;

  return (
    <Stack direction="column" gap={1}>
      <InlineField label="Query Type" labelWidth={12} tooltip="Select the Mirador data domain">
        <Select
          inputId="mirador-query-type"
          options={QUERY_TYPE_OPTIONS}
          onChange={onQueryTypeChange}
          value={QUERY_TYPE_OPTIONS.find((option) => option.value === queryType) ?? QUERY_TYPE_OPTIONS[0]}
        />
      </InlineField>

      <InlineField label="Query" labelWidth={12} grow tooltip="Enter Lucene or PromQL based on the selected type">
        <Input
          id="mirador-query-string"
          onChange={onQueryStringChange}
          onBlur={onRunQuery}
          value={queryString}
          placeholder={queryType === QueryType.Metrics ? 'rate(http_requests_total[5m])' : 'service:"payments"'}
        />
      </InlineField>

      <InlineField label="Language" labelWidth={12} tooltip="Lucene for logs/traces, PromQL for metrics">
        <Select
          inputId="mirador-query-language"
          options={QUERY_LANGUAGE_OPTIONS}
          onChange={onQueryLanguageChange}
          value={QUERY_LANGUAGE_OPTIONS.find((option) => option.value === queryLanguage)}
        />
      </InlineField>

      <InlineField label="Limit" labelWidth={12} tooltip="Optional maximum number of returned records">
        <Input
          id="mirador-query-limit"
          onChange={onLimitChange}
          type="number"
          value={limit ?? ''}
          placeholder="500"
          min={1}
        />
      </InlineField>
    </Stack>
  );
}
