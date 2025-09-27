import React, { FormEvent, useMemo, useState } from 'react';
import { AppRootProps } from '@grafana/data';
import {
  Alert,
  Badge,
  Button,
  Field,
  HorizontalGroup,
  Icon,
  Input,
  Modal,
  Spinner,
  Switch,
  TextArea,
  useStyles2,
} from '@grafana/ui';
import { css } from '@emotion/css';

import { testIds } from '../../components/testIds';
import { useSchema } from '../../hooks/useSchema';
import type { MetricDescriptor, SchemaField, TraceOperationSpec, TraceServiceSchema } from '../../types/schema';
import { SchemaApi, SchemaApiError } from '../../api/schema';

type SchemaTab = 'logs' | 'metrics' | 'traces';

type SchemaMeta = {
  datasourceUid?: string;
};

type LogFieldForm = {
  name: string;
  type: string;
  description: string;
  examples: string;
  aggregatable: boolean;
  filterable: boolean;
  defaultFormat: string;
};

type MetricForm = {
  name: string;
  type: string;
  unit: string;
  description: string;
  labels: string;
  aggregations: string;
};

type TraceForm = {
  name: string;
  description: string;
  operations: string;
};

const SchemaPage: React.FC<AppRootProps> = ({ meta }) => {
  const styles = useStyles2(getStyles);
  const datasourceUid = (meta?.jsonData as SchemaMeta | undefined)?.datasourceUid;
  const { logs, metrics, traces, loading, error, reload, hasDatasource } = useSchema(datasourceUid);

  const [activeTab, setActiveTab] = useState<SchemaTab>('logs');
  const [search, setSearch] = useState('');
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorMode, setEditorMode] = useState<SchemaTab>('logs');
  const [editorInitialName, setEditorInitialName] = useState<string | undefined>(undefined);
  const [logForm, setLogForm] = useState<LogFieldForm>({
    name: '',
    type: 'keyword',
    description: '',
    examples: '',
    aggregatable: false,
    filterable: true,
    defaultFormat: '',
  });
  const [metricForm, setMetricForm] = useState<MetricForm>({
    name: '',
    type: 'counter',
    unit: '',
    description: '',
    labels: '',
    aggregations: '',
  });
  const [traceForm, setTraceForm] = useState<TraceForm>({
    name: '',
    description: '',
    operations: '',
  });
  const [editorError, setEditorError] = useState<string | undefined>(undefined);
  const [saving, setSaving] = useState(false);

  const filterValue = search.trim().toLowerCase();

  const schemaApi = useMemo(() => (datasourceUid ? new SchemaApi(datasourceUid) : null), [datasourceUid]);

  const logFields = useMemo(
    () => filterLogFields(logs?.fields ?? [], filterValue),
    [logs?.fields, filterValue]
  );

  const metricDescriptors = useMemo(
    () => filterMetrics(metrics?.metrics ?? [], filterValue),
    [metrics?.metrics, filterValue]
  );

  const traceServices = useMemo(
    () => filterTraceServices(traces?.services ?? [], filterValue),
    [traces?.services, filterValue]
  );

  const counts = {
    logs: logs?.fields.length ?? 0,
    metrics: metrics?.metrics.length ?? 0,
    traces: traces?.services.length ?? 0,
  };

  const versionLabel = useMemo(() => {
    if (activeTab === 'logs') {
      return logs?.version;
    }
    if (activeTab === 'metrics') {
      return metrics?.version;
    }
    return traces?.version;
  }, [activeTab, logs?.version, metrics?.version, traces?.version]);

  const activeEmptyState = useMemo(() => {
    if (!filterValue) {
      return 'No schema entries were returned. Confirm Mirador Core schema APIs are enabled.';
    }
    return 'No schema entries match your filter.';
  }, [filterValue]);

  const openEditor = (mode: SchemaTab, value?: SchemaField | MetricDescriptor | TraceServiceSchema) => {
    setEditorMode(mode);
    setEditorError(undefined);
    setSaving(false);

    const getName = (item: SchemaField | MetricDescriptor | TraceServiceSchema | undefined) =>
      item ? (item as { name: string }).name : undefined;

    setEditorInitialName(getName(value));

    if (mode === 'logs') {
      const field = value as SchemaField | undefined;
      setLogForm({
        name: field?.name ?? '',
        type: field?.type ?? 'keyword',
        description: field?.description ?? '',
        examples: field?.examples?.join(', ') ?? '',
        aggregatable: field?.aggregatable ?? false,
        filterable: field?.filterable ?? true,
        defaultFormat: field?.defaultFormat ?? '',
      });
    } else if (mode === 'metrics') {
      const metric = value as MetricDescriptor | undefined;
      setMetricForm({
        name: metric?.name ?? '',
        type: metric?.type ?? 'counter',
        unit: metric?.unit ?? '',
        description: metric?.description ?? '',
        labels: metric?.labels?.join(', ') ?? '',
        aggregations: metric?.aggregations?.join(', ') ?? '',
      });
    } else {
      const service = value as TraceServiceSchema | undefined;
      setTraceForm({
        name: service?.name ?? '',
        description: service?.description ?? '',
        operations:
          service?.operations
            ?.map((operation) => {
              const parts = [operation.name];
              if (operation.spanKinds && operation.spanKinds.length > 0) {
                parts.push(operation.spanKinds.join(','));
              }
              if (operation.description) {
                parts.push(operation.description);
              }
              return parts.join(' | ');
            })
            .join('\n') ?? '',
      });
    }

    setEditorOpen(true);
  };

  const closeEditor = () => {
    setEditorOpen(false);
    setEditorError(undefined);
  };

  const parseList = (value: string) =>
    value
      .split(',')
      .map((item) => item.trim())
      .filter((item) => item.length > 0);

  const parseOperations = (value: string): TraceOperationSpec[] =>
    value
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .map((line) => {
        const [rawName, rawKinds, rawDescription] = line.split('|').map((part) => part.trim());
        const spanKinds = rawKinds ? parseList(rawKinds) : undefined;
        const description = rawDescription ? rawDescription : undefined;
        return {
          name: rawName,
          spanKinds: spanKinds && spanKinds.length > 0 ? spanKinds : undefined,
          description,
        };
      });

  const handleEditorSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!schemaApi) {
      setEditorError('Configure a Mirador datasource UID before editing schema definitions.');
      return;
    }

    setSaving(true);
    setEditorError(undefined);

    try {
      if (editorMode === 'logs') {
        const payload: SchemaField = {
          name: logForm.name.trim(),
          type: logForm.type.trim(),
          description: logForm.description.trim() || undefined,
          examples: parseList(logForm.examples),
          aggregatable: logForm.aggregatable,
          filterable: logForm.filterable,
          defaultFormat: logForm.defaultFormat.trim() || undefined,
        };
        await schemaApi.saveLogField(payload);
      } else if (editorMode === 'metrics') {
        const payload: MetricDescriptor = {
          name: metricForm.name.trim(),
          type: metricForm.type.trim(),
          unit: metricForm.unit.trim() || undefined,
          description: metricForm.description.trim() || undefined,
          labels: parseList(metricForm.labels),
          aggregations: parseList(metricForm.aggregations),
        };
        await schemaApi.saveMetric(payload);
      } else {
        const payload: TraceServiceSchema = {
          name: traceForm.name.trim(),
          description: traceForm.description.trim() || undefined,
          operations: parseOperations(traceForm.operations),
        };
        await schemaApi.saveTraceService(payload);
      }

      reload();
      setEditorOpen(false);
    } catch (schemaError) {
      const message =
        schemaError instanceof SchemaApiError
          ? schemaError.message
          : schemaError instanceof Error
          ? schemaError.message
          : 'Failed to save schema definition';
      setEditorError(message);
    } finally {
      setSaving(false);
    }
  };

  const addButtonLabel =
    activeTab === 'logs' ? 'New log field' : activeTab === 'metrics' ? 'New metric' : 'New trace service';

  const editorTitle =
    editorMode === 'logs'
      ? editorInitialName
        ? 'Edit log field'
        : 'New log field'
      : editorMode === 'metrics'
      ? editorInitialName
        ? 'Edit metric'
        : 'New metric'
      : editorInitialName
      ? 'Edit trace service'
      : 'New trace service';

  const isSaveDisabled =
    (editorMode === 'logs' && (!logForm.name.trim() || !logForm.type.trim())) ||
    (editorMode === 'metrics' && (!metricForm.name.trim() || !metricForm.type.trim())) ||
    (editorMode === 'traces' && !traceForm.name.trim());

  const renderActiveTab = () => {
    if (activeTab === 'logs') {
      return renderLogs(logFields, (field) => openEditor('logs', field));
    }

    if (activeTab === 'metrics') {
      return renderMetrics(metricDescriptors, (metric) => openEditor('metrics', metric));
    }

    return renderTraces(traceServices, (service) => openEditor('traces', service));
  };

  return (
    <div className={styles.wrapper} data-testid={testIds.schemaPage.container}>
      <header className={styles.header}>
        <div className={styles.headline}>
          <Icon name="layers" />
          <div>
            <h1 className={styles.title}>Schema Browser</h1>
            <span className={styles.subtitle}>Mirador Explorer / Schema Browser</span>
          </div>
        </div>
        <HorizontalGroup spacing="sm" align="center">
          {loading && <Spinner size={20} />}
          <Button
            variant="primary"
            icon="plus"
            onClick={() => openEditor(activeTab)}
            disabled={!hasDatasource}
          >
            {addButtonLabel}
          </Button>
          <Button
            variant="secondary"
            onClick={reload}
            disabled={!hasDatasource}
            data-testid={testIds.schemaPage.reload}
          >
            Refresh
          </Button>
        </HorizontalGroup>
      </header>

      {!hasDatasource && (
        <Alert severity="warning" title="Datasource missing">
          Configure the Mirador Core Connector datasource UID in the app configuration to browse schema metadata.
        </Alert>
      )}

      {hasDatasource && error && (
        <Alert severity="error" title="Unable to load schema">
          {error}
        </Alert>
      )}

      {hasDatasource && (
        <>
          <div className={styles.controls}>
            <Input
              width={50}
              prefix={<Icon name="search" />}
              placeholder="Filter fields, metrics, or services"
              value={search}
              onChange={(event) => setSearch(event.currentTarget.value)}
              data-testid={testIds.schemaPage.search}
            />
          </div>

          <div className={styles.tabs}>
            <Button
              variant={activeTab === 'logs' ? 'primary' : 'secondary'}
              onClick={() => setActiveTab('logs')}
              data-testid={testIds.schemaPage.tabLogs}
            >
              Logs ({counts.logs})
            </Button>
            <Button
              variant={activeTab === 'metrics' ? 'primary' : 'secondary'}
              onClick={() => setActiveTab('metrics')}
              data-testid={testIds.schemaPage.tabMetrics}
            >
              Metrics ({counts.metrics})
            </Button>
            <Button
              variant={activeTab === 'traces' ? 'primary' : 'secondary'}
              onClick={() => setActiveTab('traces')}
              data-testid={testIds.schemaPage.tabTraces}
            >
              Traces ({counts.traces})
            </Button>
          </div>

          {versionLabel && <div className={styles.version}>Schema version: {versionLabel}</div>}

          <section className={styles.content}>
            {renderActiveTab() || <div className={styles.empty}>{activeEmptyState}</div>}
          </section>

          {editorOpen && (
            <Modal title={editorTitle} isOpen onDismiss={closeEditor} className={styles.modal}>
              {editorError && (
                <Alert severity="error" title="Unable to save" className={styles.modalMessage}>
                  {editorError}
                </Alert>
              )}
              <form className={styles.form} onSubmit={handleEditorSubmit}>
                {editorMode === 'logs' && (
                  <>
                    <Field label="Field name" required>
                      <Input
                        value={logForm.name}
                        onChange={(event) => {
                          const value = event.currentTarget.value;
                          setLogForm((current) => ({ ...current, name: value }));
                        }}
                        placeholder="service"
                      />
                    </Field>
                    <Field label="Field type" required>
                      <Input
                        value={logForm.type}
                        onChange={(event) => {
                          const value = event.currentTarget.value;
                          setLogForm((current) => ({ ...current, type: value }));
                        }}
                        placeholder="keyword"
                      />
                    </Field>
                    <Field label="Description">
                      <TextArea
                        value={logForm.description}
                        rows={3}
                        onChange={(event) => {
                          const value = event.currentTarget.value;
                          setLogForm((current) => ({ ...current, description: value }));
                        }}
                      />
                    </Field>
                    <Field label="Examples">
                      <Input
                        value={logForm.examples}
                        placeholder="payments, checkout"
                        onChange={(event) => {
                          const value = event.currentTarget.value;
                          setLogForm((current) => ({ ...current, examples: value }));
                        }}
                      />
                    </Field>
                    <Field label="Default format">
                      <Input
                        value={logForm.defaultFormat}
                        placeholder="string"
                        onChange={(event) => {
                          const value = event.currentTarget.value;
                          setLogForm((current) => ({ ...current, defaultFormat: value }));
                        }}
                      />
                    </Field>
                    <div className={styles.checkboxRow}>
                      <Switch
                        label="Aggregatable"
                        value={logForm.aggregatable}
                        onChange={(event) => {
                          const checked = event.currentTarget.checked;
                          setLogForm((current) => ({ ...current, aggregatable: checked }));
                        }}
                      />
                      <Switch
                        label="Filterable"
                        value={logForm.filterable}
                        onChange={(event) => {
                          const checked = event.currentTarget.checked;
                          setLogForm((current) => ({ ...current, filterable: checked }));
                        }}
                      />
                    </div>
                  </>
                )}

                {editorMode === 'metrics' && (
                  <>
                    <Field label="Metric name" required>
                      <Input
                        value={metricForm.name}
                        onChange={(event) => {
                          const value = event.currentTarget.value;
                          setMetricForm((current) => ({ ...current, name: value }));
                        }}
                        placeholder="http_requests_total"
                      />
                    </Field>
                    <Field label="Metric type" required>
                      <Input
                        value={metricForm.type}
                        onChange={(event) => {
                          const value = event.currentTarget.value;
                          setMetricForm((current) => ({ ...current, type: value }));
                        }}
                        placeholder="counter"
                      />
                    </Field>
                    <Field label="Description">
                      <TextArea
                        value={metricForm.description}
                        rows={3}
                        onChange={(event) => {
                          const value = event.currentTarget.value;
                          setMetricForm((current) => ({ ...current, description: value }));
                        }}
                      />
                    </Field>
                    <Field label="Unit">
                      <Input
                        value={metricForm.unit}
                        placeholder="requests"
                        onChange={(event) => {
                          const value = event.currentTarget.value;
                          setMetricForm((current) => ({ ...current, unit: value }));
                        }}
                      />
                    </Field>
                    <Field label="Labels (comma separated)">
                      <Input
                        value={metricForm.labels}
                        placeholder="service,status"
                        onChange={(event) => {
                          const value = event.currentTarget.value;
                          setMetricForm((current) => ({ ...current, labels: value }));
                        }}
                      />
                    </Field>
                    <Field label="Aggregations (comma separated)">
                      <Input
                        value={metricForm.aggregations}
                        placeholder="sum, avg"
                        onChange={(event) => {
                          const value = event.currentTarget.value;
                          setMetricForm((current) => ({ ...current, aggregations: value }));
                        }}
                      />
                    </Field>
                  </>
                )}

                {editorMode === 'traces' && (
                  <>
                    <Field label="Service name" required>
                      <Input
                        value={traceForm.name}
                        onChange={(event) => {
                          const value = event.currentTarget.value;
                          setTraceForm((current) => ({ ...current, name: value }));
                        }}
                        placeholder="checkout"
                      />
                    </Field>
                    <Field label="Description">
                      <TextArea
                        value={traceForm.description}
                        rows={3}
                        onChange={(event) => {
                          const value = event.currentTarget.value;
                          setTraceForm((current) => ({ ...current, description: value }));
                        }}
                      />
                    </Field>
                    <Field
                      label="Operations (one per line: name | spanKinds | description)"
                      description="Example: GET /health | server | Health check handler"
                    >
                      <TextArea
                        value={traceForm.operations}
                        rows={4}
                        onChange={(event) => {
                          const value = event.currentTarget.value;
                          setTraceForm((current) => ({ ...current, operations: value }));
                        }}
                      />
                    </Field>
                  </>
                )}

                <Modal.ButtonRow>
                  <Button type="button" variant="secondary" onClick={closeEditor} disabled={saving}>
                    Cancel
                  </Button>
                  <Button type="submit" variant="primary" disabled={isSaveDisabled || saving}>
                    Save
                  </Button>
                </Modal.ButtonRow>
              </form>
            </Modal>
          )}
        </>
      )}
    </div>
  );
};

