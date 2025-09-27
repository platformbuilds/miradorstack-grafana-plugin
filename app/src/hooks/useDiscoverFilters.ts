import { useCallback, useMemo, useState } from 'react';
import type { DiscoverFilter, SavedFilterGroup } from '../types/discover';
import { deleteSavedFilterGroup, loadSavedFilters, persistSavedFilters, upsertSavedFilterGroup } from '../utils/filterStorage';

export interface DiscoverFiltersController {
  filters: DiscoverFilter[];
  savedGroups: SavedFilterGroup[];
  addFilter: (filter: Omit<DiscoverFilter, 'id'>) => void;
  updateFilter: (filter: DiscoverFilter) => void;
  removeFilter: (id: string) => void;
  clearFilters: () => void;
  saveGroup: (group: Omit<SavedFilterGroup, 'id' | 'createdAt'> & { id?: string }) => void;
  deleteGroup: (id: string) => void;
  loadGroup: (id: string) => void;
}

export function useDiscoverFilters(initialFilters: DiscoverFilter[] = []): DiscoverFiltersController {
  const [filters, setFilters] = useState<DiscoverFilter[]>(initialFilters);
  const [savedGroups, setSavedGroups] = useState<SavedFilterGroup[]>(() => loadSavedFilters());

  const generateId = useCallback((length = 8) => {
    return Math.random().toString(36).slice(2, 2 + length);
  }, []);

  const addFilter = useCallback(
    (filter: Omit<DiscoverFilter, 'id'>) => {
      setFilters((current) => [...current, { ...filter, id: generateId(8) }]);
    },
    [generateId]
  );

  const updateFilter = useCallback((filter: DiscoverFilter) => {
      setFilters((current) => current.map((item) => (item.id === filter.id ? filter : item)));
  }, []);

  const removeFilter = useCallback((id: string) => {
    setFilters((current) => current.filter((item) => item.id !== id));
  }, []);

  const clearFilters = useCallback(() => setFilters([]), []);

  const saveGroup = useCallback(
    (group: Omit<SavedFilterGroup, 'id' | 'createdAt'> & { id?: string }) => {
      setSavedGroups((current) => {
        const payload: SavedFilterGroup = {
          id: group.id ?? generateId(6),
          name: group.name,
          description: group.description,
          filters,
          createdAt: new Date().toISOString(),
        };
        const next = upsertSavedFilterGroup(current, payload);
        persistSavedFilters(next);
        return next;
      });
    },
    [filters]
  );

  const deleteGroup = useCallback((id: string) => {
    setSavedGroups((current) => {
      const next = deleteSavedFilterGroup(current, id);
      persistSavedFilters(next);
      return next;
    });
  }, []);

  const loadGroup = useCallback((id: string) => {
    const group = savedGroups.find((item) => item.id === id);
    if (group) {
      setFilters(group.filters.map((filter) => ({ ...filter, id: generateId(8) })));
    }
  }, [savedGroups, generateId]);

  return useMemo(
    () => ({ filters, savedGroups, addFilter, updateFilter, removeFilter, clearFilters, saveGroup, deleteGroup, loadGroup }),
    [filters, savedGroups, addFilter, updateFilter, removeFilter, clearFilters, saveGroup, deleteGroup, loadGroup]
  );
}
