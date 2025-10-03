import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface NavigationState {
  currentPage: string;
  query: string;
  filters: Record<string, any>;
  timeRange: string;
  activeTab?: string;
  reportData?: any[];
  insightsData?: any;
}

export interface NavigationContextType {
  navigationState: NavigationState;
  updateNavigationState: (updates: Partial<NavigationState>) => void;
  navigateToPage: (page: string, state?: Partial<NavigationState>) => void;
  clearNavigationState: () => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

const initialState: NavigationState = {
  currentPage: 'discover',
  query: '',
  filters: {},
  timeRange: 'last 1h',
};

export const NavigationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [navigationState, setNavigationState] = useState<NavigationState>(initialState);

  const updateNavigationState = (updates: Partial<NavigationState>) => {
    setNavigationState(prev => ({ ...prev, ...updates }));
  };

  const navigateToPage = (page: string, state?: Partial<NavigationState>) => {
    setNavigationState(prev => ({
      ...prev,
      currentPage: page,
      ...state,
    }));
  };

  const clearNavigationState = () => {
    setNavigationState(initialState);
  };

  return (
    <NavigationContext.Provider
      value={{
        navigationState,
        updateNavigationState,
        navigateToPage,
        clearNavigationState,
      }}
    >
      {children}
    </NavigationContext.Provider>
  );
};

export const useNavigation = () => {
  const context = useContext(NavigationContext);
  if (context === undefined) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
};
