import { dateTime, type TimeRange } from '@grafana/data';

import type { QueryHistoryEntry, SavedSearch, StoredTimeRange } from '../types/discover';

const SAVED_SEARCH_KEY = 'mirador:discover:saved-searches';
const HISTORY_KEY = 'mirador:discover:history';
export const HISTORY_LIMIT = 20;

const hasStorage = () => typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

export const serializeTimeRange = (range: TimeRange): StoredTimeRange => ({
  from: range.from.toISOString(),
  to: range.to.toISOString(),
  raw: range.raw,
});

export const deserializeTimeRange = (stored: StoredTimeRange): TimeRange => ({
  from: dateTime(stored.from),
  to: dateTime(stored.to),
  raw: stored.raw,
});

export const loadSavedSearches = (): SavedSearch[] => {
  if (!hasStorage()) {
    return [];
  }

  const raw = window.localStorage.getItem(SAVED_SEARCH_KEY);
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as SavedSearch[];
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.warn('Failed to parse saved searches, clearing storage', error);
    window.localStorage.removeItem(SAVED_SEARCH_KEY);
    return [];
  }
};

export const persistSavedSearches = (searches: SavedSearch[]) => {
  if (!hasStorage()) {
    return;
  }
  window.localStorage.setItem(SAVED_SEARCH_KEY, JSON.stringify(searches));
};

export const loadQueryHistory = (): QueryHistoryEntry[] => {
  if (!hasStorage()) {
    return [];
  }

  const raw = window.localStorage.getItem(HISTORY_KEY);
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as QueryHistoryEntry[];
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.warn('Failed to parse query history, clearing storage', error);
    window.localStorage.removeItem(HISTORY_KEY);
    return [];
  }
};

export const persistQueryHistory = (entries: QueryHistoryEntry[]) => {
  if (!hasStorage()) {
    return;
  }
  const limited = entries.slice(0, HISTORY_LIMIT);
  window.localStorage.setItem(HISTORY_KEY, JSON.stringify(limited));
};
