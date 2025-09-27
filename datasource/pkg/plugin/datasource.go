package plugin

import (
	"context"
	"encoding/json"
	"fmt"
	"math"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/grafana/grafana-plugin-sdk-go/backend"
	"github.com/grafana/grafana-plugin-sdk-go/backend/instancemgmt"
	"github.com/grafana/grafana-plugin-sdk-go/data"
	"github.com/miradorstack/mirador-core-connector/pkg/mirador"
	"github.com/miradorstack/mirador-core-connector/pkg/models"
)

// Make sure Datasource implements required interfaces. This is important to do
// since otherwise we will only get a not implemented error response from plugin in
// runtime. In this example datasource instance implements backend.QueryDataHandler,
// backend.CheckHealthHandler interfaces. Plugin should not implement all these
// interfaces - only those which are required for a particular task.
var (
	_ backend.QueryDataHandler      = (*Datasource)(nil)
	_ backend.CheckHealthHandler    = (*Datasource)(nil)
	_ instancemgmt.InstanceDisposer = (*Datasource)(nil)
)

var testHTTPClient *http.Client

// NewDatasource creates a new datasource instance.
func NewDatasource(_ context.Context, _ backend.DataSourceInstanceSettings) (instancemgmt.Instance, error) {
	return &Datasource{}, nil
}

// Datasource is an example datasource which can respond to data queries, reports
// its health and has streaming skills.
type Datasource struct{}

// Dispose here tells plugin SDK that plugin wants to clean up resources when a new instance
// created. As soon as datasource settings change detected by SDK old datasource instance will
// be disposed and a new one will be created using NewSampleDatasource factory function.
func (d *Datasource) Dispose() {
	// Clean up datasource instance resources.
}

// QueryData handles multiple queries and returns multiple responses.
// req contains the queries []DataQuery (where each query contains RefID as a unique identifier).
// The QueryDataResponse contains a map of RefID to the response for each query, and each response
// contains Frames ([]*Frame).
func (d *Datasource) QueryData(ctx context.Context, req *backend.QueryDataRequest) (*backend.QueryDataResponse, error) {
	// create response struct
	response := backend.NewQueryDataResponse()

	// loop over queries and execute them individually.
	for _, q := range req.Queries {
		res := d.query(ctx, req.PluginContext, q)

		// save the response in a hashmap
		// based on with RefID as identifier
		response.Responses[q.RefID] = res
	}

	return response, nil
}

type queryModel struct {
	QueryType     string   `json:"queryType"`
	Query         string   `json:"query"`
	QueryLanguage string   `json:"queryLanguage"`
	Limit         int      `json:"limit"`
	Fields        []string `json:"fields"`
	Step          string   `json:"step"`
}

func (d *Datasource) query(ctx context.Context, pCtx backend.PluginContext, query backend.DataQuery) backend.DataResponse {
	settings, err := models.LoadPluginSettings(*pCtx.DataSourceInstanceSettings)
	if err != nil {
		return backend.ErrDataResponse(backend.StatusInternal, fmt.Sprintf("load settings: %v", err))
	}

	if settings.URL == "" {
		return backend.ErrDataResponse(backend.StatusBadRequest, "Mirador API URL is not configured")
	}

	if settings.Secrets == nil || settings.Secrets.BearerToken == "" {
		return backend.ErrDataResponse(backend.StatusBadRequest, "Bearer token is required")
	}

	client, err := newMiradorClient(settings)
	if err != nil {
		return backend.ErrDataResponse(backend.StatusBadRequest, err.Error())
	}

	var model queryModel
	if err := json.Unmarshal(query.JSON, &model); err != nil {
		return backend.ErrDataResponse(backend.StatusBadRequest, fmt.Sprintf("json unmarshal: %v", err))
	}

	switch strings.ToLower(model.QueryType) {
	case "metrics":
		return d.queryMetrics(ctx, client, query, model)
	case "traces":
		return d.queryTraces(ctx, client, query, model)
	default:
		return d.queryLogs(ctx, client, query, model)
	}
}

