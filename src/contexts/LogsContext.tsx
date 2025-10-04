import React, { createContext, useContext, useReducer, ReactNode, useEffect } from 'react';

// Temporary local types to replace removed Discover types
type LogEntry = Record<string, any>;
type FieldInfo = Record<string, any>;
import { useLogsData as useLogsDataHook } from '../hooks/useLogsData';
import { defaultConfig } from '../utils/config';

export interface LogsState {
  // Query state
  query: string;           // The current active query
  rawQuery: string;        // The query from the raw input
  builderQuery: string;    // The query from the builder
  queryMode: 'raw' | 'builder';
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
  | { type: 'SET_RAW_QUERY'; payload: string }
  | { type: 'SET_BUILDER_QUERY'; payload: string }
  | { type: 'SET_QUERY_MODE'; payload: 'raw' | 'builder' }
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

// Initialize the state with separate raw and builder queries from config
const initialState: LogsState = {
  query: defaultConfig.queryDefaults.rawQuery,  // Initial active query based on default raw query
  rawQuery: defaultConfig.queryDefaults.rawQuery, // Initial raw query from config
  builderQuery: defaultConfig.queryDefaults.builderQuery, // Default builder query from config
  queryMode: 'raw',                          // Default to raw query mode
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
      // This sets the active query regardless of mode
      return { ...state, query: action.payload };
    
    case 'SET_RAW_QUERY':
      // When setting raw query, update both raw storage and active query if in raw mode
      const newRawQuery = action.payload;
      console.log(`Setting raw query: "${newRawQuery}", current mode: ${state.queryMode}`);
      if (state.queryMode === 'raw') {
        console.log(`In raw mode - updating active query to match raw query: "${newRawQuery}"`);
        return { 
          ...state, 
          rawQuery: newRawQuery,
          query: newRawQuery // Also update active query
        };
      } else {
        console.log(`Not in raw mode - only updating stored raw query: "${newRawQuery}"`);
        return { ...state, rawQuery: newRawQuery };
      }    case 'SET_BUILDER_QUERY':
      // When setting builder query, update both builder storage and active query if in builder mode
      if (state.queryMode === 'builder') {
        return { 
          ...state, 
          builderQuery: action.payload,
          query: action.payload // Also update active query
        };
      } else {
        return { ...state, builderQuery: action.payload };
      }
      
    case 'SET_QUERY_MODE': {
      // When changing query mode, also update the active query based on the new mode
      const newMode = action.payload;
      const newQuery = newMode === 'raw' ? state.rawQuery : state.builderQuery;
      console.log(`Switching query mode to ${newMode}, using ${newMode} query: "${newQuery}"`);
      return { 
        ...state, 
        queryMode: newMode,
        query: newQuery // Important: Update the active query based on the selected mode
      };
    }

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
  setQuery: (query: string) => void;           // Sets the current active query
  setRawQuery: (query: string) => void;        // Sets the raw query
  setBuilderQuery: (query: string) => void;    // Sets the builder query
  setQueryMode: (mode: 'raw' | 'builder') => void;
  setTimeRange: (from: number, to: number) => void;
  toggleRowExpansion: (rowId: string) => void;
  toggleFieldSelection: (fieldName: string) => void;
  toggleFieldPin: (fieldName: string) => void;
  setLogsData: (logs: LogEntry[], histogram: Array<{ time: number; count: number }>, totalCount: number) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setFieldInfo: (fieldInfo: FieldInfo[]) => void;
  resetFilters: () => void;
  // Search function - now returns void since we're using setTimeout
  search: () => void;
}

const LogsContext = createContext<LogsContextType | undefined>(undefined);

export function LogsProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(logsReducer, initialState);

  // Initialize the active query based on mode on component mount
  useEffect(() => {
    // Set the active query based on the initial mode
    const activeQuery = state.queryMode === 'raw' ? state.rawQuery : state.builderQuery;
    console.log(`LogsProvider: Initializing active query based on mode ${state.queryMode}: "${activeQuery}"`);
    dispatch({ type: 'SET_QUERY', payload: activeQuery });
  }, []);

  // Use the data fetching hook
  const [cacheBuster, setCacheBuster] = React.useState(Date.now());
  const logsDataHook = useLogsDataHook({
    query: state.query,
    start: state.timeRange.from,
    end: state.timeRange.to,
    cacheBuster,
  });

  // Sync the hook data with context state
  useEffect(() => {
    console.log(`🔄 LogsContext effect triggered: logs=${logsDataHook.logs?.length || 0}, loading=${logsDataHook.loading}, error=${!!logsDataHook.error}`);
    
    // Always clear existing error on data update (whether successful or not)
    if (!logsDataHook.error) {
      dispatch({ type: 'SET_ERROR', payload: null });
    }
    
    // Check logs data before updating state
    const logs = logsDataHook.logs || [];
    
    // Log the current time to help with debugging
    const currentTime = new Date().toISOString();
    
    if (logs.length > 0) {
      console.log(`✅ Updating LogsContext state with ${logs.length} logs at ${currentTime}`);
      console.log(`📋 Sample log:`, JSON.stringify(logs[0]).substring(0, 200) + '...');
    } else {
      console.log(`ℹ️ No logs to update in state at ${currentTime}`);
    }
    
    // Always update logs data (we'll use key props in the components to force refresh)
    dispatch({
      type: 'SET_LOGS_DATA',
      payload: {
        logs: logs,
        histogram: logsDataHook.histogram || [],
        totalCount: logsDataHook.totalCount || 0,
      },
    });
    
    // Update loading state
    dispatch({ type: 'SET_LOADING', payload: logsDataHook.loading });
    
    // Update error state only if there's an actual error
    if (logsDataHook.error) {
      console.error(`❌ Error in logsDataHook:`, logsDataHook.error);
      
      // Only show error if we actually have no data
      if (!logsDataHook.logs || logsDataHook.logs.length === 0) {
        dispatch({ type: 'SET_ERROR', payload: logsDataHook.error });
      } else {
        // We have data despite an error, so clear the error
        dispatch({ type: 'SET_ERROR', payload: null });
      }
    }
  }, [logsDataHook.logs, logsDataHook.histogram, logsDataHook.totalCount, logsDataHook.loading, logsDataHook.error]);

