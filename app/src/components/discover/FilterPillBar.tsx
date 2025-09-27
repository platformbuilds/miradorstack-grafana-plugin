import React from 'react';
import { Button, TagList, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';
import type { DiscoverFilter } from '../../types/discover';

interface FilterPillBarProps {
  filters: DiscoverFilter[];
  onRemove: (id: string) => void;
  onClear: () => void;
}

export const FilterPillBar: React.FC<FilterPillBarProps> = ({ filters, onRemove, onClear }) => {
  const styles = useStyles2(getStyles);
  if (filters.length === 0) {
    return null;
  }

  const labels = filters.map(
    (filter) => `${filter.field} ${filter.comparator}${filter.value ? ` ${filter.value}` : ''}`
  );
  const idByLabel = new Map(labels.map((label, index) => [label, filters[index].id]));

  return (
    <div className={styles.container} data-testid="discover-filter-pill-bar">
      <TagList
        tags={labels}
        onClick={(name) => {
          const id = idByLabel.get(name);
          if (id) {
            onRemove(id);
          }
        }}
      />
      <Button variant="secondary" size="sm" icon="trash-alt" onClick={onClear}>
        Clear filters
      </Button>
    </div>
  );
};

const getStyles = () => ({
  container: css`
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: var(--grafana-background-secondary);
    padding: 0.5rem 0.75rem;
    border-radius: 4px;
  `,
});