func (d *Datasource) queryLogs(ctx context.Context, client *mirador.Client, query backend.DataQuery, model queryModel) backend.DataResponse {
	payload := mirador.LogsQuery{
		Query:  model.Query,
		Limit:  model.Limit,
		Fields: model.Fields,
	}
	if !query.TimeRange.From.IsZero() {
		payload.TimeRange = &mirador.TimeSpan{
			From: query.TimeRange.From.UTC().Format(time.RFC3339Nano),
			To:   query.TimeRange.To.UTC().Format(time.RFC3339Nano),
		}
	}

	resp, err := client.QueryLogs(ctx, payload)
	if err != nil {
		return backend.ErrDataResponse(backend.StatusInternal, err.Error())
	}

	frames := logsToFrame(resp)
	return backend.DataResponse{Frames: frames}
}

func (d *Datasource) queryMetrics(ctx context.Context, client *mirador.Client, query backend.DataQuery, model queryModel) backend.DataResponse {
	step := model.Step
	if step == "" && query.Interval > 0 {
		step = formatDuration(query.Interval)
	}
	if step == "" {
		step = "1m"
	}

	payload := mirador.MetricsQuery{
		Query: model.Query,
		Step:  step,
		Start: query.TimeRange.From.UTC().Format(time.RFC3339Nano),
		End:   query.TimeRange.To.UTC().Format(time.RFC3339Nano),
	}

	resp, err := client.QueryMetrics(ctx, payload)
	if err != nil {
		return backend.ErrDataResponse(backend.StatusInternal, err.Error())
	}

	frames := metricsToFrames(resp)
	return backend.DataResponse{Frames: frames}
}

func (d *Datasource) queryTraces(ctx context.Context, client *mirador.Client, query backend.DataQuery, model queryModel) backend.DataResponse {
	payload := mirador.TracesQuery{
		Query: model.Query,
		Limit: model.Limit,
		Start: query.TimeRange.From.UTC().Format(time.RFC3339Nano),
		End:   query.TimeRange.To.UTC().Format(time.RFC3339Nano),
	}

	resp, err := client.QueryTraces(ctx, payload)
	if err != nil {
		return backend.ErrDataResponse(backend.StatusInternal, err.Error())
	}

	frame := tracesToFrame(resp)
	return backend.DataResponse{Frames: data.Frames{frame}}
}

// CheckHealth handles health checks sent from Grafana to the plugin.
// The main use case for these health checks is the test button on the
// datasource configuration page which allows users to verify that
// a datasource is working as expected.
func (d *Datasource) CheckHealth(ctx context.Context, req *backend.CheckHealthRequest) (*backend.CheckHealthResult, error) {
	res := &backend.CheckHealthResult{}
	config, err := models.LoadPluginSettings(*req.PluginContext.DataSourceInstanceSettings)

	if err != nil {
		res.Status = backend.HealthStatusError
		res.Message = "Unable to load settings"
		return res, nil
	}

	if config.URL == "" {
		res.Status = backend.HealthStatusError
		res.Message = "Mirador API URL is missing"
		return res, nil
	}

	if config.Secrets == nil || config.Secrets.BearerToken == "" {
		res.Status = backend.HealthStatusError
		res.Message = "Bearer token is missing"
		return res, nil
	}

	client, err := newMiradorClient(config)
	if err != nil {
		res.Status = backend.HealthStatusError
		res.Message = err.Error()
		return res, nil
	}

	if err := client.Health(ctx); err != nil {
		res.Status = backend.HealthStatusError
		res.Message = err.Error()
		return res, nil
	}

	res.Status = backend.HealthStatusOk
	res.Message = "Mirador Core configuration looks good"

	return res, nil
}

func newMiradorClient(settings *models.PluginSettings) (*mirador.Client, error) {
	var timeout time.Duration
	if settings.TimeoutMs > 0 {
		timeout = time.Duration(settings.TimeoutMs) * time.Millisecond
	}

	cfg := mirador.Config{
		BaseURL:  settings.URL,
		Bearer:   settings.Secrets.BearerToken,
		TenantID: settings.TenantID,
		Timeout:  timeout,
	}

	if testHTTPClient != nil {
		cfg.HTTPClient = testHTTPClient
	}

	return mirador.NewClient(cfg)
}

