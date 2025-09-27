import React, { FormEvent, useMemo, useState } from 'react';
import { useStyles2, Alert, Button, Field, HorizontalGroup, Icon, Input, Modal, TextArea } from '@grafana/ui';
import { css } from '@emotion/css';
import { dateTime, type AppRootProps, type TimeRange } from '@grafana/data';

import samples from '../../mocks/logSamples.json';
import type {
  DiscoverFilter,
  DiscoverQueryState,
  LogDocument,
  QueryHistoryEntry,
  SavedSearch,
} from '../../types/discover';
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
import {
  deserializeTimeRange,
  loadQueryHistory,
  loadSavedSearches,
  persistQueryHistory,
  persistSavedSearches,
  serializeTimeRange,
} from '../../utils/searchStorage';
import { downloadDocuments } from '../../utils/export';

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

const generateId = (length = 8) => Math.random().toString(36).slice(2, 2 + length);

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
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>(() => loadSavedSearches());
  const [queryHistory, setQueryHistory] = useState<QueryHistoryEntry[]>(() => loadQueryHistory());
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [libraryView, setLibraryView] = useState<'saved' | 'history' | null>(null);
  const [saveForm, setSaveForm] = useState({ name: '', description: '' });
  const [saveError, setSaveError] = useState<string | undefined>(undefined);

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

  const cloneFilters = (items: DiscoverFilter[]) =>
    items.map(({ field, comparator, value }) => ({ field, comparator, value }));

  const applyQueryState = (state: DiscoverQueryState) => {
    setQueryState(state);
    histogram.setTimeRange(state.timeRange);
  };

  const applySavedFilters = (items: Array<Omit<DiscoverFilter, 'id'>>) => {
    filters.clearFilters();
    items.forEach((filter) => filters.addFilter(filter));
  };

  const isSameHistory = (left: QueryHistoryEntry, right: QueryHistoryEntry) =>
    left.query === right.query &&
    left.limit === right.limit &&
    left.timeRange.raw.from === right.timeRange.raw.from &&
    left.timeRange.raw.to === right.timeRange.raw.to &&
    JSON.stringify(left.filters) === JSON.stringify(right.filters);

  const recordHistory = (state: DiscoverQueryState, snapshotFilters: Array<Omit<DiscoverFilter, 'id'>>) => {
    const entry: QueryHistoryEntry = {
      id: generateId(10),
      query: state.query,
      limit: state.limit,
      timeRange: serializeTimeRange(state.timeRange),
      executedAt: new Date().toISOString(),
      filters: snapshotFilters,
    };

    setQueryHistory((current) => {
      const deduped = current.filter((item) => !isSameHistory(item, entry));
      const next = [entry, ...deduped];
      persistQueryHistory(next);
      return next;
    });
  };

  const handleRunQuery = () => {
    const snapshot: DiscoverQueryState = {
      query: queryState.query,
      limit: queryState.limit,
      timeRange: queryState.timeRange,
    };
    recordHistory(snapshot, cloneFilters(filters.filters));
    setQueryState((current) => ({ ...current }));
  };

  const handleExport = (format: 'csv' | 'json') => {
    if (!limitedDocuments.length) {
      return;
    }
    downloadDocuments(limitedDocuments, format);
  };

  const handleOpenSaveModal = () => {
    setSaveError(undefined);
    setSaveForm({
      name: queryState.query ? queryState.query.slice(0, 120) : `Search ${savedSearches.length + 1}`,
      description: '',
    });
    setSaveModalOpen(true);
  };

  const handleSaveSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const name = saveForm.name.trim();
    if (!name) {
      setSaveError('Name is required');
      return;
    }

    const description = saveForm.description.trim();
    const filtersSnapshot = cloneFilters(filters.filters);
    const now = new Date().toISOString();

    setSavedSearches((current) => {
      const existingIndex = current.findIndex((item) => item.name.toLowerCase() === name.toLowerCase());
      if (existingIndex >= 0) {
        const next = [...current];
        next[existingIndex] = {
          ...next[existingIndex],
          name,
          description: description || undefined,
          query: queryState.query,
          limit: queryState.limit,
          timeRange: serializeTimeRange(queryState.timeRange),
          filters: filtersSnapshot,
          updatedAt: now,
        };
        persistSavedSearches(next);
        return next;
      }

      const entry: SavedSearch = {
        id: generateId(10),
        name,
        description: description || undefined,
        query: queryState.query,
        limit: queryState.limit,
        timeRange: serializeTimeRange(queryState.timeRange),
        filters: filtersSnapshot,
        favorite: false,
        createdAt: now,
        updatedAt: now,
      };

      const next = [entry, ...current];
      persistSavedSearches(next);
      return next;
    });

    setSaveError(undefined);
    setSaveModalOpen(false);
  };

  const sortedSavedSearches = useMemo(() => {
    return [...savedSearches].sort((a, b) => {
      if (Boolean(b.favorite) !== Boolean(a.favorite)) {
        return (b.favorite ? 1 : 0) - (a.favorite ? 1 : 0);
      }
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
  }, [savedSearches]);

  const sortedHistory = useMemo(
    () => [...queryHistory].sort((a, b) => new Date(b.executedAt).getTime() - new Date(a.executedAt).getTime()),
    [queryHistory]
  );

  const handleApplySavedSearch = (saved: SavedSearch) => {
    setLibraryView(null);
    applySavedFilters(saved.filters);
    const nextState: DiscoverQueryState = {
      query: saved.query,
      limit: saved.limit,
      timeRange: deserializeTimeRange(saved.timeRange),
    };
    applyQueryState(nextState);
    recordHistory(nextState, saved.filters);
  };

  const handleApplyHistory = (entry: QueryHistoryEntry) => {
    setLibraryView(null);
    applySavedFilters(entry.filters);
    const nextState: DiscoverQueryState = {
      query: entry.query,
      limit: entry.limit,
      timeRange: deserializeTimeRange(entry.timeRange),
    };
    applyQueryState(nextState);
    recordHistory(nextState, entry.filters);
  };

  const handleClearHistory = () => {
    setQueryHistory(() => {
      persistQueryHistory([]);
      return [];
    });
  };

  const handleSaveFromHistory = (entry: QueryHistoryEntry) => {
    handleApplyHistory(entry);
    setSaveForm({
      name: entry.query ? entry.query.slice(0, 120) : `Search ${savedSearches.length + 1}`,
      description: '',
    });
    setSaveModalOpen(true);
  };

  const toggleFavorite = (id: string) => {
    setSavedSearches((current) => {
      const next = current.map((item) =>
        item.id === id ? { ...item, favorite: !item.favorite, updatedAt: new Date().toISOString() } : item
      );
      persistSavedSearches(next);
      return next;
    });
  };

  const handleDeleteSavedSearch = (id: string) => {
    setSavedSearches((current) => {
      const next = current.filter((item) => item.id !== id);
      persistSavedSearches(next);
      return next;
    });
  };

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
            onRunQuery={handleRunQuery}
          />
          <div className={styles.secondaryActions}>
            <HorizontalGroup spacing="sm">
              <Button icon="star" variant="secondary" onClick={handleOpenSaveModal}>
                Save search
              </Button>
              <Button
                icon="bookmark"
                variant="secondary"
                onClick={() => setLibraryView('saved')}
                disabled={sortedSavedSearches.length === 0}
              >
                Saved searches
              </Button>
              <Button
                icon="history"
                variant="secondary"
                onClick={() => setLibraryView('history')}
                disabled={sortedHistory.length === 0}
              >
                History
              </Button>
              <Button
                icon="download-alt"
                variant="secondary"
                onClick={() => handleExport('csv')}
                disabled={!limitedDocuments.length}
              >
                Export CSV
              </Button>
              <Button
                icon="download-alt"
                variant="secondary"
                onClick={() => handleExport('json')}
                disabled={!limitedDocuments.length}
              >
                Export JSON
              </Button>
            </HorizontalGroup>
          </div>
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
      {saveModalOpen && (
        <Modal title="Save search" isOpen onDismiss={() => setSaveModalOpen(false)} className={styles.modal}>
          {saveError && (
            <Alert severity="error" title="Unable to save" className={styles.modalMessage}>
              {saveError}
            </Alert>
          )}
          <form className={styles.form} onSubmit={handleSaveSearchSubmit}>
            <Field label="Name" required>
              <Input
                value={saveForm.name}
                onChange={(event) =>
                  setSaveForm((current) => ({ ...current, name: event.currentTarget.value }))
                }
                placeholder="Production error search"
              />
            </Field>
            <Field label="Description">
              <TextArea
                value={saveForm.description}
                rows={3}
                onChange={(event) =>
                  setSaveForm((current) => ({ ...current, description: event.currentTarget.value }))
                }
              />
            </Field>
            <Modal.ButtonRow>
              <Button type="button" variant="secondary" onClick={() => setSaveModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" disabled={!saveForm.name.trim()}>
                Save
              </Button>
            </Modal.ButtonRow>
          </form>
        </Modal>
      )}
      {libraryView === 'saved' && (
        <Modal title="Saved searches" isOpen onDismiss={() => setLibraryView(null)} className={styles.modal}>
          {sortedSavedSearches.length === 0 ? (
            <Alert severity="info" title="No saved searches yet" className={styles.modalMessage}>
              Store frequently used queries and filters to reuse them quickly.
            </Alert>
          ) : (
            <ul className={styles.libraryList}>
              {sortedSavedSearches.map((search) => (
                <li key={search.id} className={styles.libraryItem}>
                  <div>
                    <div className={styles.libraryTitle}>
                      {search.name}
                      {search.favorite && <Icon name="star" size="sm" />}
                    </div>
                    {search.description && (
                      <div className={styles.libraryDescription}>{search.description}</div>
                    )}
                    <div className={styles.libraryMeta}>
                      Updated {dateTime(search.updatedAt).fromNow()} · {search.filters.length} filters
                    </div>
                  </div>
                  <HorizontalGroup spacing="xs">
                    <Button size="sm" icon="play" onClick={() => handleApplySavedSearch(search)}>
                      Load
                    </Button>
                    <Button
                      size="sm"
                      icon={search.favorite ? 'star' : 'star-outline'}
                      variant="secondary"
                      onClick={() => toggleFavorite(search.id)}
                    >
                      {search.favorite ? 'Unfavorite' : 'Favorite'}
                    </Button>
                    <Button
                      size="sm"
                      icon="trash-alt"
                      variant="secondary"
                      onClick={() => handleDeleteSavedSearch(search.id)}
                    >
                      Delete
                    </Button>
                  </HorizontalGroup>
                </li>
              ))}
            </ul>
          )}
          <Modal.ButtonRow>
            <Button variant="secondary" onClick={() => setLibraryView(null)}>
              Close
            </Button>
          </Modal.ButtonRow>
        </Modal>
      )}
      {libraryView === 'history' && (
        <Modal title="Query history" isOpen onDismiss={() => setLibraryView(null)} className={styles.modal}>
          {sortedHistory.length === 0 ? (
            <Alert severity="info" title="No history available" className={styles.modalMessage}>
              Run queries to build a history of recent searches.
            </Alert>
          ) : (
            <ul className={styles.libraryList}>
              {sortedHistory.map((entry) => (
                <li key={entry.id} className={styles.libraryItem}>
                  <div>
                    <div className={styles.libraryTitle}>{entry.query || 'All documents'}</div>
                    <div className={styles.libraryMeta}>
                      Ran {dateTime(entry.executedAt).fromNow()} · {entry.filters.length} filters · limit {entry.limit}
                    </div>
                  </div>
                  <HorizontalGroup spacing="xs">
                    <Button size="sm" icon="play" onClick={() => handleApplyHistory(entry)}>
                      Load
                    </Button>
                    <Button size="sm" icon="star" variant="secondary" onClick={() => handleSaveFromHistory(entry)}>
                      Save
                    </Button>
                  </HorizontalGroup>
                </li>
              ))}
            </ul>
          )}
          <Modal.ButtonRow>
            <Button variant="secondary" onClick={() => setLibraryView(null)}>
              Close
            </Button>
            {sortedHistory.length > 0 && (
              <Button variant="secondary" icon="trash-alt" onClick={handleClearHistory}>
                Clear history
              </Button>
            )}
          </Modal.ButtonRow>
        </Modal>
      )}
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
  secondaryActions: css`
    display: flex;
    justify-content: flex-end;
  `,
  modal: css`
    width: 600px;
    max-width: 95vw;
  `,
  modalMessage: css`
    margin-bottom: 1rem;
  `,
  form: css`
    display: flex;
    flex-direction: column;
    gap: 1rem;
  `,
  libraryList: css`
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  `,
  libraryItem: css`
    display: flex;
    justify-content: space-between;
    gap: 1rem;
    align-items: center;
    border: 1px solid var(--grafana-border-weak);
    border-radius: 4px;
    padding: 0.75rem 1rem;
    background: var(--grafana-background-secondary);
  `,
  libraryTitle: css`
    font-weight: 600;
    display: inline-flex;
    gap: 0.5rem;
    align-items: center;
  `,
  libraryDescription: css`
    color: var(--grafana-text-secondary);
    margin-top: 0.25rem;
  `,
  libraryMeta: css`
    font-size: 12px;
    color: var(--grafana-text-secondary);
    margin-top: 0.25rem;
  `,
});
