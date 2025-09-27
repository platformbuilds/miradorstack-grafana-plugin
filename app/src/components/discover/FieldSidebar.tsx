import React, { useMemo, useState } from 'react';
import { Button, Icon, Input, Select, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';
import { filterFieldStats } from '../../utils/fieldStats';
import type { FieldStat } from '../../types/discover';

interface FieldSidebarProps {
  stats: FieldStat[];
  pinnedFields: string[];
  onTogglePin: (field: string) => void;
  onAddFilter: (field: string, value?: string) => void;
  onShowStats: (field: string) => void;
}

const SORT_OPTIONS = [
  { label: 'Most frequent', value: 'count' },
  { label: 'Alphabetical', value: 'alpha' },
] as const;

export const FieldSidebar: React.FC<FieldSidebarProps> = ({
  stats,
  pinnedFields,
  onTogglePin,
  onAddFilter,
  onShowStats,
}) => {
  const styles = useStyles2(getStyles);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<typeof SORT_OPTIONS[number]['value']>('count');

  const visibleStats = useMemo(() => filterFieldStats(stats, search, sort), [stats, search, sort]);

  return (
    <aside className={styles.container} data-testid="discover-field-sidebar">
      <div className={styles.controls}>
        <Input
          placeholder="Search fields"
          value={search}
          onChange={(event) => setSearch(event.currentTarget.value)}
        />
        <Select
          aria-label="Sort fields"
          options={SORT_OPTIONS.map(({ label, value }) => ({ label, value }))}
          value={SORT_OPTIONS.find((option) => option.value === sort)}
          onChange={(option) => setSort((option?.value as typeof sort) ?? 'count')}
        />
      </div>
      <ul className={styles.list}>
        {visibleStats.map((stat) => {
          const pinned = pinnedFields.includes(stat.name);
          return (
            <li key={stat.name} className={styles.item}>
              <div>
                <strong>{stat.name}</strong>
                <div className={styles.meta}>
                  <span>{stat.type}</span>
                  <span>{stat.count} hits</span>
                </div>
                {stat.examples.length > 0 && (
                  <div className={styles.examples}>
                    {stat.examples.slice(0, 3).map((value) => (
                      <button
                        key={String(value)}
                        className={styles.exampleButton}
                        onClick={() => onAddFilter(stat.name, String(value))}
                      >
                        {String(value)}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className={styles.actions}>
                <Button
                  type="button"
                  icon={pinned ? 'favorite' : 'star'}
                  variant="secondary"
                  size="sm"
                  onClick={() => onTogglePin(stat.name)}
                  aria-label={pinned ? `Unpin ${stat.name}` : `Pin ${stat.name}`}
                />
                <Button
                  type="button"
                  icon="plus"
                  variant="secondary"
                  size="sm"
                  onClick={() => onAddFilter(stat.name)}
                  aria-label={`Add filter for ${stat.name}`}
                />
                <Button
                  type="button"
                  icon="chart-line"
                  variant="secondary"
                  size="sm"
                  onClick={() => onShowStats(stat.name)}
                  aria-label={`Show stats for ${stat.name}`}
                />
              </div>
            </li>
          );
        })}
      </ul>
      {visibleStats.length === 0 && (
        <div className={styles.emptyState}>
          <Icon name="search-minus" size="lg" />
          <p>No fields match your search.</p>
        </div>
      )}
    </aside>
  );
};

const getStyles = () => ({
  container: css`
    display: flex;
    flex-direction: column;
    gap: 1rem;
    width: 280px;
    min-width: 240px;
    max-height: calc(100vh - 140px);
    overflow: hidden;
  `,
  list: css`
    list-style: none;
    margin: 0;
    padding: 0;
    overflow-y: auto;
    flex: 1 1 auto;
  `,
  controls: css`
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  `,
  item: css`
    border-bottom: 1px solid var(--grafana-border-color-weak);
    padding: 0.75rem 0;
    display: flex;
    justify-content: space-between;
    gap: 0.75rem;
  `,
  meta: css`
    font-size: 12px;
    color: var(--grafana-text-secondary);
    display: flex;
    gap: 0.5rem;
  `,
  examples: css`
    margin-top: 0.5rem;
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
  `,
  exampleButton: css`
    border: none;
    background: var(--grafana-background-secondary);
    border-radius: 4px;
    padding: 0.2rem 0.4rem;
    font-size: 11px;
    cursor: pointer;
  `,
  actions: css`
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  `,
  emptyState: css`
    text-align: center;
    color: var(--grafana-text-secondary);
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    align-items: center;
  `,
});