func logsToFrame(resp mirador.LogsResponse) data.Frames {
	if len(resp.Results) == 0 {
		frame := data.NewFrame("logs",
			data.NewField("time", nil, []time.Time{}),
		)
		frame.Meta = &data.FrameMeta{PreferredVisualization: data.VisTypeTable}
		return data.Frames{frame}
	}

	times := make([]time.Time, len(resp.Results))
	columnData := map[string][]string{}

	for i, entry := range resp.Results {
		if ts, ok := entry.Timestamp(); ok {
			times[i] = ts
		}
		for key, raw := range entry {
			if key == "_time" {
				continue
			}
			value := fmt.Sprint(raw)
			columnData[key] = append(columnData[key], value)
		}
	}

	fields := make([]*data.Field, 0, len(columnData)+1)
	fields = append(fields, data.NewField("time", nil, times))
	for key, values := range columnData {
		fields = append(fields, data.NewField(key, nil, values))
	}

	frame := data.NewFrame("logs", fields...)
	frame.Meta = &data.FrameMeta{PreferredVisualization: data.VisTypeTable}
	return data.Frames{frame}
}

func metricsToFrames(resp mirador.MetricsResponse) data.Frames {
	frames := data.Frames{}
	for _, series := range resp.Data.Result {
		if len(series.Values) > 0 {
			times := make([]time.Time, len(series.Values))
			values := make([]float64, len(series.Values))
			for i, pair := range series.Values {
				times[i] = toTime(pair[0])
				values[i] = toFloat(pair[1])
			}
			frame := data.NewFrame(series.Metric["__name__"],
				data.NewField("time", nil, times),
				data.NewField("value", nil, values),
			)
			frame.Meta = &data.FrameMeta{
				PreferredVisualization: data.VisTypeGraph,
				Custom:                 map[string]any{"labels": series.Metric},
			}
			frames = append(frames, frame)
			continue
		}

		if len(series.Value) == 2 {
			t := toTime(series.Value[0])
			value := toFloat(series.Value[1])
			frame := data.NewFrame(series.Metric["__name__"],
				data.NewField("time", nil, []time.Time{t}),
				data.NewField("value", nil, []float64{value}),
			)
			frame.Meta = &data.FrameMeta{
				PreferredVisualization: data.VisTypeGraph,
				Custom:                 map[string]any{"labels": series.Metric},
			}
			frames = append(frames, frame)
		}
	}

	if len(frames) == 0 {
		frames = append(frames, data.NewFrame("metrics"))
	}

	return frames
}

func tracesToFrame(resp mirador.TracesResponse) *data.Frame {
	if len(resp.Data) == 0 {
		return data.NewFrame("traces")
	}

	traceIDs := make([]string, len(resp.Data))
	durations := make([]int64, len(resp.Data))
	spanCounts := make([]int64, len(resp.Data))

	for i, trace := range resp.Data {
		traceIDs[i] = trace.TraceID
		durations[i] = trace.Duration
		spanCounts[i] = int64(len(trace.Spans))
	}

	frame := data.NewFrame("traces",
		data.NewField("traceID", nil, traceIDs),
		data.NewField("duration", nil, durations),
		data.NewField("spanCount", nil, spanCounts),
	)
	frame.Meta = &data.FrameMeta{PreferredVisualization: data.VisTypeTable}
	return frame
}

func toTime(raw interface{}) time.Time {
	switch v := raw.(type) {
	case float64:
		return time.Unix(int64(v), 0).UTC()
	case string:
		if f, err := strconv.ParseFloat(v, 64); err == nil {
			return time.Unix(int64(f), int64((f-math.Floor(f))*1e9)).UTC()
		}
		if parsed, err := time.Parse(time.RFC3339Nano, v); err == nil {
			return parsed.UTC()
		}
	}
	return time.Time{}
}

func toFloat(raw interface{}) float64 {
	switch v := raw.(type) {
	case float64:
		return v
	case string:
		if f, err := strconv.ParseFloat(v, 64); err == nil {
			return f
		}
	case json.Number:
		if f, err := v.Float64(); err == nil {
			return f
		}
	}
	return 0
}

func formatDuration(d time.Duration) string {
	if d%time.Second == 0 {
		return fmt.Sprintf("%ds", int(d.Seconds()))
	}
	if d%time.Millisecond == 0 {
		return fmt.Sprintf("%dms", int(d.Milliseconds()))
	}
	return d.String()
}
