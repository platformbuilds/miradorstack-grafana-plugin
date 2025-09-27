import React, { useMemo, useState } from 'react';
import { useStyles2, Button, HorizontalGroup, Icon } from '@grafana/ui';
import { css } from '@emotion/css';
import { dateTime, type AppRootProps, type TimeRange } from '@grafana/data';

import samples from '../../mocks/logSamples.json';
import type { DiscoverFilter, DiscoverQueryState, LogDocument } from '../../types/discover';
import { buildFieldStats, calculateValueDistribution } from '../../utils/fieldStats';
import { useDiscoverFilters } from '../../hooks/useDiscoverFilters';
import { useHistogramQuery } from '../../hooks/useHistogramQuery';
import { SearchBar } from '../../components/discover/SearchBar';
import { FieldSidebar } from '../../components/discover/FieldSidebar';
import { DocumentTable } from '../../components/discover/DocumentTable';
import { TimeHistogram } from '../../components/discover/TimeHistogram';
import { FilterPillBar } from '../../components/discover/FilterPillBar';
import { AdvancedFiltersPanel } from '../../components/discover/AdvancedFiltersPanel';
import { FieldStatsOverlay } from '../../components/discover/FieldStatsOverlay';

const createInitialTimeRange = (): TimeRange => {
  const to = dateTime();
  const from = dateTime(to.valueOf()).subtract(30, 'minutes');
  return {
    from,
    to,
    raw: { from: 'now-30m', to: 'now' },
  } as TimeRange;
};

const createInitialQueryState = (): DiscoverQueryState => ({
  query: '',
  timeRange: createInitialTimeRange(),
  limit: 500,
});

const documents: LogDocument[] = samples as LogDocument[];

function matchesQuery(document: LogDocument, query: string): boolean {
  if (!query.trim()) {
    return true;
  }
  const needle = query.toLowerCase();
  const haystack = [
    document.message,
    document.service,
    document.level,
    document.tenant ?? '',
    JSON.stringify(document.attributes),
  ]
    .join(' ')
    .toLowerCase();
  return haystack.includes(needle);
}

const getDocumentField = (document: LogDocument, field: string) => {
  const attributes = document.attributes as Record<string, unknown>;
  if (attributes[field] !== undefined) {
    return attributes[field];
  }
  return (document as unknown as Record<string, unknown>)[field];
};

function matchesFilter(document: LogDocument, filter: DiscoverFilter): boolean {
  const value = getDocumentField(document, filter.field);

  switch (filter.comparator) {
    case 'exists':
      return value !== undefined && value !== null;
    case 'contains':
      return value !== undefined && String(value).toLowerCase().includes(String(filter.value ?? '').toLowerCase());
    case 'is_not':
      return value === undefined || String(value) !== String(filter.value);
    case 'range':
      if (!Array.isArray(filter.value) || filter.value.length !== 2) {
        return true;
      }
      const numeric = Number(value);
      const [min, max] = filter.value.map(Number);
      return Number.isFinite(numeric) && numeric >= min && numeric <= max;
    case 'is':
    default:
      return String(value) === String(filter.value ?? '');
  }
}

const applyTimeRange = (docs: LogDocument[], range: TimeRange) => {
  const from = range.from.valueOf();
  const to = range.to.valueOf();
  return docs.filter((doc) => {
    const ts = dateTime(doc.timestamp).valueOf();
    return ts >= from && ts <= to;
  });
};

const applyFilters = (docs: LogDocument[], filters: DiscoverFilter[]) =>
  docs.filter((doc) => filters.every((filter) => matchesFilter(doc, filter)));

