package plugin

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"math"
	"net/http"
	"strconv"
	"strings"
	"sync"
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
	_ backend.CallResourceHandler   = (*Datasource)(nil)
	_ instancemgmt.InstanceDisposer = (*Datasource)(nil)
)

var testHTTPClient *http.Client

const schemaCacheTTL = 30 * time.Second

var (
	schemaCacheStore     = newSchemaCache()
	schemaOverridesStore = newSchemaOverrides()
)

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

// CallResource exposes Mirador schema metadata to frontend clients.
func (d *Datasource) CallResource(ctx context.Context, req *backend.CallResourceRequest, sender backend.CallResourceResponseSender) error {
	if req == nil || req.PluginContext.DataSourceInstanceSettings == nil {
		return sendJSONResponse(sender, http.StatusBadRequest, map[string]string{"error": "missing datasource settings"})
	}

	settings, err := models.LoadPluginSettings(*req.PluginContext.DataSourceInstanceSettings)
	if err != nil {
		return sendJSONResponse(sender, http.StatusBadRequest, map[string]string{"error": fmt.Sprintf("load settings: %v", err)})
	}

	if settings.URL == "" {
		return sendJSONResponse(sender, http.StatusBadRequest, map[string]string{"error": "Mirador API URL is not configured"})
	}

	method := strings.ToUpper(strings.TrimSpace(req.Method))
	if method == "" {
		method = http.MethodGet
	}
	if method != http.MethodGet && method != http.MethodPost && method != http.MethodPut {
		return sendJSONResponse(sender, http.StatusMethodNotAllowed, map[string]string{"error": "unsupported method"})
	}

	client, err := newMiradorClient(settings)
	if err != nil {
		return sendJSONResponse(sender, http.StatusBadRequest, map[string]string{"error": err.Error()})
	}

	path := strings.Trim(strings.TrimSpace(req.Path), "/")
	if path == "" {
		return sendJSONResponse(sender, http.StatusNotFound, map[string]string{"error": "resource not found"})
	}

	segments := strings.Split(path, "/")
	if len(segments) < 2 || !strings.EqualFold(segments[0], "schema") {
		return sendJSONResponse(sender, http.StatusNotFound, map[string]string{"error": "resource not found"})
	}

	typeKey := strings.ToLower(segments[1])
	switch typeKey {
	case "logs":
		if method == http.MethodGet {
			return d.callLogSchema(ctx, client, segments[2:], sender)
		}
		return d.saveLogSchema(segments[2:], req.Body, sender)
	case "metrics":
		if method == http.MethodGet {
			return d.callMetricsSchema(ctx, client, segments[2:], sender)
		}
		return d.saveMetricSchema(segments[2:], req.Body, sender)
	case "traces":
		if method == http.MethodGet {
			return d.callTracesSchema(ctx, client, segments[2:], sender)
		}
		return d.saveTraceSchema(segments[2:], req.Body, sender)
	default:
		return sendJSONResponse(sender, http.StatusNotFound, map[string]string{"error": "resource not found"})
	}
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

func (d *Datasource) callLogSchema(ctx context.Context, client *mirador.Client, segments []string, sender backend.CallResourceResponseSender) error {
	if len(segments) == 0 || segments[0] == "" {
		schema, err := schemaCacheStore.getLogs(ctx, func() (mirador.LogsSchema, error) {
			return client.LogsSchema(ctx)
		})
		if err != nil {
			return sendJSONResponse(sender, http.StatusBadGateway, map[string]string{"error": err.Error()})
		}
		overlay := schemaOverridesStore.applyLogs(schema)
		return sendJSONResponse(sender, http.StatusOK, overlay)
	}

	field := strings.Join(segments, "/")
	if field == "" {
		return sendJSONResponse(sender, http.StatusNotFound, map[string]string{"error": "resource not found"})
	}

	if override, ok := schemaOverridesStore.logField(field); ok {
		return sendJSONResponse(sender, http.StatusOK, override)
	}

	schema, err := client.LogFieldSchema(ctx, field)
	if err != nil {
		return sendJSONResponse(sender, http.StatusBadGateway, map[string]string{"error": err.Error()})
	}

	return sendJSONResponse(sender, http.StatusOK, schema)
}

func (d *Datasource) callMetricsSchema(ctx context.Context, client *mirador.Client, segments []string, sender backend.CallResourceResponseSender) error {
	if len(segments) == 0 || segments[0] == "" {
		schema, err := schemaCacheStore.getMetrics(ctx, func() (mirador.MetricsSchema, error) {
			return client.MetricsSchema(ctx)
		})
		if err != nil {
			return sendJSONResponse(sender, http.StatusBadGateway, map[string]string{"error": err.Error()})
		}
		overlay := schemaOverridesStore.applyMetrics(schema)
		return sendJSONResponse(sender, http.StatusOK, overlay)
	}

	metric := strings.Join(segments, "/")
	if metric == "" {
		return sendJSONResponse(sender, http.StatusNotFound, map[string]string{"error": "resource not found"})
	}

	if override, ok := schemaOverridesStore.metric(metric); ok {
		return sendJSONResponse(sender, http.StatusOK, override)
	}

	descriptor, err := client.MetricSchema(ctx, metric)
	if err != nil {
		return sendJSONResponse(sender, http.StatusBadGateway, map[string]string{"error": err.Error()})
	}

	return sendJSONResponse(sender, http.StatusOK, descriptor)
}

func (d *Datasource) callTracesSchema(ctx context.Context, client *mirador.Client, segments []string, sender backend.CallResourceResponseSender) error {
	if len(segments) == 0 || segments[0] == "" {
		schema, err := schemaCacheStore.getTraces(ctx, func() (mirador.TracesSchema, error) {
			return client.TracesSchema(ctx)
		})
		if err != nil {
			return sendJSONResponse(sender, http.StatusBadGateway, map[string]string{"error": err.Error()})
		}
		overlay := schemaOverridesStore.applyTraces(schema)
		return sendJSONResponse(sender, http.StatusOK, overlay)
	}

	service := strings.Join(segments, "/")
	if service == "" {
		return sendJSONResponse(sender, http.StatusNotFound, map[string]string{"error": "resource not found"})
	}

	if override, ok := schemaOverridesStore.traceService(service); ok {
		return sendJSONResponse(sender, http.StatusOK, override)
	}

	descriptor, err := client.TraceServiceSchema(ctx, service)
	if err != nil {
		return sendJSONResponse(sender, http.StatusBadGateway, map[string]string{"error": err.Error()})
	}

	return sendJSONResponse(sender, http.StatusOK, descriptor)
}

func (d *Datasource) saveLogSchema(segments []string, body []byte, sender backend.CallResourceResponseSender) error {
	var payload mirador.SchemaField
	if err := decodeSchemaPayload(body, &payload); err != nil {
		return sendJSONResponse(sender, http.StatusBadRequest, map[string]string{"error": err.Error()})
	}

	if len(segments) > 0 && segments[0] != "" {
		requested := strings.Join(segments, "/")
		if !strings.EqualFold(requested, payload.Name) {
			return sendJSONResponse(sender, http.StatusBadRequest, map[string]string{"error": "payload name must match resource path"})
		}
	}

	if strings.TrimSpace(payload.Name) == "" || strings.TrimSpace(payload.Type) == "" {
		return sendJSONResponse(sender, http.StatusBadRequest, map[string]string{"error": "name and type are required"})
	}

	schemaOverridesStore.upsertLog(payload)
	schemaCacheStore.invalidateLogs()
	return sendJSONResponse(sender, http.StatusOK, payload)
}

func (d *Datasource) saveMetricSchema(segments []string, body []byte, sender backend.CallResourceResponseSender) error {
	var payload mirador.MetricDescriptor
	if err := decodeSchemaPayload(body, &payload); err != nil {
		return sendJSONResponse(sender, http.StatusBadRequest, map[string]string{"error": err.Error()})
	}

	if len(segments) > 0 && segments[0] != "" {
		requested := strings.Join(segments, "/")
		if !strings.EqualFold(requested, payload.Name) {
			return sendJSONResponse(sender, http.StatusBadRequest, map[string]string{"error": "payload name must match resource path"})
		}
	}

	if strings.TrimSpace(payload.Name) == "" || strings.TrimSpace(payload.Type) == "" {
		return sendJSONResponse(sender, http.StatusBadRequest, map[string]string{"error": "name and type are required"})
	}

	schemaOverridesStore.upsertMetric(payload)
	schemaCacheStore.invalidateMetrics()
	return sendJSONResponse(sender, http.StatusOK, payload)
}

func (d *Datasource) saveTraceSchema(segments []string, body []byte, sender backend.CallResourceResponseSender) error {
	var payload mirador.TraceServiceSchema
	if err := decodeSchemaPayload(body, &payload); err != nil {
		return sendJSONResponse(sender, http.StatusBadRequest, map[string]string{"error": err.Error()})
	}

	if len(segments) > 0 && segments[0] != "" {
		requested := strings.Join(segments, "/")
		if !strings.EqualFold(requested, payload.Name) {
			return sendJSONResponse(sender, http.StatusBadRequest, map[string]string{"error": "payload name must match resource path"})
		}
	}

	if strings.TrimSpace(payload.Name) == "" {
		return sendJSONResponse(sender, http.StatusBadRequest, map[string]string{"error": "name is required"})
	}

	schemaOverridesStore.upsertTrace(payload)
	schemaCacheStore.invalidateTraces()
	return sendJSONResponse(sender, http.StatusOK, payload)
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

type cacheEntry[T any] struct {
	value   T
	expires time.Time
	ok      bool
}

type schemaCache struct {
	mu      sync.RWMutex
	logs    cacheEntry[mirador.LogsSchema]
	metrics cacheEntry[mirador.MetricsSchema]
	traces  cacheEntry[mirador.TracesSchema]
}

func newSchemaCache() *schemaCache {
	return &schemaCache{}
}

func (c *schemaCache) getLogs(ctx context.Context, fetch func() (mirador.LogsSchema, error)) (mirador.LogsSchema, error) {
	c.mu.RLock()
	entry := c.logs
	c.mu.RUnlock()
	if entry.ok && time.Now().Before(entry.expires) {
		return entry.value, nil
	}

	value, err := fetch()
	if err != nil {
		return mirador.LogsSchema{}, err
	}

	c.mu.Lock()
	c.logs = cacheEntry[mirador.LogsSchema]{
		value:   value,
		expires: time.Now().Add(schemaCacheTTL),
		ok:      true,
	}
	c.mu.Unlock()

	return value, nil
}

func (c *schemaCache) getMetrics(ctx context.Context, fetch func() (mirador.MetricsSchema, error)) (mirador.MetricsSchema, error) {
	c.mu.RLock()
	entry := c.metrics
	c.mu.RUnlock()
	if entry.ok && time.Now().Before(entry.expires) {
		return entry.value, nil
	}

	value, err := fetch()
	if err != nil {
		return mirador.MetricsSchema{}, err
	}

	c.mu.Lock()
	c.metrics = cacheEntry[mirador.MetricsSchema]{
		value:   value,
		expires: time.Now().Add(schemaCacheTTL),
		ok:      true,
	}
	c.mu.Unlock()

	return value, nil
}

func (c *schemaCache) getTraces(ctx context.Context, fetch func() (mirador.TracesSchema, error)) (mirador.TracesSchema, error) {
	c.mu.RLock()
	entry := c.traces
	c.mu.RUnlock()
	if entry.ok && time.Now().Before(entry.expires) {
		return entry.value, nil
	}

	value, err := fetch()
	if err != nil {
		return mirador.TracesSchema{}, err
	}

	c.mu.Lock()
	c.traces = cacheEntry[mirador.TracesSchema]{
		value:   value,
		expires: time.Now().Add(schemaCacheTTL),
		ok:      true,
	}
	c.mu.Unlock()

	return value, nil
}

func (c *schemaCache) invalidateLogs() {
	c.mu.Lock()
	c.logs = cacheEntry[mirador.LogsSchema]{}
	c.mu.Unlock()
}

func (c *schemaCache) invalidateMetrics() {
	c.mu.Lock()
	c.metrics = cacheEntry[mirador.MetricsSchema]{}
	c.mu.Unlock()
}

func (c *schemaCache) invalidateTraces() {
	c.mu.Lock()
	c.traces = cacheEntry[mirador.TracesSchema]{}
	c.mu.Unlock()
}

func (c *schemaCache) reset() {
	c.mu.Lock()
	c.logs = cacheEntry[mirador.LogsSchema]{}
	c.metrics = cacheEntry[mirador.MetricsSchema]{}
	c.traces = cacheEntry[mirador.TracesSchema]{}
	c.mu.Unlock()
}

type schemaOverrides struct {
	mu      sync.RWMutex
	logs    map[string]mirador.SchemaField
	metrics map[string]mirador.MetricDescriptor
	traces  map[string]mirador.TraceServiceSchema
}

func newSchemaOverrides() *schemaOverrides {
	return &schemaOverrides{
		logs:    map[string]mirador.SchemaField{},
		metrics: map[string]mirador.MetricDescriptor{},
		traces:  map[string]mirador.TraceServiceSchema{},
	}
}

func (s *schemaOverrides) applyLogs(schema mirador.LogsSchema) mirador.LogsSchema {
	s.mu.RLock()
	overrides := make(map[string]mirador.SchemaField, len(s.logs))
	for key, value := range s.logs {
		overrides[key] = value
	}
	s.mu.RUnlock()

	if len(overrides) == 0 {
		return schema
	}

	fields := make([]mirador.SchemaField, 0, len(schema.Fields))
	for _, field := range schema.Fields {
		if override, ok := overrides[field.Name]; ok {
			fields = append(fields, override)
			delete(overrides, field.Name)
			continue
		}
		fields = append(fields, field)
	}
	for _, field := range overrides {
		fields = append(fields, field)
	}
	schema.Fields = fields
	return schema
}

func (s *schemaOverrides) applyMetrics(schema mirador.MetricsSchema) mirador.MetricsSchema {
	s.mu.RLock()
	overrides := make(map[string]mirador.MetricDescriptor, len(s.metrics))
	for key, value := range s.metrics {
		overrides[key] = value
	}
	s.mu.RUnlock()

	if len(overrides) == 0 {
		return schema
	}

	metrics := make([]mirador.MetricDescriptor, 0, len(schema.Metrics))
	for _, metric := range schema.Metrics {
		if override, ok := overrides[metric.Name]; ok {
			metrics = append(metrics, override)
			delete(overrides, metric.Name)
			continue
		}
		metrics = append(metrics, metric)
	}
	for _, metric := range overrides {
		metrics = append(metrics, metric)
	}
	schema.Metrics = metrics
	return schema
}

func (s *schemaOverrides) applyTraces(schema mirador.TracesSchema) mirador.TracesSchema {
	s.mu.RLock()
	overrides := make(map[string]mirador.TraceServiceSchema, len(s.traces))
	for key, value := range s.traces {
		overrides[key] = value
	}
	s.mu.RUnlock()

	if len(overrides) == 0 {
		return schema
	}

	services := make([]mirador.TraceServiceSchema, 0, len(schema.Services))
	for _, service := range schema.Services {
		if override, ok := overrides[service.Name]; ok {
			services = append(services, override)
			delete(overrides, service.Name)
			continue
		}
		services = append(services, service)
	}
	for _, service := range overrides {
		services = append(services, service)
	}
	schema.Services = services
	return schema
}

func (s *schemaOverrides) upsertLog(field mirador.SchemaField) {
	s.mu.Lock()
	s.logs[field.Name] = field
	s.mu.Unlock()
}

func (s *schemaOverrides) logField(name string) (mirador.SchemaField, bool) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	value, ok := s.logs[name]
	return value, ok
}

func (s *schemaOverrides) upsertMetric(metric mirador.MetricDescriptor) {
	s.mu.Lock()
	s.metrics[metric.Name] = metric
	s.mu.Unlock()
}

func (s *schemaOverrides) metric(name string) (mirador.MetricDescriptor, bool) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	value, ok := s.metrics[name]
	return value, ok
}

