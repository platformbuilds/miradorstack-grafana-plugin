package backend

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/grafana/grafana-plugin-sdk-go/backend"
	"github.com/grafana/grafana-plugin-sdk-go/backend/instancemgmt"
	"github.com/grafana/grafana-plugin-sdk-go/backend/log"
	"github.com/grafana/grafana-plugin-sdk-go/data"
)

// Plugin handles the plugin lifecycle and implements the required interfaces
type Plugin struct {
	client *Client
	logger log.Logger
}

type instanceSettings struct {
	client *Client
	logger log.Logger
}

// New creates a new Plugin instance
func New() *Plugin {
	return &Plugin{
		logger: log.DefaultLogger,
	}
}

// NewDataSourceInstance creates a new instance of the plugin for a datasource
func (p *Plugin) NewDataSourceInstance(settings backend.DataSourceInstanceSettings) (instancemgmt.Instance, error) {
	client, err := NewClient(settings)
	if err != nil {
		return nil, err
	}

	return &instanceSettings{
		client: client,
		logger: p.logger,
	}, nil
}

// QueryData handles data queries sent from the frontend
func (p *Plugin) QueryData(ctx context.Context, req *backend.QueryDataRequest) (*backend.QueryDataResponse, error) {
	response := backend.NewQueryDataResponse()

	// Process queries
	for _, q := range req.Queries {
		var qm QueryModel
		if err := json.Unmarshal(q.JSON, &qm); err != nil {
			response.Responses[q.RefID] = backend.ErrDataResponse(backend.StatusBadRequest, fmt.Sprintf("json unmarshal: %v", err))
			continue
		}

		res := p.handleQuery(ctx, q, qm)
		response.Responses[q.RefID] = res
	}

	return response, nil
}

// CheckHealth handles health checks sent from Grafana
func (p *Plugin) CheckHealth(ctx context.Context, req *backend.CheckHealthRequest) (*backend.CheckHealthResult, error) {
	err := p.client.CheckHealth(ctx)
	if err != nil {
		return &backend.CheckHealthResult{
			Status:  backend.HealthStatusError,
			Message: fmt.Sprintf("Error connecting to Mirador Core: %v", err),
		}, nil
	}

	return &backend.CheckHealthResult{
		Status:  backend.HealthStatusOk,
		Message: "Success: Connected to Mirador Core",
	}, nil
}

// QueryModel represents query parameters sent from the frontend
type QueryModel struct {
	QueryType string `json:"queryType"`
	Expr      string `json:"expr"`
	From      string `json:"from"`
	To        string `json:"to"`
}

func (p *Plugin) handleQuery(ctx context.Context, query backend.DataQuery, model QueryModel) backend.DataResponse {
	switch model.QueryType {
	case "metrics":
		return p.handleMetricsQuery(ctx, query, model)
	case "logs":
		return p.handleLogsQuery(ctx, query, model)
	case "traces":
		return p.handleTracesQuery(ctx, query, model)
	default:
		return backend.ErrDataResponse(backend.StatusBadRequest, fmt.Sprintf("unknown query type: %s", model.QueryType))
	}
}

func (p *Plugin) handleMetricsQuery(ctx context.Context, query backend.DataQuery, model QueryModel) backend.DataResponse {
	p.logger.Debug("Handling metrics query", "expr", model.Expr, "from", model.From, "to", model.To)

	metrics, err := p.client.GetMetrics(ctx, model.Expr, model.From, model.To)
	if err != nil {
		return backend.ErrDataResponse(backend.StatusBadRequest, fmt.Sprintf("metrics query failed: %v", err))
	}

	frame := data.NewFrame("response")
	frame.Fields = append(frame.Fields,
		data.NewField("time", nil, []time.Time{}),
		data.NewField("value", nil, []float64{}),
	)

	for _, m := range metrics {
		frame.AppendRow(m.Timestamp, m.Value)
	}

	return backend.DataResponse{
		Frames: []*data.Frame{frame},
	}
}

func (p *Plugin) handleLogsQuery(ctx context.Context, query backend.DataQuery, model QueryModel) backend.DataResponse {
	p.logger.Debug("Handling logs query", "expr", model.Expr, "from", model.From, "to", model.To)

	logs, err := p.client.GetLogs(ctx, model.Expr, model.From, model.To)
	if err != nil {
		return backend.ErrDataResponse(backend.StatusBadRequest, fmt.Sprintf("logs query failed: %v", err))
	}

	frame := data.NewFrame("response")
	frame.Fields = append(frame.Fields,
		data.NewField("time", nil, []time.Time{}),
		data.NewField("message", nil, []string{}),
		data.NewField("level", nil, []string{}),
	)

	for _, log := range logs {
		frame.AppendRow(log.Timestamp, log.Message, log.Level)
	}

	return backend.DataResponse{
		Frames: []*data.Frame{frame},
	}
}

func (p *Plugin) handleTracesQuery(ctx context.Context, query backend.DataQuery, model QueryModel) backend.DataResponse {
	p.logger.Debug("Handling traces query", "expr", model.Expr, "from", model.From, "to", model.To)

	traces, err := p.client.GetTraces(ctx, model.Expr, model.From, model.To)
	if err != nil {
		return backend.ErrDataResponse(backend.StatusBadRequest, fmt.Sprintf("traces query failed: %v", err))
	}

	frame := data.NewFrame("response")
	frame.Fields = append(frame.Fields,
		data.NewField("time", nil, []time.Time{}),
		data.NewField("traceID", nil, []string{}),
		data.NewField("spanID", nil, []string{}),
		data.NewField("service", nil, []string{}),
		data.NewField("operation", nil, []string{}),
		data.NewField("duration", nil, []float64{}),
	)

	for _, trace := range traces {
		frame.AppendRow(
			trace.Timestamp,
			trace.TraceID,
			trace.SpanID,
			trace.Service,
			trace.Operation,
			trace.Duration,
		)
	}

	return backend.DataResponse{
		Frames: []*data.Frame{frame},
	}
}

// Dispose cleans up resources on plugin shutdown
func (p *Plugin) Dispose() {
	if p.client != nil {
		p.client.Close()
	}
}