    const contextValue: LogsContextType = {
    state,
    dispatch,
    setQuery: (query: string) => dispatch({ type: 'SET_QUERY', payload: query }),
    setRawQuery: (query: string) => dispatch({ type: 'SET_RAW_QUERY', payload: query }),
    setBuilderQuery: (query: string) => dispatch({ type: 'SET_BUILDER_QUERY', payload: query }),
    setQueryMode: (mode: 'raw' | 'builder') => dispatch({ type: 'SET_QUERY_MODE', payload: mode }),
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
  search: () => {
      // CRITICAL: Force update the active query right before search based on current mode
      // This ensures we're always using the most current query for the active mode
      let searchQuery;
      if (state.queryMode === 'raw') {
        searchQuery = state.rawQuery.trim() || '*';
        // Update the active query in the state
        dispatch({ type: 'SET_QUERY', payload: searchQuery });
      } else {
        searchQuery = state.builderQuery.trim() || '*';
        // Update the active query in the state  
        dispatch({ type: 'SET_QUERY', payload: searchQuery });
      }
      
      // Reset logs state to ensure UI updates with new data
      console.log('🧹 Clearing all logs data before search');
      dispatch({
        type: 'SET_LOGS_DATA',
        payload: {
          logs: [],
          histogram: [],
          totalCount: 0,
        },
      });
      
      // Set loading state immediately
      dispatch({ type: 'SET_LOADING', payload: true });
      
      // Clear any error state
      dispatch({ type: 'SET_ERROR', payload: null });
      
      // Enhanced logging for search initiation
      console.log(`============================================`);
      console.log(`🔍 SEARCH INITIATED using ${state.queryMode.toUpperCase()} MODE`);
      console.log(`📝 Current raw query: "${state.rawQuery}"`);
      console.log(`🔧 Current builder query: "${state.builderQuery}"`);
      console.log(`✅ USING QUERY: "${searchQuery}"`);
      console.log(`⏱️ TIME RANGE: from=${new Date(state.timeRange.from).toISOString()} (${state.timeRange.from}), to=${new Date(state.timeRange.to).toISOString()} (${state.timeRange.to})`);
      console.log(`============================================`);
      
      // Log the complete refetch parameters for debugging
      console.log('Refetch parameters:', {
        query: searchQuery,
        start: state.timeRange.from,
        end: state.timeRange.to,
      });
      
      // IMPORTANT: Clone the query params to avoid reference issues
      // and force the search query to be the correct one for the current mode
      const queryParams: any = {
        query: searchQuery,
        start: state.timeRange.from,
        end: state.timeRange.to,
      };
      
      // Debug: Print the actual network request
      console.log('NETWORK REQUEST:', JSON.stringify(queryParams));
      
      // Check if the query already includes a timestamp filter
      const hasTimestampFilter = searchQuery.includes('timestamp:') || 
                               searchQuery.includes('timestamp[') || 
                               searchQuery.includes('timestamp{');
      
      if (hasTimestampFilter) {
        console.log(`⚠️ WARNING: Query already contains timestamp filter. This might conflict with the time range parameters.`);
        console.log(`⚠️ Consider removing one of these filters to avoid conflicts.`);
      }
      
  // Add a cache-busting timestamp to force a fresh request
  const newCacheBuster = Date.now();
  queryParams.cacheBuster = newCacheBuster;
  setCacheBuster(newCacheBuster);
      
      console.log('🔍 SEARCH EXECUTING with query:', searchQuery);
      
      // Use a slight delay to ensure state updates are processed
      // Force a complete refresh
      return setTimeout(() => {
        console.log('🔄 Executing refetch with params:', queryParams);
        
        // This ensures we always get fresh data
        logsDataHook.refetch(queryParams);
      }, 100);
    },
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
  const { state, setQuery, setRawQuery, setBuilderQuery } = useLogsContext();
  return { 
    query: state.query,               // Current active query
    rawQuery: state.rawQuery,         // Raw mode query
    builderQuery: state.builderQuery, // Builder mode query
    setQuery,                         // Set active query directly
    setRawQuery,                      // Set raw query
    setBuilderQuery,                  // Set builder query
    queryMode: state.queryMode        // Current query mode
  };
}

// Hook to get and set query mode
export function useQueryMode() {
  const { state, setQueryMode } = useLogsContext();
  return { queryMode: state.queryMode, setQueryMode };
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
