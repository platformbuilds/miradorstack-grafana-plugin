import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { LogEntry } from '../components/discover/DocumentTable';
import { FieldInfo } from '../components/discover/FieldSidebar';

export interface LogsState {
  // Query state
  query: string;
  timeRange: {
    from: number;
    to: number;
  };

  // Data state
  logs: LogEntry[];
  histogram: Array<{ time: number; count: number }>;
  loading: boolean;
  error: string | null;
  totalCount: number;

  // UI state
  expandedRows: Set<string>;
  selectedFields: Set<string>;
  pinnedFields: Set<string>;
  fieldInfo: FieldInfo[];

  // Filters
  levelFilter: string[];
  sourceFilter: string[];
}

export type LogsAction =
  | { type: 'SET_QUERY'; payload: string }
  | { type: 'SET_TIME_RANGE'; payload: { from: number; to: number } }
  | { type: 'SET_LOGS_DATA'; payload: { logs: LogEntry[]; histogram: Array<{ time: number; count: number }>; totalCount: number } }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'TOGGLE_ROW_EXPANSION'; payload: string }
  | { type: 'TOGGLE_FIELD_SELECTION'; payload: string }
  | { type: 'TOGGLE_FIELD_PIN'; payload: string }
  | { type: 'SET_FIELD_INFO'; payload: FieldInfo[] }
  | { type: 'SET_LEVEL_FILTER'; payload: string[] }
  | { type: 'SET_SOURCE_FILTER'; payload: string[] }
  | { type: 'RESET_FILTERS' };

const initialState: LogsState = {
  query: '',
  timeRange: {
    from: Date.now() - 24 * 60 * 60 * 1000, // 24 hours ago
    to: Date.now(),
  },
  logs: [],
  histogram: [],
  loading: false,
  error: null,
  totalCount: 0,
  expandedRows: new Set(),
  selectedFields: new Set(['timestamp', 'level', 'message']),
  pinnedFields: new Set(['timestamp', 'level', 'message']),
  fieldInfo: [],
  levelFilter: [],
  sourceFilter: [],
};

function logsReducer(state: LogsState, action: LogsAction): LogsState {
  switch (action.type) {
    case 'SET_QUERY':
      return { ...state, query: action.payload };

    case 'SET_TIME_RANGE':
      return { ...state, timeRange: action.payload };

    case 'SET_LOGS_DATA':
      return {
        ...state,
        logs: action.payload.logs,
        histogram: action.payload.histogram,
        totalCount: action.payload.totalCount,
      };

    case 'SET_LOADING':
      return { ...state, loading: action.payload };

    case 'SET_ERROR':
      return { ...state, error: action.payload };

    case 'TOGGLE_ROW_EXPANSION':
      const newExpandedRows = new Set(state.expandedRows);
      if (newExpandedRows.has(action.payload)) {
        newExpandedRows.delete(action.payload);
      } else {
        newExpandedRows.add(action.payload);
      }
      return { ...state, expandedRows: newExpandedRows };

    case 'TOGGLE_FIELD_SELECTION':
      const newSelectedFields = new Set(state.selectedFields);
      if (newSelectedFields.has(action.payload)) {
        newSelectedFields.delete(action.payload);
      } else {
        newSelectedFields.add(action.payload);
      }
      return { ...state, selectedFields: newSelectedFields };

    case 'TOGGLE_FIELD_PIN':
      const newPinnedFields = new Set(state.pinnedFields);
      if (newPinnedFields.has(action.payload)) {
        newPinnedFields.delete(action.payload);
      } else {
        newPinnedFields.add(action.payload);
      }
      return { ...state, pinnedFields: newPinnedFields };

    case 'SET_FIELD_INFO':
      return { ...state, fieldInfo: action.payload };

    case 'SET_LEVEL_FILTER':
      return { ...state, levelFilter: action.payload };

    case 'SET_SOURCE_FILTER':
      return { ...state, sourceFilter: action.payload };

    case 'RESET_FILTERS':
      return {
        ...state,
        levelFilter: [],
        sourceFilter: [],
        selectedFields: new Set(['timestamp', 'level', 'message']),
        expandedRows: new Set(),
      };

    default:
      return state;
  }
}