const renderLogs = (fields: SchemaField[], onEdit: (field: SchemaField) => void) => {
  if (!fields.length) {
    return undefined;
  }

  return (
    <ul className={stylesFactory.list}>
      {fields.map((field) => (
        <li key={field.name} className={stylesFactory.card}>
          <div className={stylesFactory.cardHeader}>
            <span className={stylesFactory.cardTitle}>{field.name}</span>
            <Badge text={field.type} color="blue" />
          </div>
          {field.description && <p className={stylesFactory.description}>{field.description}</p>}
          <div className={stylesFactory.chips}>
            {field.aggregatable && <Badge text="Aggregatable" color="purple" />}
            {field.filterable && <Badge text="Filterable" color="purple" />}
          </div>
          {field.examples && field.examples.length > 0 && (
            <div className={stylesFactory.examples}>
              <span className={stylesFactory.examplesLabel}>Examples:</span>
              <ul>
                {field.examples.slice(0, 3).map((example) => (
                  <li key={`${field.name}-${example}`}>{example}</li>
                ))}
              </ul>
            </div>
          )}
          <div className={stylesFactory.cardActions}>
            <Button size="sm" variant="secondary" icon="pen" onClick={() => onEdit(field)}>
              Edit
            </Button>
          </div>
        </li>
      ))}
    </ul>
  );
};