export const DiscoverPage: React.FC<AppRootProps> = () => {
  const styles = useStyles2(getStyles);
  const [queryState, setQueryState] = useState<DiscoverQueryState>(() => createInitialQueryState());
  const [pinnedFields, setPinnedFields] = useState<string[]>(['service', 'level']);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [statsField, setStatsField] = useState<string | null>(null);

  const filters = useDiscoverFilters();

  const rangedDocuments = useMemo(() => applyTimeRange(documents, queryState.timeRange), [queryState.timeRange]);
  const queryFiltered = useMemo(
    () => rangedDocuments.filter((doc) => matchesQuery(doc, queryState.query)),
    [rangedDocuments, queryState.query]
  );
  const fullyFiltered = useMemo(
    () => applyFilters(queryFiltered, filters.filters),
    [queryFiltered, filters.filters]
  );
  const limitedDocuments = useMemo(() => fullyFiltered.slice(0, queryState.limit), [fullyFiltered, queryState.limit]);

  const stats = useMemo(() => buildFieldStats(fullyFiltered), [fullyFiltered]);
  const histogram = useHistogramQuery(rangedDocuments, queryState.timeRange, { bucketMinutes: 1 });
  const statsDistribution = useMemo(
    () => (statsField ? calculateValueDistribution(fullyFiltered, statsField) : []),
    [fullyFiltered, statsField]
  );

  const handleTimeRangeChange = (timeRange: TimeRange) => {
    setQueryState((current) => ({ ...current, timeRange }));
    histogram.setTimeRange(timeRange);
  };

  return (
    <div className={styles.wrapper}>
      <header className={styles.header}>
        <div>
          <HorizontalGroup spacing="xs" align="center">
            <Icon name="search-plus" />
            <h1 className={styles.title}>Discover</h1>
          </HorizontalGroup>
          <span className={styles.breadcrumbs}>Mirador Explorer / Discover</span>
        </div>
        <Button icon="filter" variant="secondary" onClick={() => setAdvancedOpen(true)}>
          Advanced filters
        </Button>
      </header>
      <main className={styles.contents}>
        <div className={styles.column}>
          <SearchBar
            query={queryState.query}
            limit={queryState.limit}
            timeRange={queryState.timeRange}
            onQueryChange={(query) => setQueryState((current) => ({ ...current, query }))}
            onTimeRangeChange={handleTimeRangeChange}
            onLimitChange={(limit) => setQueryState((current) => ({ ...current, limit }))}
            onRunQuery={() => setQueryState((current) => ({ ...current }))}
          />
          <FilterPillBar
            filters={filters.filters}
            onRemove={filters.removeFilter}
            onClear={filters.clearFilters}
          />
          <TimeHistogram
            buckets={histogram.data}
            loading={histogram.loading}
            timeRange={queryState.timeRange}
            onBucketSelect={handleTimeRangeChange}
          />
        </div>
        <div className={styles.body}>
          <FieldSidebar
            stats={stats}
            pinnedFields={pinnedFields}
            onTogglePin={(field) =>
              setPinnedFields((current) =>
                current.includes(field) ? current.filter((item) => item !== field) : [...current, field]
              )
            }
            onAddFilter={(field, value) => filters.addFilter({ field, comparator: value ? 'is' : 'exists', value })}
            onShowStats={setStatsField}
          />
          <DocumentTable documents={limitedDocuments} pinnedFields={pinnedFields} />
        </div>
      </main>
      <AdvancedFiltersPanel
        isOpen={advancedOpen}
        onClose={() => setAdvancedOpen(false)}
        filters={filters.filters}
        savedGroups={filters.savedGroups}
        onAddFilter={filters.addFilter}
        onSaveGroup={({ id, name, description }) =>
          filters.saveGroup({ id, name, description, filters: filters.filters })
        }
        onLoadGroup={filters.loadGroup}
        onDeleteGroup={filters.deleteGroup}
      />
      {statsField && (
        <FieldStatsOverlay
          field={statsField}
          distribution={statsDistribution}
          onFilter={(value) => {
            filters.addFilter({ field: statsField, comparator: 'is', value });
            setStatsField(null);
          }}
          onClose={() => setStatsField(null)}
        />
      )}
    </div>
  );
};

export default DiscoverPage;

const getStyles = () => ({
  wrapper: css`
    display: flex;
    flex-direction: column;
    gap: 1rem;
    height: 100%;
    padding: 0 1rem 1rem;
  `,
  header: css`
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-top: 0.5rem;
  `,
  title: css`
    margin: 0;
    font-size: 1.25rem;
  `,
  breadcrumbs: css`
    font-size: 12px;
    color: var(--grafana-text-secondary);
  `,
  contents: css`
    display: flex;
    flex-direction: column;
    gap: 1rem;
    height: calc(100vh - 160px);
  `,
  body: css`
    display: flex;
    gap: 1rem;
    height: 100%;
    overflow: hidden;
  `,
  column: css`
    display: flex;
    flex-direction: column;
    gap: 1rem;
    width: 100%;
  `,
});
