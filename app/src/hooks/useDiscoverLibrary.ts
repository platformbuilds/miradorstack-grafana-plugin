import { useCallback, useMemo, useState } from 'react';
import type {
  DiscoverFilter,
  DiscoverQueryState,
  QueryHistoryEntry,
  SavedSearch,
} from '../types/discover';
import {
  deserializeTimeRange,
  loadQueryHistory,
  loadSavedSearches,
  persistQueryHistory,
  persistSavedSearches,
  serializeTimeRange,
  HISTORY_LIMIT,
} from '../utils/searchStorage';

interface SaveFormState {
  name: string;
  description: string;
}

type LibraryView = 'saved' | 'history' | null;

type LibraryFilter = DiscoverFilter | Omit<DiscoverFilter, 'id'>;

interface LibraryStateResult {
  saveModalOpen: boolean;
  libraryView: LibraryView;
  saveForm: SaveFormState;
  saveError?: string;
  savedSearches: SavedSearch[];
  sortedSavedSearches: SavedSearch[];
  queryHistory: QueryHistoryEntry[];
  sortedHistory: QueryHistoryEntry[];
  openSaveModal: (state: DiscoverQueryState) => void;
  closeSaveModal: () => void;
  updateSaveForm: (form: Partial<SaveFormState>) => void;
  saveCurrentSearch: (state: DiscoverQueryState, filters: LibraryFilter[]) => boolean;
  deleteSavedSearch: (id: string) => void;
  toggleFavorite: (id: string) => void;
  openLibrary: (view: Exclude<LibraryView, null>) => void;
  closeLibrary: () => void;
  applySavedSearch: (saved: SavedSearch) => { state: DiscoverQueryState; filters: Array<Omit<DiscoverFilter, 'id'>> };
  applyHistory: (entry: QueryHistoryEntry) => { state: DiscoverQueryState; filters: Array<Omit<DiscoverFilter, 'id'>> };
  saveFromHistory: (entry: QueryHistoryEntry) => {
    state: DiscoverQueryState;
    filters: Array<Omit<DiscoverFilter, 'id'>>;
  };
  clearHistory: () => void;
  recordHistory: (state: DiscoverQueryState, filters: LibraryFilter[]) => void;
}

interface UseDiscoverLibraryOptions {
  loadSavedSearches?: () => SavedSearch[];
  loadQueryHistory?: () => QueryHistoryEntry[];
  persistSavedSearches?: (searches: SavedSearch[]) => void;
  persistQueryHistory?: (history: QueryHistoryEntry[]) => void;
  generateId?: () => string;
  serializeTimeRange?: typeof serializeTimeRange;
  deserializeTimeRange?: typeof deserializeTimeRange;
}

const defaultGenerateId = () => Math.random().toString(36).slice(2, 12);

const stripFilterIds = (filters: LibraryFilter[]): Array<Omit<DiscoverFilter, 'id'>> =>
  filters.map(({ field, comparator, value }) => ({ field, comparator, value }));

const isSameHistoryEntry = (left: QueryHistoryEntry, right: QueryHistoryEntry) =>
  left.query === right.query &&
  left.limit === right.limit &&
  left.timeRange.raw.from === right.timeRange.raw.from &&
  left.timeRange.raw.to === right.timeRange.raw.to &&
  JSON.stringify(left.filters) === JSON.stringify(right.filters);

