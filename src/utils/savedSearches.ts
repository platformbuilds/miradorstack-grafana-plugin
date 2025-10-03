import { SavedSearch } from '../types/search';

const STORAGE_KEY = 'mirador-saved-searches';

export class SavedSearchManager {
  private static instance: SavedSearchManager;
  private searches: SavedSearch[] = [];

  private constructor() {
    this.loadFromStorage();
  }

  static getInstance(): SavedSearchManager {
    if (!SavedSearchManager.instance) {
      SavedSearchManager.instance = new SavedSearchManager();
    }
    return SavedSearchManager.instance;
  }

  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        this.searches = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load saved searches from storage:', error);
      this.searches = [];
    }
  }

  private saveToStorage(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.searches));
    } catch (error) {
      console.error('Failed to save searches to storage:', error);
    }
  }

  saveSearch(search: Omit<SavedSearch, 'id' | 'createdAt' | 'updatedAt'>): SavedSearch {
    const now = new Date().toISOString();
    const newSearch: SavedSearch = {
      ...search,
      id: this.generateId(),
      createdAt: now,
      updatedAt: now,
    };

    this.searches.push(newSearch);
    this.saveToStorage();
    return newSearch;
  }

  updateSearch(id: string, updates: Partial<Omit<SavedSearch, 'id' | 'createdAt'>>): SavedSearch | null {
    const index = this.searches.findIndex(s => s.id === id);
    if (index === -1) {return null;}

    this.searches[index] = {
      ...this.searches[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.saveToStorage();
    return this.searches[index];
  }

  deleteSearch(id: string): boolean {
    const index = this.searches.findIndex(s => s.id === id);
    if (index === -1) {return false;}

    this.searches.splice(index, 1);
    this.saveToStorage();
    return true;
  }

  getSearch(id: string): SavedSearch | null {
    return this.searches.find(s => s.id === id) || null;
  }

  getSearchesByPage(page: SavedSearch['page']): SavedSearch[] {
    return this.searches.filter(s => s.page === page);
  }

  getAllSearches(): SavedSearch[] {
    return [...this.searches];
  }

  searchSearches(query: string, page?: SavedSearch['page']): SavedSearch[] {
    const lowerQuery = query.toLowerCase();
    return this.searches.filter(search => {
      if (page && search.page !== page) {return false;}

      return (
        search.name.toLowerCase().includes(lowerQuery) ||
        search.description?.toLowerCase().includes(lowerQuery) ||
        search.query.toLowerCase().includes(lowerQuery) ||
        search.tags?.some((tag: string) => tag.toLowerCase().includes(lowerQuery))
      );
    });
  }

  private generateId(): string {
    return `search_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export const savedSearchManager = SavedSearchManager.getInstance();
