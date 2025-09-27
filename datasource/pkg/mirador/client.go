package mirador

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"time"
)

type Client struct {
	baseURL    *url.URL
	httpClient *http.Client
	headers    http.Header
}

// Config models runtime parameters derived from datasource settings.
type Config struct {
	BaseURL    string
	Bearer     string
	TenantID   string
	Timeout    time.Duration
	HTTPClient *http.Client
}

func NewClient(cfg Config) (*Client, error) {
	if cfg.BaseURL == "" {
		return nil, fmt.Errorf("base url is required")
	}

	parsed, err := url.Parse(cfg.BaseURL)
	if err != nil {
		return nil, fmt.Errorf("invalid base url: %w", err)
	}

	timeout := cfg.Timeout
	if timeout == 0 {
		timeout = 30 * time.Second
	}

	headers := make(http.Header)
	headers.Set("Content-Type", "application/json")
	if cfg.Bearer != "" {
		headers.Set("Authorization", "Bearer "+cfg.Bearer)
	}
	if cfg.TenantID != "" {
		headers.Set("X-Mirador-Tenant", cfg.TenantID)
	}

	client := cfg.HTTPClient
	if client == nil {
		client = &http.Client{Timeout: timeout}
	} else if timeout > 0 {
		client.Timeout = timeout
	}

	return &Client{
		baseURL:    parsed,
		httpClient: client,
		headers:    headers,
	}, nil
}

func (c *Client) QueryLogs(ctx context.Context, payload LogsQuery) (LogsResponse, error) {
	var result LogsResponse
	if err := c.post(ctx, "/api/v1/logs/query", payload, &result); err != nil {
		return LogsResponse{}, err
	}
	return result, nil
}

func (c *Client) QueryMetrics(ctx context.Context, payload MetricsQuery) (MetricsResponse, error) {
	var result MetricsResponse
	if err := c.post(ctx, "/api/v1/query", payload, &result); err != nil {
		return MetricsResponse{}, err
	}
	return result, nil
}

func (c *Client) QueryTraces(ctx context.Context, payload TracesQuery) (TracesResponse, error) {
	var result TracesResponse
	if err := c.post(ctx, "/api/v1/traces/search", payload, &result); err != nil {
		return TracesResponse{}, err
	}
	return result, nil
}

func (c *Client) LogsSchema(ctx context.Context) (LogsSchema, error) {
	var result LogsSchema
	if err := c.get(ctx, "/api/v1/schema/logs/fields", &result); err != nil {
		return LogsSchema{}, err
	}
	return result, nil
}

func (c *Client) LogFieldSchema(ctx context.Context, field string) (SchemaField, error) {
	var result SchemaField
	endpoint := fmt.Sprintf("/api/v1/schema/logs/fields/%s", url.PathEscape(field))
	if err := c.get(ctx, endpoint, &result); err != nil {
		return SchemaField{}, err
	}
	return result, nil
}

func (c *Client) MetricsSchema(ctx context.Context) (MetricsSchema, error) {
	var result MetricsSchema
	if err := c.get(ctx, "/api/v1/schema/metrics", &result); err != nil {
		return MetricsSchema{}, err
	}
	return result, nil
}

func (c *Client) MetricSchema(ctx context.Context, metric string) (MetricDescriptor, error) {
	var result MetricDescriptor
	endpoint := fmt.Sprintf("/api/v1/schema/metrics/%s", url.PathEscape(metric))
	if err := c.get(ctx, endpoint, &result); err != nil {
		return MetricDescriptor{}, err
	}
	return result, nil
}

func (c *Client) TracesSchema(ctx context.Context) (TracesSchema, error) {
	var result TracesSchema
	if err := c.get(ctx, "/api/v1/schema/traces/services", &result); err != nil {
		return TracesSchema{}, err
	}
	return result, nil
}

func (c *Client) TraceServiceSchema(ctx context.Context, service string) (TraceServiceSchema, error) {
	var result TraceServiceSchema
	endpoint := fmt.Sprintf("/api/v1/schema/traces/services/%s", url.PathEscape(service))
	if err := c.get(ctx, endpoint, &result); err != nil {
		return TraceServiceSchema{}, err
	}
	return result, nil
}

func (c *Client) Health(ctx context.Context) error {
	req, err := c.newRequest(ctx, http.MethodGet, "/api/v1/health", nil)
	if err != nil {
		return err
	}

	res, err := c.httpClient.Do(req)
	if err != nil {
		return err
	}
	defer res.Body.Close()

	if res.StatusCode >= 400 {
		return fmt.Errorf("mirador health check failed: %s", res.Status)
	}

	return nil
}

func (c *Client) post(ctx context.Context, path string, payload any, out any) error {
	req, err := c.newRequest(ctx, http.MethodPost, path, payload)
	if err != nil {
		return err
	}

	res, err := c.httpClient.Do(req)
	if err != nil {
		return err
	}
	defer res.Body.Close()

	if res.StatusCode >= 400 {
		return fmt.Errorf("mirador request failed: %s", res.Status)
	}

	if out == nil {
		return nil
	}

	return json.NewDecoder(res.Body).Decode(out)
}

func (c *Client) get(ctx context.Context, endpoint string, out any) error {
	req, err := c.newRequest(ctx, http.MethodGet, endpoint, nil)
	if err != nil {
		return err
	}

	res, err := c.httpClient.Do(req)
	if err != nil {
		return err
	}
	defer res.Body.Close()

	if res.StatusCode >= 400 {
		return fmt.Errorf("mirador request failed: %s", res.Status)
	}

	if out == nil {
		return nil
	}

	return json.NewDecoder(res.Body).Decode(out)
}

func (c *Client) newRequest(ctx context.Context, method, path string, payload any) (*http.Request, error) {
	rel, err := url.Parse(path)
	if err != nil {
		return nil, err
	}

	u := c.baseURL.ResolveReference(rel)

	var body []byte
	if payload != nil {
		body, err = json.Marshal(payload)
		if err != nil {
			return nil, err
		}
	}

	req, err := http.NewRequestWithContext(ctx, method, u.String(), bytes.NewReader(body))
	if err != nil {
		return nil, err
	}

	for key, values := range c.headers {
		for _, value := range values {
			req.Header.Add(key, value)
		}
	}

	return req, nil
}