const renderMetrics = (metrics: MetricDescriptor[], onEdit: (metric: MetricDescriptor) => void) => {
  if (!metrics.length) {
    return undefined;
  }

  return (
    <ul className={stylesFactory.list}>
      {metrics.map((metric) => (
        <li key={metric.name} className={stylesFactory.card}>
          <div className={stylesFactory.cardHeader}>
            <span className={stylesFactory.cardTitle}>{metric.name}</span>
            <Badge text={metric.type} color="green" />
          </div>
          {metric.description && <p className={stylesFactory.description}>{metric.description}</p>}
          <div className={stylesFactory.metaRow}>
            {metric.unit && <span className={stylesFactory.metaValue}>Unit: {metric.unit}</span>}
            {metric.labels && metric.labels.length > 0 && (
              <span className={stylesFactory.metaValue}>Labels: {metric.labels.join(', ')}</span>
            )}
          </div>
          {metric.aggregations && metric.aggregations.length > 0 && (
            <div className={stylesFactory.chips}>
              {metric.aggregations.map((aggregation) => (
                <Badge key={`${metric.name}-${aggregation}`} text={aggregation} color="orange" />
              ))}
            </div>
          )}
          <div className={stylesFactory.cardActions}>
            <Button size="sm" variant="secondary" icon="pen" onClick={() => onEdit(metric)}>
              Edit
            </Button>
          </div>
        </li>
      ))}
    </ul>
  );
};

