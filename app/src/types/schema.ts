export interface SchemaField {
  name: string;
  type: string;
  description?: string;
  examples?: string[];
  aggregatable?: boolean;
  filterable?: boolean;
  defaultFormat?: string;
}

export interface LogsSchema {
  fields: SchemaField[];
  version?: string;
}

export interface MetricDescriptor {
  name: string;
  type: string;
  unit?: string;
  description?: string;
  labels?: string[];
  aggregations?: string[];
}

export interface MetricsSchema {
  metrics: MetricDescriptor[];
  version?: string;
}

export interface TraceOperationSpec {
  name: string;
  spanKinds?: string[];
  attributes?: SchemaField[];
  description?: string;
}

export interface TraceServiceSchema {
  name: string;
  description?: string;
  operations?: TraceOperationSpec[];
  attributes?: SchemaField[];
}

export interface TracesSchema {
  services: TraceServiceSchema[];
  version?: string;
}
