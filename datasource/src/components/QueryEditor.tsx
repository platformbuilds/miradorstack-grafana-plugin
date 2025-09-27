import React, { ChangeEvent, useMemo, useState } from 'react';
import { QueryEditorProps, SelectableValue } from '@grafana/data';
import { Alert, Button, Stack, InlineField, Input, Combobox, TextArea } from '@grafana/ui';
import { DataSource } from '../datasource';
import { MiradorDataSourceOptions, MiradorQuery, QueryType } from '../types';
import { LuceneQueryBuilder } from './LuceneQueryBuilder';
import { validateLuceneQuery } from '../utils/lucene';

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

const DEFAULT_LOG_FIELDS = ['service', 'level', 'message', 'traceId'];

export function QueryEditor({ query, onChange, onRunQuery }: Props) {
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

  const onRawQueryChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    onChange({ ...query, query: event.target.value });
  };

  const { queryType = QueryType.Logs, query: queryString = '', queryLanguage = 'lucene', limit } = query;
  const showBuilder = (queryType === QueryType.Logs || queryType === QueryType.Traces) && queryLanguage === 'lucene';
  const [activeTab, setActiveTab] = useState<'builder' | 'raw'>(showBuilder ? 'builder' : 'raw');

  const fieldSuggestions = useMemo(
    () => (query.fields?.length ? query.fields : DEFAULT_LOG_FIELDS),
    [query.fields]
  );

  const validationErrors = useMemo(() => {
    if (!showBuilder) {
      return [];
    }
    return validateLuceneQuery(queryString);
  }, [queryString, showBuilder]);

  return (
    <Stack direction="column" gap={1}>
      <InlineField label="Query Type" labelWidth={12} tooltip="Select the Mirador data domain">
        <Combobox
          aria-label="mirador-query-type"
          options={QUERY_TYPE_OPTIONS.map(opt => ({ label: opt.label, value: String(opt.value) }))}
          value={String(queryType)}
          onChange={option => onQueryTypeChange({ value: option?.value as QueryType })}
        />
      </InlineField>

      <InlineField label="Language" labelWidth={12} tooltip="Lucene for logs/traces, PromQL for metrics">
        <Combobox
          aria-label="mirador-query-language"
          options={QUERY_LANGUAGE_OPTIONS.map(opt => ({ label: opt.label, value: String(opt.value) }))}
          value={String(queryLanguage)}
          onChange={option => onQueryLanguageChange({ value: option?.value as MiradorQuery['queryLanguage'] })}
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

      {showBuilder ? (
        <Stack direction="column" gap={1}>
          <Stack direction="row" gap={2}>
            <Button
              size="sm"
              variant={activeTab === 'builder' ? 'primary' : 'secondary'}
              onClick={() => setActiveTab('builder')}
            >
              Builder
            </Button>
            <Button
              size="sm"
              variant={activeTab === 'raw' ? 'primary' : 'secondary'}
              onClick={() => setActiveTab('raw')}
            >
              Raw
            </Button>
          </Stack>

          {activeTab === 'builder' ? (
            <>
              <LuceneQueryBuilder
                value={queryString}
                availableFields={fieldSuggestions}
                onChange={(newValue, usedFields) =>
                  onChange({ ...query, query: newValue, fields: usedFields })
                }
              />
              {validationErrors.length > 0 && (
                <Alert title="Query issues" severity="warning" className="gf-form-group">
                  <ul style={{ margin: 0, paddingLeft: '1.2rem' }}>
                    {validationErrors.map((error) => (
                      <li key={error}>{error}</li>
                    ))}
                  </ul>
                </Alert>
              )}
            </>
          ) : (
            <RawQueryEditor
              queryType={queryType}
              queryLanguage={queryLanguage}
              queryString={queryString}
              onChange={onRawQueryChange}
              onRunQuery={onRunQuery}
            />
          )}
        </Stack>
      ) : (
        <RawQueryEditor
          queryType={queryType}
          queryLanguage={queryLanguage}
          queryString={queryString}
          onChange={onRawQueryChange}
          onRunQuery={onRunQuery}
        />
      )}
    </Stack>
  );
}

interface RawQueryEditorProps {
  queryType: QueryType;
  queryLanguage: NonNullable<MiradorQuery['queryLanguage']>;
  queryString: string;
  onChange: (event: ChangeEvent<HTMLTextAreaElement>) => void;
  onRunQuery: () => void;
}

function RawQueryEditor({ queryType, queryLanguage, queryString, onChange, onRunQuery }: RawQueryEditorProps) {
  const placeholder = queryType === QueryType.Metrics ? 'rate(http_requests_total[5m])' : 'service:"payments"';

  return (
    <InlineField
      label={`${queryLanguage.toUpperCase()} Query`}
      labelWidth={12}
      grow
      tooltip={`Edit the ${queryLanguage.toUpperCase()} query directly`}
    >
      <TextArea
        aria-label="Raw query editor"
        value={queryString}
        placeholder={placeholder}
        onChange={onChange}
        onBlur={onRunQuery}
        rows={6}
      />
    </InlineField>
  );
}