const renderTraces = (services: TraceServiceSchema[], onEdit: (service: TraceServiceSchema) => void) => {
  if (!services.length) {
    return undefined;
  }

  return (
    <ul className={stylesFactory.list}>
      {services.map((service) => (
        <li key={service.name} className={stylesFactory.card}>
          <div className={stylesFactory.cardHeader}>
            <span className={stylesFactory.cardTitle}>{service.name}</span>
            {service.attributes && service.attributes.length > 0 && (
              <Badge text={`${service.attributes.length} attributes`} color="purple" />
            )}
          </div>
          {service.description && <p className={stylesFactory.description}>{service.description}</p>}
          {service.operations && service.operations.length > 0 && (
            <div className={stylesFactory.operations}>
              <span className={stylesFactory.examplesLabel}>Operations:</span>
              <ul>
                {service.operations.map((operation) => (
                  <li key={`${service.name}-${operation.name}`}>
                    <span className={stylesFactory.operationName}>{operation.name}</span>
                    {operation.spanKinds && operation.spanKinds.length > 0 && (
                      <span className={stylesFactory.metaValue}>({operation.spanKinds.join(', ')})</span>
                    )}
                    {operation.description && (
                      <p className={stylesFactory.operationDescription}>{operation.description}</p>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className={stylesFactory.cardActions}>
            <Button size="sm" variant="secondary" icon="pen" onClick={() => onEdit(service)}>
              Edit
            </Button>
          </div>
        </li>
      ))}
    </ul>
  );
};

const filterLogFields = (fields: SchemaField[], needle: string) => {
  if (!needle) {
    return fields;
  }

  return fields.filter((field) =>
    [
      field.name,
      field.type,
      field.description,
      ...(field.examples ?? []),
    ]
      .filter(Boolean)
      .map((value) => String(value).toLowerCase())
      .some((value) => value.includes(needle))
  );
};

const filterMetrics = (metrics: MetricDescriptor[], needle: string) => {
  if (!needle) {
    return metrics;
  }

  return metrics.filter((metric) =>
    [
      metric.name,
      metric.type,
      metric.unit,
      metric.description,
      ...(metric.labels ?? []),
      ...(metric.aggregations ?? []),
    ]
      .filter(Boolean)
      .map((value) => String(value).toLowerCase())
      .some((value) => value.includes(needle))
  );
};

const filterTraceServices = (services: TraceServiceSchema[], needle: string) => {
  if (!needle) {
    return services;
  }

  const filtered: TraceServiceSchema[] = [];

  services.forEach((service) => {
    const matchesService = [service.name, service.description]
      .filter(Boolean)
      .map((value) => String(value).toLowerCase())
      .some((value) => value.includes(needle));

    const filteredOperations = (service.operations ?? []).filter((operation) =>
      matchesOperation(operation, needle)
    );

    if (matchesService || filteredOperations.length > 0) {
      filtered.push({
        ...service,
        operations: matchesService ? service.operations : filteredOperations,
      });
    }
  });

  return filtered;
};

const matchesOperation = (operation: TraceOperationSpec, needle: string) =>
  [operation.name, operation.description, ...(operation.spanKinds ?? [])]
    .filter(Boolean)
    .map((value) => String(value).toLowerCase())
    .some((value) => value.includes(needle));

const stylesFactory = {
  list: css`
    display: grid;
    gap: 1rem;
    margin: 0;
    padding: 0;
    list-style: none;
  `,
  card: css`
    border: 1px solid var(--grafana-panel-border);
    border-radius: 4px;
    padding: 1rem;
    background: var(--grafana-background-secondary);
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  `,
  cardHeader: css`
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 0.5rem;
  `,
  cardTitle: css`
    font-weight: 600;
    font-size: 1rem;
  `,
  description: css`
    margin: 0;
    color: var(--grafana-text-secondary);
  `,
  chips: css`
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  `,
  cardActions: css`
    display: flex;
    justify-content: flex-end;
  `,
  examples: css`
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  `,
  examplesLabel: css`
    font-weight: 600;
    font-size: 0.875rem;
  `,
  metaRow: css`
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
    align-items: center;
    color: var(--grafana-text-secondary);
  `,
  metaValue: css`
    display: inline-flex;
    gap: 0.25rem;
    align-items: center;
  `,
  operations: css`
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  `,
  operationName: css`
    font-weight: 600;
  `,
  operationDescription: css`
    margin: 0;
    color: var(--grafana-text-secondary);
  `,
};

const getStyles = () => ({
  wrapper: css`
    display: flex;
    flex-direction: column;
    gap: 1rem;
    padding: 1rem;
  `,
  header: css`
    display: flex;
    justify-content: space-between;
    align-items: center;
  `,
  headline: css`
    display: flex;
    align-items: center;
    gap: 0.75rem;
  `,
  title: css`
    margin: 0;
    font-size: 1.25rem;
  `,
  subtitle: css`
    font-size: 12px;
    color: var(--grafana-text-secondary);
  `,
  controls: css`
    display: flex;
    justify-content: flex-start;
  `,
  tabs: css`
    display: flex;
    gap: 0.5rem;
  `,
  version: css`
    font-size: 12px;
    color: var(--grafana-text-secondary);
  `,
  content: css`
    min-height: 240px;
  `,
  empty: css`
    padding: 2rem;
    text-align: center;
    color: var(--grafana-text-secondary);
  `,
  modal: css`
    width: 600px;
    max-width: 95vw;
  `,
  modalMessage: css`
    margin-bottom: 1rem;
  `,
  form: css`
    display: flex;
    flex-direction: column;
    gap: 1rem;
  `,
  checkboxRow: css`
    display: flex;
    gap: 1rem;
    flex-wrap: wrap;
    align-items: center;
  `,
});

export default SchemaPage;
