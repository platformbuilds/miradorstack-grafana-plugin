import React, { useMemo, useState } from 'react';
import { Button, Drawer, Field, Input, Select, TextArea, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';
import type { DiscoverFilter, FilterComparator, SavedFilterGroup } from '../../types/discover';

interface AdvancedFiltersPanelProps {
  isOpen: boolean;
  onClose: () => void;
  filters: DiscoverFilter[];
  savedGroups: SavedFilterGroup[];
  onAddFilter: (filter: Omit<DiscoverFilter, 'id'>) => void;
  onSaveGroup: (group: { id?: string; name: string; description?: string }) => void;
  onLoadGroup: (id: string) => void;
  onDeleteGroup: (id: string) => void;
}

const COMPARATOR_OPTIONS = [
  { label: 'is', value: 'is' },
  { label: 'is not', value: 'is_not' },
  { label: 'contains', value: 'contains' },
  { label: 'exists', value: 'exists' },
  { label: 'range', value: 'range' },
] as const;

export const AdvancedFiltersPanel: React.FC<AdvancedFiltersPanelProps> = ({
  isOpen,
  onClose,
  filters,
  savedGroups,
  onAddFilter,
  onSaveGroup,
  onLoadGroup,
  onDeleteGroup,
}) => {
  const styles = useStyles2(getStyles);
  const [field, setField] = useState('service');
  const [comparator, setComparator] = useState<FilterComparator>('is');
  const [value, setValue] = useState('');
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');

  const comparatorOptions = useMemo(() => COMPARATOR_OPTIONS.map(({ label, value }) => ({ label, value })), []);

  if (!isOpen) {
    return null;
  }

  return (
    <Drawer title="Advanced filters" onClose={onClose} size="md">
      <div className={styles.container}>
        <section>
          <h4>Create filter</h4>
          <div className={styles.row}>
            <Field label="Field" className={styles.field}>
              <Input value={field} onChange={(event) => setField(event.currentTarget.value)} />
            </Field>
            <Field label="Comparator" className={styles.field}>
              <Select
                options={comparatorOptions}
                value={comparatorOptions.find((option) => option.value === comparator)}
                onChange={(option) => setComparator((option?.value as FilterComparator) ?? 'is')}
              />
            </Field>
            {comparator !== 'exists' && (
              <Field label="Value" className={styles.field}>
                <Input value={value} onChange={(event) => setValue(event.currentTarget.value)} />
              </Field>
            )}
            <Button
              icon="plus"
              onClick={() => {
                onAddFilter({ field, comparator, value: value || undefined });
                setValue('');
              }}
            >
              Add filter
            </Button>
          </div>
        </section>

        <section>
          <h4>Saved groups</h4>
          {savedGroups.length === 0 ? (
            <p>No saved filters yet.</p>
          ) : (
            <ul className={styles.groupList}>
              {savedGroups.map((group) => (
                <li key={group.id} className={styles.groupItem}>
                  <div>
                    <strong>{group.name}</strong>
                    {group.description && <p>{group.description}</p>}
                  </div>
                  <div className={styles.groupActions}>
                    <Button size="sm" onClick={() => onLoadGroup(group.id)}>
                      Load
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => onDeleteGroup(group.id)}>
                      Delete
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <h4>Save current filters</h4>
          <div className={styles.column}>
            <Field label="Name">
              <Input value={groupName} onChange={(event) => setGroupName(event.currentTarget.value)} />
            </Field>
            <Field label="Description">
              <TextArea value={groupDescription} onChange={(event) => setGroupDescription(event.currentTarget.value)} />
            </Field>
            <Button
              icon="save"
              onClick={() => {
                if (!groupName) {
                  return;
                }
                onSaveGroup({ id: undefined, name: groupName, description: groupDescription });
                setGroupName('');
                setGroupDescription('');
              }}
              disabled={filters.length === 0 || !groupName}
            >
              Save filters
            </Button>
          </div>
        </section>
      </div>
    </Drawer>
  );
};

const getStyles = () => ({
  container: css`
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    padding-right: 0.5rem;
  `,
  row: css`
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
    align-items: flex-end;
  `,
  column: css`
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  `,
  field: css`
    min-width: 180px;
  `,
  groupList: css`
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  `,
  groupItem: css`
    display: flex;
    justify-content: space-between;
    gap: 0.75rem;
    align-items: center;
    flex-wrap: wrap;
  `,
  groupActions: css`
    display: flex;
    gap: 0.5rem;
  `,
});