interface LogsContextType {
  state: LogsState;
  dispatch: React.Dispatch<LogsAction>;
  // Helper functions
  setQuery: (query: string) => void;
  setTimeRange: (from: number, to: number) => void;
  toggleRowExpansion: (rowId: string) => void;
  toggleFieldSelection: (fieldName: string) => void;
  toggleFieldPin: (fieldName: string) => void;
  setLogsData: (logs: LogEntry[], histogram: Array<{ time: number; count: number }>, totalCount: number) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setFieldInfo: (fieldInfo: FieldInfo[]) => void;
  resetFilters: () => void;
}

const LogsContext = createContext<LogsContextType | undefined>(undefined);

export function LogsProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(logsReducer, initialState);

  const contextValue: LogsContextType = {
    state,
    dispatch,
    setQuery: (query: string) => dispatch({ type: 'SET_QUERY', payload: query }),
    setTimeRange: (from: number, to: number) => dispatch({ type: 'SET_TIME_RANGE', payload: { from, to } }),
    toggleRowExpansion: (rowId: string) => dispatch({ type: 'TOGGLE_ROW_EXPANSION', payload: rowId }),
    toggleFieldSelection: (fieldName: string) => dispatch({ type: 'TOGGLE_FIELD_SELECTION', payload: fieldName }),
    toggleFieldPin: (fieldName: string) => dispatch({ type: 'TOGGLE_FIELD_PIN', payload: fieldName }),
    setLogsData: (logs: LogEntry[], histogram: Array<{ time: number; count: number }>, totalCount: number) =>
      dispatch({ type: 'SET_LOGS_DATA', payload: { logs, histogram, totalCount } }),
    setLoading: (loading: boolean) => dispatch({ type: 'SET_LOADING', payload: loading }),
    setError: (error: string | null) => dispatch({ type: 'SET_ERROR', payload: error }),
    setFieldInfo: (fieldInfo: FieldInfo[]) => dispatch({ type: 'SET_FIELD_INFO', payload: fieldInfo }),
    resetFilters: () => dispatch({ type: 'RESET_FILTERS' }),
  };

  return (
    <LogsContext.Provider value={contextValue}>
      {children}
    </LogsContext.Provider>
  );
}

export function useLogsContext(): LogsContextType {
  const context = useContext(LogsContext);
  if (context === undefined) {
    throw new Error('useLogsContext must be used within a LogsProvider');
  }
  return context;
}

// Selector hooks for specific state slices
export function useLogsQuery() {
  const { state, setQuery } = useLogsContext();
  return { query: state.query, setQuery };
}

export function useLogsTimeRange() {
  const { state, setTimeRange } = useLogsContext();
  return { timeRange: state.timeRange, setTimeRange };
}

export function useLogsData() {
  const { state, setLogsData, setLoading, setError } = useLogsContext();
  return {
    logs: state.logs,
    histogram: state.histogram,
    loading: state.loading,
    error: state.error,
    totalCount: state.totalCount,
    setLogsData,
    setLoading,
    setError,
  };
}

export function useLogsUI() {
  const { state, toggleRowExpansion, toggleFieldSelection, toggleFieldPin, setFieldInfo, resetFilters } = useLogsContext();
  return {
    expandedRows: state.expandedRows,
    selectedFields: state.selectedFields,
    pinnedFields: state.pinnedFields,
    fieldInfo: state.fieldInfo,
    toggleRowExpansion,
    toggleFieldSelection,
    toggleFieldPin,
    setFieldInfo,
    resetFilters,
  };
}

export function useLogsFilters() {
  const { state } = useLogsContext();
  return {
    levelFilter: state.levelFilter,
    sourceFilter: state.sourceFilter,
  };
}
