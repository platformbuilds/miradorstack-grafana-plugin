import { useCallback, useEffect, useState } from 'react';

import { SchemaApi, SchemaApiError } from '../api/schema';
import type { LogsSchema, MetricsSchema, TracesSchema } from '../types/schema';

type SchemaState = {
  logs?: LogsSchema;
  metrics?: MetricsSchema;
  traces?: TracesSchema;
  loading: boolean;
  error?: string;
};

const initialState: SchemaState = {
  logs: undefined,
  metrics: undefined,
  traces: undefined,
  loading: false,
  error: undefined,
};

export const useSchema = (datasourceUid?: string) => {
  const [state, setState] = useState<SchemaState>(() => ({
    ...initialState,
    loading: Boolean(datasourceUid),
  }));
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let cancelled = false;

    if (!datasourceUid) {
      setState({ ...initialState, loading: false, error: undefined });
      return () => {
        cancelled = true;
      };
    }

    setState((current) => ({ ...current, loading: true, error: undefined }));

    const api = new SchemaApi(datasourceUid);

    const fetchSchema = async () => {
      try {
        const [logs, metrics, traces] = await Promise.all([
          api.listLogFields(),
          api.listMetrics(),
          api.listTraceServices(),
        ]);

        if (cancelled) {
          return;
        }

        setState({
          logs,
          metrics,
          traces,
          loading: false,
          error: undefined,
        });
      } catch (error) {
        if (cancelled) {
          return;
        }

        const message =
          error instanceof SchemaApiError
            ? error.message
            : error instanceof Error
            ? error.message
            : 'Failed to load schema';

        setState({
          ...initialState,
          loading: false,
          error: message,
        });
      }
    };

    void fetchSchema();

    return () => {
      cancelled = true;
    };
  }, [datasourceUid, reloadToken]);

  const reload = useCallback(() => {
    setReloadToken((token) => token + 1);
  }, []);

  return {
    ...state,
    reload,
    hasDatasource: Boolean(datasourceUid),
  };
};
