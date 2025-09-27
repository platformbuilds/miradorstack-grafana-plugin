package mirador

import "time"

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
	Data []TraceData `json:"data"`
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
