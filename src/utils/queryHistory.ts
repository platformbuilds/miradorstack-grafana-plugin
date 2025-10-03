import { QueryHistoryItem } from '../types/search';

const STORAGE_KEY = 'mirador-query-history';
const MAX_HISTORY_ITEMS = 100;

export class QueryHistoryManager {
  private static instance: QueryHistoryManager;
  private history: QueryHistoryItem[] = [];

  private constructor() {
    this.loadFromStorage();
  }

  static getInstance(): QueryHistoryManager {
    if (!QueryHistoryManager.instance) {
      QueryHistoryManager.instance = new QueryHistoryManager();
    }
    return QueryHistoryManager.instance;
  }

  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        this.history = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load query history from storage:', error);
      this.history = [];
    }
  }

  private saveToStorage(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.history));
    } catch (error) {
      console.error('Failed to save query history to storage:', error);
    }
  }

  addToHistory(item: Omit<QueryHistoryItem, 'id' | 'timestamp'>): QueryHistoryItem {
    const now = new Date().toISOString();
    const newItem: QueryHistoryItem = {
      ...item,
      id: this.generateId(),
      timestamp: now,
    };

    // Add to beginning of array (most recent first)
    this.history.unshift(newItem);

    // Limit history size
    if (this.history.length > MAX_HISTORY_ITEMS) {
      this.history = this.history.slice(0, MAX_HISTORY_ITEMS);
    }

    this.saveToStorage();
    return newItem;
  }

  getHistory(page?: QueryHistoryItem['page'], limit?: number): QueryHistoryItem[] {
    let filtered = page ? this.history.filter(h => h.page === page) : [...this.history];
    if (limit) {
      filtered = filtered.slice(0, limit);
    }
    return filtered;
  }

  searchHistory(query: string, page?: QueryHistoryItem['page']): QueryHistoryItem[] {
    const lowerQuery = query.toLowerCase();
    return this.history.filter(item => {
      if (page && item.page !== page) {return false;}

      return (
        item.query.toLowerCase().includes(lowerQuery) ||
        item.page.toLowerCase().includes(lowerQuery)
      );
    });
  }

  toggleFavorite(id: string): boolean {
    const item = this.history.find(h => h.id === id);
    if (!item) {return false;}

    item.isFavorite = !item.isFavorite;
    this.saveToStorage();
    return item.isFavorite;
  }

  deleteFromHistory(id: string): boolean {
    const index = this.history.findIndex(h => h.id === id);
    if (index === -1) {return false;}

    this.history.splice(index, 1);
    this.saveToStorage();
    return true;
  }

  clearHistory(page?: QueryHistoryItem['page']): void {
    if (page) {
      this.history = this.history.filter(h => h.page !== page);
    } else {
      this.history = [];
    }
    this.saveToStorage();
  }

  getFavorites(page?: QueryHistoryItem['page']): QueryHistoryItem[] {
    return this.history.filter(item => {
      if (page && item.page !== page) {return false;}
      return item.isFavorite;
    });
  }

  getRecentQueries(page?: QueryHistoryItem['page'], limit = 10): QueryHistoryItem[] {
    return this.getHistory(page, limit);
  }

  private generateId(): string {
    return `history_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export const queryHistoryManager = QueryHistoryManager.getInstance();
