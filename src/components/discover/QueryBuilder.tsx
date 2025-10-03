import React, { useState, useEffect } from 'react';
import { Select, Input, Button, IconButton } from '@grafana/ui';
import { SelectableValue } from '@grafana/data';
import { MiradorAPIClient } from '../../datasource/api/MiradorAPIClient';
import { getDataSourceSrv } from '@grafana/runtime';
import { QueryMode } from '../../pages/Discover';

interface QueryFilter {
  id: number;
  field: string | null;
  operator: string | null;
  value: string;
}

interface QueryBuilderProps {
  onQueryChange: (query: string) => void;
  queryMode: QueryMode;
}

const operators: Array<SelectableValue<string>> = [
  { label: '=', value: ':' },
  { label: '!=', value: '!=' },
  { label: '>', value: '>' },
  { label: '<', value: '<' },
  { label: '>=', value: '>=' },
  { label: '<=', value: '<=' },
  { label: 'contains', value: '~' },
  { label: 'does not contain', value: '!~' },
];

export const QueryBuilder: React.FC<QueryBuilderProps> = ({ onQueryChange, queryMode }) => {
  const [filters, setFilters] = useState<QueryFilter[]>([{ id: 1, field: null, operator: ':', value: '' }]);
  const [logFields, setLogFields] = useState<Array<SelectableValue<string>>>([]);
  const [apiClient, setApiClient] = useState<MiradorAPIClient | null>(null);

  useEffect(() => {
    const initializeApiClient = async () => {
      try {
        const dataSourceSrv = getDataSourceSrv();
        const dataSource = await dataSourceSrv.get('Mirador Core Connector');
        if (dataSource && (dataSource as any).apiClient) {
          setApiClient((dataSource as any).apiClient);
        }
      } catch (error) {
        console.error('Failed to get data source:', error);
      }
    };
    initializeApiClient();
  }, []);

  useEffect(() => {
    if (apiClient && queryMode === 'builder') {
      apiClient.getLogFields()
        .then(response => {
          const fields = response.data.fields.map((field: string) => ({ label: field, value: field }));
          setLogFields(fields);
        })
        .catch(error => {
          console.error('Failed to fetch log fields:', error);
        });
    }
  }, [apiClient, queryMode]);

  const handleFilterChange = (index: number, updatedFilter: Partial<QueryFilter>) => {
    const newFilters = [...filters];
    newFilters[index] = { ...newFilters[index], ...updatedFilter };
    setFilters(newFilters);
    updateQuery(newFilters);
  };

  const addFilter = () => {
    setFilters([...filters, { id: Date.now(), field: null, operator: ':', value: '' }]);
  };

  const removeFilter = (id: number) => {
    const newFilters = filters.filter(filter => filter.id !== id);
    setFilters(newFilters);
    updateQuery(newFilters);
  };

  const updateQuery = (currentFilters: QueryFilter[]) => {
    const query = currentFilters
      .filter(f => f.field && f.value)
      .map(f => `${f.field}${f.operator}"${f.value}"`)
      .join(' AND ');
    onQueryChange(query);
  };

  return (
    <div style={{ opacity: queryMode === 'raw' ? 0.5 : 1 }}>
      {filters.map((filter, index) => (
        <div key={filter.id} style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
          <Select
            width={25}
            options={logFields}
            value={filter.field}
            onChange={v => handleFilterChange(index, { field: v.value })}
            placeholder="Select field"
            disabled={queryMode === 'raw'}
          />
          <Select
            width={15}
            options={operators}
            value={filter.operator}
            onChange={v => handleFilterChange(index, { operator: v.value })}
            disabled={queryMode === 'raw'}
          />
          <Input
            width={30}
            value={filter.value}
            onChange={e => handleFilterChange(index, { value: e.currentTarget.value })}
            placeholder="Value"
            disabled={queryMode === 'raw'}
          />
          <IconButton
            aria-label="Remove filter"
            name="trash-alt"
            onClick={() => removeFilter(filter.id)}
            disabled={filters.length === 1 || queryMode === 'raw'}
          />
        </div>
      ))}
      <Button onClick={addFilter} icon="plus" variant="secondary" disabled={queryMode === 'raw'}>
        Add Filter
      </Button>
    </div>
  );
};