func (s *schemaOverrides) upsertTrace(service mirador.TraceServiceSchema) {
	s.mu.Lock()
	s.traces[service.Name] = service
	s.mu.Unlock()
}

func (s *schemaOverrides) traceService(name string) (mirador.TraceServiceSchema, bool) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	value, ok := s.traces[name]
	return value, ok
}

func (s *schemaOverrides) reset() {
	s.mu.Lock()
	s.logs = map[string]mirador.SchemaField{}
	s.metrics = map[string]mirador.MetricDescriptor{}
	s.traces = map[string]mirador.TraceServiceSchema{}
	s.mu.Unlock()
}

func sendJSONResponse(sender backend.CallResourceResponseSender, status int, payload any) error {
	body, err := json.Marshal(payload)
	if err != nil {
		return err
	}

	return sender.Send(&backend.CallResourceResponse{
		Status:  status,
		Headers: map[string][]string{"Content-Type": {"application/json"}},
		Body:    body,
	})
}

func decodeSchemaPayload[T any](body []byte, target *T) error {
	if len(body) == 0 {
		return errors.New("request body is required")
	}
	if err := json.Unmarshal(body, target); err != nil {
		return fmt.Errorf("invalid json payload: %w", err)
	}
	return nil
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
	if len(resp.Data.Traces) == 0 {
		return data.NewFrame("traces")
	}

	traceIDs := make([]string, len(resp.Data.Traces))
	durations := make([]int64, len(resp.Data.Traces))
	spanCounts := make([]int64, len(resp.Data.Traces))

	for i, trace := range resp.Data.Traces {
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
