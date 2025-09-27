import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Button, Stack, Icon, IconButton, InlineField, Input, Combobox } from '@grafana/ui';
import type { SelectableValue } from '@grafana/data';

import {
  LuceneClause,
  LuceneComparator,
  buildLuceneQuery,
  generateClauseId,
  parseLuceneQuery,
} from '../utils/lucene';

const CLAUSE_OPERATORS: Array<SelectableValue<LuceneComparator>> = [
  { value: 'is', label: 'is' },
  { value: 'is_not', label: 'is not' },
  { value: 'contains', label: 'contains' },
  { value: 'exists', label: 'exists' },
  { value: 'not_exists', label: 'not exists' },
];

const CONNECTORS: Array<SelectableValue<'AND' | 'OR'>> = [
  { value: 'AND', label: 'AND' },
  { value: 'OR', label: 'OR' },
];

export interface LuceneQueryBuilderProps {
  value: string;
  availableFields: string[];
  onChange: (value: string, fields: string[]) => void;
  disabled?: boolean;
}

const DEFAULT_FIELDS = ['service', 'level', 'message', 'traceId', 'tenant', 'environment'];

export const LuceneQueryBuilder: React.FC<LuceneQueryBuilderProps> = ({ value, availableFields, onChange, disabled }) => {
  const fields = useMemo(() => {
    if (availableFields?.length) {
      return Array.from(new Set([...availableFields, ...DEFAULT_FIELDS]));
    }
    return DEFAULT_FIELDS;
  }, [availableFields]);

  const [clauses, setClauses] = useState<LuceneClause[]>(() => parseLuceneQuery(value).clauses);
  const [operator, setOperator] = useState<'AND' | 'OR'>(() => parseLuceneQuery(value).operator);
  const isInternalUpdate = useRef(false);

  useEffect(() => {
    if (isInternalUpdate.current) {
      isInternalUpdate.current = false;
      return;
    }
    const parsed = parseLuceneQuery(value);
    setClauses(parsed.clauses);
    setOperator(parsed.operator);
  }, [value]);

  const emitChange = (nextClauses: LuceneClause[], nextOperator = operator) => {
    isInternalUpdate.current = true;
    const updatedQuery = buildLuceneQuery(nextClauses, nextOperator);
    const usedFields = nextClauses.map((clause) => clause.field).filter(Boolean);
    onChange(updatedQuery, usedFields);
  };

  const updateClause = (id: string, patch: Partial<LuceneClause>) => {
    const next = clauses.map((clause) => (clause.id === id ? { ...clause, ...patch } : clause));
    setClauses(next);
    emitChange(next);
  };

  const removeClause = (id: string) => {
    const next = clauses.filter((clause) => clause.id !== id);
    setClauses(next);
    emitChange(next);
  };

  const addClause = () => {
    const defaultField = fields[0] ?? '';
    const clause: LuceneClause = {
      id: generateClauseId(),
      field: defaultField,
      comparator: 'is',
      value: '',
    };
    const next = [...clauses, clause];
    setClauses(next);
    emitChange(next);
  };

  const handleOperatorChange = (nextOperator: 'AND' | 'OR') => {
    setOperator(nextOperator);
    emitChange(clauses, nextOperator);
  };

  return (
    <Stack direction="column" gap={1} data-testid="lucene-builder">
      {clauses.map((clause) => {
        const clauseOperators = clause.comparator === 'exists' || clause.comparator === 'not_exists'
          ? CLAUSE_OPERATORS.filter((item) => item.value === clause.comparator)
          : CLAUSE_OPERATORS;

        return (
          <Stack key={clause.id} direction="row" gap={2} alignItems="flex-start">
            <InlineField label="Field" transparent grow>
              <Combobox
                aria-label={`Field for clause ${clause.id}`}
                options={fields.map((field) => ({ label: field, value: field }))}
                value={clause.field}
                onChange={(option) => updateClause(clause.id, { field: option?.value ?? '', value: clause.value })}
                width={24}
                disabled={disabled}
              />
            </InlineField>
            <InlineField label="Operator" transparent>
              <Combobox
                aria-label={`Operator for clause ${clause.id}`}
                options={clauseOperators.filter((op) => op.value !== undefined).map(op => ({ label: op.label, value: String(op.value) }))}
                value={clause.comparator}
                onChange={(option) =>
                  updateClause(clause.id, {
                    comparator: option?.value as LuceneComparator ?? clause.comparator,
                    value: option?.value === 'exists' || option?.value === 'not_exists' ? undefined : clause.value,
                  })
                }
                width={16}
                disabled={disabled}
              />
            </InlineField>
            {clause.comparator !== 'exists' && clause.comparator !== 'not_exists' && (
              <InlineField label="Value" transparent grow>
                <Input
                  aria-label={`Value for clause ${clause.id}`}
                  value={clause.value ?? ''}
                  placeholder="Enter value"
                  width={40}
                  onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                    updateClause(clause.id, { value: event.target.value })
                  }
                  disabled={disabled}
                />
              </InlineField>
            )}
            <IconButton
              name="trash-alt"
              aria-label={`Remove clause ${clause.id}`}
              onClick={() => removeClause(clause.id)}
              disabled={disabled}
            />
          </Stack>
        );
      })}

  <Stack direction="row" gap={2} justifyContent="space-between" alignItems="center">
  <Stack direction="row" gap={2}>
          <Button icon="plus" onClick={addClause} disabled={disabled}>
            Add filter
          </Button>
          <InlineField label="Join with" transparent>
            <Combobox
              aria-label="Join operator"
              options={CONNECTORS.filter((op) => op.value !== undefined).map(op => ({ label: op.label, value: String(op.value) }))}
              value={operator}
              onChange={(option) => handleOperatorChange((option?.value as 'AND' | 'OR') ?? operator)}
              width={10}
              disabled={disabled}
            />
          </InlineField>
  </Stack>
  <Stack direction="row" gap={2}>
          <Icon name="info-circle" />
          <span style={{ fontSize: '12px' }}>Preview updates automatically</span>
  </Stack>
  </Stack>

      <InlineField label="Preview" transparent grow>
        <textarea
          aria-label="Lucene query preview"
          value={buildLuceneQuery(clauses, operator)}
          readOnly
          style={{ width: '100%', minHeight: 80, fontFamily: 'monospace' }}
        />
      </InlineField>
    </Stack>
  );
};