export const useDiscoverLibrary = (options?: UseDiscoverLibraryOptions): LibraryStateResult => {
  const loadSaved = options?.loadSavedSearches ?? loadSavedSearches;
  const loadHistory = options?.loadQueryHistory ?? loadQueryHistory;
  const persistSaved = options?.persistSavedSearches ?? persistSavedSearches;
  const persistHistory = options?.persistQueryHistory ?? persistQueryHistory;
  const toStoredRange = options?.serializeTimeRange ?? serializeTimeRange;
  const fromStoredRange = options?.deserializeTimeRange ?? deserializeTimeRange;
  const generateId = options?.generateId ?? defaultGenerateId;

  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [saveForm, setSaveForm] = useState<SaveFormState>({ name: '', description: '' });
  const [saveError, setSaveError] = useState<string | undefined>(undefined);
  const [libraryView, setLibraryView] = useState<LibraryView>(null);
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>(() => loadSaved());
  const [queryHistory, setQueryHistory] = useState<QueryHistoryEntry[]>(() => loadHistory());

  const sortedSavedSearches = useMemo(() => {
    return [...savedSearches].sort((a, b) => {
      if (Boolean(b.favorite) !== Boolean(a.favorite)) {
        return (b.favorite ? 1 : 0) - (a.favorite ? 1 : 0);
      }
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
  }, [savedSearches]);

  const sortedHistory = useMemo(() => {
    return [...queryHistory].sort(
      (a, b) => new Date(b.executedAt).getTime() - new Date(a.executedAt).getTime()
    );
  }, [queryHistory]);

  const openSaveModal = useCallback(
    (state: DiscoverQueryState) => {
      setSaveError(undefined);
      setSaveForm({
        name: state.query ? state.query.slice(0, 120) : `Search ${savedSearches.length + 1}`,
        description: '',
      });
      setSaveModalOpen(true);
    },
    [savedSearches.length]
  );

  const closeSaveModal = useCallback(() => {
    setSaveModalOpen(false);
    setSaveError(undefined);
  }, []);

  const updateSaveForm = useCallback((form: Partial<SaveFormState>) => {
    setSaveForm((current) => ({ ...current, ...form }));
  }, []);

  const saveCurrentSearch = useCallback(
    (state: DiscoverQueryState, filters: LibraryFilter[]) => {
      const name = saveForm.name.trim();
      if (!name) {
        setSaveError('Name is required');
        return false;
      }

      const description = saveForm.description.trim();
      const filtersSnapshot = stripFilterIds(filters);
      const now = new Date().toISOString();

      setSavedSearches((current) => {
        const existingIndex = current.findIndex((item) => item.name.toLowerCase() === name.toLowerCase());
        let next: SavedSearch[];

        if (existingIndex >= 0) {
          next = [...current];
          next[existingIndex] = {
            ...next[existingIndex],
            name,
            description: description || undefined,
            query: state.query,
            limit: state.limit,
            timeRange: toStoredRange(state.timeRange),
            filters: filtersSnapshot,
            updatedAt: now,
          };
        } else {
          const entry: SavedSearch = {
            id: generateId(),
            name,
            description: description || undefined,
            query: state.query,
            limit: state.limit,
            timeRange: toStoredRange(state.timeRange),
            filters: filtersSnapshot,
            favorite: false,
            createdAt: now,
            updatedAt: now,
          };
          next = [entry, ...current];
        }

        persistSaved(next);
        return next;
      });

      setSaveError(undefined);
      setSaveModalOpen(false);
      return true;
    },
    [generateId, persistSaved, saveForm.description, saveForm.name, toStoredRange]
  );

  const deleteSavedSearch = useCallback(
    (id: string) => {
      setSavedSearches((current) => {
        const next = current.filter((item) => item.id !== id);
        persistSaved(next);
        return next;
      });
    },
    [persistSaved]
  );

  const toggleFavorite = useCallback(
    (id: string) => {
      setSavedSearches((current) => {
        const next = current.map((item) =>
          item.id === id
            ? { ...item, favorite: !item.favorite, updatedAt: new Date().toISOString() }
            : item
        );
        persistSaved(next);
        return next;
      });
    },
    [persistSaved]
  );

  const openLibrary = useCallback((view: Exclude<LibraryView, null>) => {
    setLibraryView(view);
  }, []);

  const closeLibrary = useCallback(() => {
    setLibraryView(null);
  }, []);

  const applySavedSearch = useCallback(
    (saved: SavedSearch) => {
      setLibraryView(null);
      return {
        state: {
          query: saved.query,
          limit: saved.limit,
          timeRange: fromStoredRange(saved.timeRange),
        },
        filters: saved.filters,
      };
    },
    [fromStoredRange]
  );

  const applyHistory = useCallback(
    (entry: QueryHistoryEntry) => {
      setLibraryView(null);
      return {
        state: {
          query: entry.query,
          limit: entry.limit,
          timeRange: fromStoredRange(entry.timeRange),
        },
        filters: entry.filters,
      };
    },
    [fromStoredRange]
  );

  const saveFromHistory = useCallback(
    (entry: QueryHistoryEntry) => {
      const applied = applyHistory(entry);
      setSaveForm({
        name: entry.query ? entry.query.slice(0, 120) : `Search ${savedSearches.length + 1}`,
        description: '',
      });
      setSaveModalOpen(true);
      return applied;
    },
    [applyHistory, savedSearches.length]
  );

  const clearHistory = useCallback(() => {
    setQueryHistory(() => {
      persistHistory([]);
      return [];
    });
  }, [persistHistory]);

  const recordHistory = useCallback(
    (state: DiscoverQueryState, filters: LibraryFilter[]) => {
      const entry: QueryHistoryEntry = {
        id: generateId(),
        query: state.query,
        limit: state.limit,
        timeRange: toStoredRange(state.timeRange),
        executedAt: new Date().toISOString(),
        filters: stripFilterIds(filters),
      };

      setQueryHistory((current) => {
        const deduped = current.filter((item) => !isSameHistoryEntry(item, entry));
        const next = [entry, ...deduped].slice(0, HISTORY_LIMIT);
        persistHistory(next);
        return next;
      });
    },
    [generateId, persistHistory, toStoredRange]
  );

  return {
    saveModalOpen,
    libraryView,
    saveForm,
    saveError,
    savedSearches,
    sortedSavedSearches,
    queryHistory,
    sortedHistory,
    openSaveModal,
    closeSaveModal,
    updateSaveForm,
    saveCurrentSearch,
    deleteSavedSearch,
    toggleFavorite,
    openLibrary,
    closeLibrary,
    applySavedSearch,
    applyHistory,
    saveFromHistory,
    clearHistory,
    recordHistory,
  };
};

export type UseDiscoverLibraryResult = ReturnType<typeof useDiscoverLibrary>;
