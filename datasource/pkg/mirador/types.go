package mirador

import "time"

// Shared schema primitives

type SchemaField struct {
	Name          string   `json:"name"`
	Type          string   `json:"type"`
	Description   string   `json:"description,omitempty"`
	Examples      []string `json:"examples,omitempty"`
	Aggregatable  bool     `json:"aggregatable,omitempty"`
	Filterable    bool     `json:"filterable,omitempty"`
	DefaultFormat string   `json:"defaultFormat,omitempty"`
}

// Metrics schema

type MetricsSchema struct {
	Metrics []MetricDescriptor `json:"metrics"`
	Version string             `json:"version,omitempty"`
}

type MetricDescriptor struct {
	Name         string   `json:"name"`
	Type         string   `json:"type"`
	Unit         string   `json:"unit,omitempty"`
	Description  string   `json:"description,omitempty"`
	Labels       []string `json:"labels,omitempty"`
	Aggregations []string `json:"aggregations,omitempty"`
}

// Logs schema

type LogsSchema struct {
	Fields  []SchemaField `json:"fields"`
	Version string        `json:"version,omitempty"`
}

// Traces schema

type TracesSchema struct {
	Services []TraceServiceSchema `json:"services"`
	Version  string               `json:"version,omitempty"`
}

type TraceServiceSchema struct {
	Name        string               `json:"name"`
	Description string               `json:"description,omitempty"`
	Operations  []TraceOperationSpec `json:"operations,omitempty"`
	Attributes  []SchemaField        `json:"attributes,omitempty"`
}

type TraceOperationSpec struct {
	Name        string        `json:"name"`
	SpanKinds   []string      `json:"spanKinds,omitempty"`
	Attributes  []SchemaField `json:"attributes,omitempty"`
	Description string        `json:"description,omitempty"`
}

// TimeSpan captures ISO-8601 strings expected by Mirador APIs.
type TimeSpan struct {
	From string `json:"from"`
	To   string `json:"to"`
}

// Logs

type LogsQuery struct {
	Query     string    `json:"query"`
	Limit     int       `json:"limit,omitempty"`
	Fields    []string  `json:"fields,omitempty"`
	TimeRange *TimeSpan `json:"timeRange,omitempty"`
}

type LogsResponse struct {
	Results []RawLogEntry `json:"results"`
	Total   int           `json:"total"`
	Took    int           `json:"took"`
}

// RawLogEntry captures arbitrary log fields; we keep the raw map alongside typed accessors.
type RawLogEntry map[string]interface{}

func (r RawLogEntry) Timestamp() (time.Time, bool) {
	if ts, ok := r["_time"].(string); ok {
		parsed, err := time.Parse(time.RFC3339Nano, ts)
		if err == nil {
			return parsed, true
		}
	}
	return time.Time{}, false
}

func (r RawLogEntry) Field(name string) any {
	return r[name]
}

// Metrics

type MetricsQuery struct {
	Query string `json:"query"`
	Step  string `json:"step,omitempty"`
	Start string `json:"start,omitempty"`
	End   string `json:"end,omitempty"`
}

type MetricsResponse struct {
	Status string      `json:"status"`
	Data   MetricsData `json:"data"`
}

type MetricsData struct {
	ResultType string         `json:"resultType"`
	Result     []MetricResult `json:"result"`
}

type MetricResult struct {
	Metric map[string]string `json:"metric"`
	Value  []interface{}     `json:"value,omitempty"`
	Values [][]interface{}   `json:"values,omitempty"`
}

// Traces

type TracesQuery struct {
	Query string `json:"query"`
	Limit int    `json:"limit,omitempty"`
	Start string `json:"start,omitempty"`
	End   string `json:"end,omitempty"`
}

type TracesResponse struct {
	Data     TracesData     `json:"data"`
	Metadata TracesMetadata `json:"metadata"`
	Status   string         `json:"status"`
}

type TracesData struct {
	Total  int         `json:"total"`
	Traces []TraceData `json:"traces"`
}

type TracesMetadata struct {
	Backend     string `json:"backend"`
	Degraded    bool   `json:"degraded"`
	Limit       int    `json:"limit"`
	SearchTime  int    `json:"searchTime"`
	TracesFound int    `json:"tracesFound"`
}

type TraceData struct {
	TraceID  string      `json:"traceID"`
	Duration int64       `json:"duration"`
	Spans    []TraceSpan `json:"spans"`
}

type TraceSpan struct {
	SpanID        string            `json:"spanID"`
	OperationName string            `json:"operationName"`
	StartTime     int64             `json:"startTime"`
	Duration      int64             `json:"duration"`
	Tags          map[string]string `json:"tags"`
}
