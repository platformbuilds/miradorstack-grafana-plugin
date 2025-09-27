import type { SavedFilterGroup } from '../types/discover';

const STORAGE_KEY = 'mirador-discover-saved-filters-v1';

export function loadSavedFilters(): SavedFilterGroup[] {
  if (typeof window === 'undefined') {
    return [];
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw) as SavedFilterGroup[];
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.warn('Failed to parse saved filters', error);
    return [];
  }
}

export function persistSavedFilters(groups: SavedFilterGroup[]): void {
  if (typeof window === 'undefined') {
    return;
  }
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(groups));
}

export function upsertSavedFilterGroup(groups: SavedFilterGroup[], next: SavedFilterGroup): SavedFilterGroup[] {
  const existingIndex = groups.findIndex((group) => group.id === next.id);
  if (existingIndex === -1) {
    return [...groups, next];
  }
  const clone = [...groups];
  clone[existingIndex] = next;
  return clone;
}

export function deleteSavedFilterGroup(groups: SavedFilterGroup[], id: string): SavedFilterGroup[] {
  return groups.filter((group) => group.id !== id);
}
