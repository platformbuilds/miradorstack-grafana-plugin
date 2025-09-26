package plugin

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"
	"time"

	"github.com/grafana/grafana-plugin-sdk-go/backend"
	"github.com/grafana/grafana-plugin-sdk-go/backend/instancemgmt"
	"github.com/grafana/grafana-plugin-sdk-go/data"
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
}

func (d *Datasource) query(_ context.Context, pCtx backend.PluginContext, query backend.DataQuery) backend.DataResponse {
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

	var model queryModel
	if err := json.Unmarshal(query.JSON, &model); err != nil {
		return backend.ErrDataResponse(backend.StatusBadRequest, fmt.Sprintf("json unmarshal: %v", err))
	}

	switch strings.ToLower(model.QueryType) {
	case "metrics":
		return d.buildMetricsResponse(query)
	case "traces":
		return d.buildTraceResponse(query)
	default:
		return d.buildLogsResponse(query, model)
	}
}

func (d *Datasource) buildLogsResponse(query backend.DataQuery, model queryModel) backend.DataResponse {
	rows := 2
	if model.Limit > 0 && model.Limit < rows {
		rows = model.Limit
	}

	timestamps := make([]time.Time, rows)
	services := make([]string, rows)
	levels := make([]string, rows)
	messages := make([]string, rows)

	for i := 0; i < rows; i++ {
		timestamps[i] = query.TimeRange.From.Add(time.Duration(i) * time.Minute)
		services[i] = "payments"
		levels[i] = []string{"INFO", "ERROR"}[i%2]
		messages[i] = fmt.Sprintf("Log %d for query %s", i+1, model.Query)
	}

	frame := data.NewFrame("logs",
		data.NewField("time", nil, timestamps),
		data.NewField("service", nil, services),
		data.NewField("level", nil, levels),
		data.NewField("message", nil, messages),
	)
	frame.Meta = &data.FrameMeta{
		PreferredVisualization: data.VisTypeTable,
		Custom: map[string]any{
			"queryType": "logs",
		},
	}

	return backend.DataResponse{Frames: data.Frames{frame}}
}

func (d *Datasource) buildMetricsResponse(query backend.DataQuery) backend.DataResponse {
	points := 5
	timestamps := make([]time.Time, points)
	values := make([]float64, points)

	for i := 0; i < points; i++ {
		timestamps[i] = query.TimeRange.From.Add(time.Duration(i) * time.Minute)
		values[i] = 100 + float64(i*5)
	}

	frame := data.NewFrame("metrics",
		data.NewField("time", nil, timestamps),
		data.NewField("value", nil, values),
	)
	frame.Meta = &data.FrameMeta{
		PreferredVisualization: data.VisTypeGraph,
	}

	return backend.DataResponse{Frames: data.Frames{frame}}
}

func (d *Datasource) buildTraceResponse(query backend.DataQuery) backend.DataResponse {
	frame := data.NewFrame("traces",
		data.NewField("traceID", nil, []string{"abc-123", "def-456"}),
		data.NewField("service", nil, []string{"payments", "checkout"}),
		data.NewField("duration_ms", nil, []int64{1200, 830}),
	)

	frame.Meta = &data.FrameMeta{
		PreferredVisualization: data.VisTypeTable,
		Custom: map[string]any{
			"query": string(query.JSON),
		},
	}

	return backend.DataResponse{Frames: data.Frames{frame}}
}

// CheckHealth handles health checks sent from Grafana to the plugin.
// The main use case for these health checks is the test button on the
// datasource configuration page which allows users to verify that
// a datasource is working as expected.
func (d *Datasource) CheckHealth(_ context.Context, req *backend.CheckHealthRequest) (*backend.CheckHealthResult, error) {
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

	res.Status = backend.HealthStatusOk
	res.Message = "Mirador Core configuration looks good"

	return res, nil
}
