package backend

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/grafana/grafana-plugin-sdk-go/backend"
	"github.com/grafana/grafana-plugin-sdk-go/backend/log"
)

// Metric represents a single metric data point
type Metric struct {
	Timestamp time.Time
	Value     float64
	Labels    map[string]string
}

// Log represents a single log entry
type Log struct {
	Timestamp time.Time
	Message   string
	Level     string
	Labels    map[string]string
}

// Trace represents a single trace
type Trace struct {
	Timestamp time.Time
	TraceID   string
	SpanID    string
	Service   string
	Operation string
	Duration  float64
	Labels    map[string]string
}

// Client handles communication with the Mirador Core API
type Client struct {
	baseURL    string
	httpClient *http.Client
	authToken  string
	logger     log.Logger
}

// NewClient creates a new Mirador Core API client
func NewClient(settings backend.DataSourceInstanceSettings) (*Client, error) {
	var jsonData struct {
		BaseURL string `json:"baseURL"`
	}

	if err := json.Unmarshal(settings.JSONData, &jsonData); err != nil {
		return nil, fmt.Errorf("invalid settings: %w", err)
	}

	if jsonData.BaseURL == "" {
		return nil, fmt.Errorf("baseURL is required")
	}

	return &Client{
		baseURL:    jsonData.BaseURL,
		httpClient: &http.Client{Timeout: 30 * time.Second},
		authToken:  settings.DecryptedSecureJSONData["authToken"],
		logger:     log.DefaultLogger,
	}, nil
}

// CheckHealth verifies the connection to Mirador Core
func (c *Client) CheckHealth(ctx context.Context) error {
	req, err := http.NewRequestWithContext(ctx, "GET", fmt.Sprintf("%s/health", c.baseURL), nil)
	if err != nil {
		return fmt.Errorf("failed to create request: %w", err)
	}

	if c.authToken != "" {
		req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", c.authToken))
	}

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return fmt.Errorf("failed to execute request: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("health check failed with status %d", resp.StatusCode)
	}

	return nil
}

// GetMetrics performs a metrics query against Mirador Core
func (c *Client) GetMetrics(ctx context.Context, expr string, from, to string) ([]Metric, error) {
	url := fmt.Sprintf("%s/api/v1/query_range", c.baseURL)
	req, err := http.NewRequestWithContext(ctx, "GET", url, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	q := req.URL.Query()
	q.Set("query", expr)
	q.Set("start", from)
	q.Set("end", to)
	req.URL.RawQuery = q.Encode()

	if c.authToken != "" {
		req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", c.authToken))
	}

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to execute request: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("query failed with status %d", resp.StatusCode)
	}

	var result struct {
		Data struct {
			Result []struct {
				Values []struct {
					Time  float64 `json:"t"`
					Value float64 `json:"v"`
				} `json:"values"`
				Labels map[string]string `json:"labels"`
			} `json:"result"`
		} `json:"data"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, fmt.Errorf("failed to decode response: %w", err)
	}

	var metrics []Metric
	for _, res := range result.Data.Result {
		for _, val := range res.Values {
			metrics = append(metrics, Metric{
				Timestamp: time.Unix(int64(val.Time), 0),
				Value:     val.Value,
				Labels:    res.Labels,
			})
		}
	}

	return metrics, nil
}

// GetLogs performs a logs query against Mirador Core
func (c *Client) GetLogs(ctx context.Context, expr string, from, to string) ([]Log, error) {
	url := fmt.Sprintf("%s/api/v1/logs", c.baseURL)
	req, err := http.NewRequestWithContext(ctx, "GET", url, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	q := req.URL.Query()
	q.Set("query", expr)
	q.Set("start", from)
	q.Set("end", to)
	req.URL.RawQuery = q.Encode()

	if c.authToken != "" {
		req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", c.authToken))
	}

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to execute request: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("query failed with status %d", resp.StatusCode)
	}

	var result struct {
		Data struct {
			Result []struct {
				Time    float64           `json:"time"`
				Message string            `json:"message"`
				Level   string            `json:"level"`
				Labels  map[string]string `json:"labels"`
			} `json:"result"`
		} `json:"data"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, fmt.Errorf("failed to decode response: %w", err)
	}

	var logs []Log
	for _, res := range result.Data.Result {
		logs = append(logs, Log{
			Timestamp: time.Unix(int64(res.Time), 0),
			Message:   res.Message,
			Level:     res.Level,
			Labels:    res.Labels,
		})
	}

	return logs, nil
}

// GetTraces performs a traces query against Mirador Core
func (c *Client) GetTraces(ctx context.Context, expr string, from, to string) ([]Trace, error) {
	url := fmt.Sprintf("%s/api/v1/traces", c.baseURL)
	req, err := http.NewRequestWithContext(ctx, "GET", url, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	q := req.URL.Query()
	q.Set("query", expr)
	q.Set("start", from)
	q.Set("end", to)
	req.URL.RawQuery = q.Encode()

	if c.authToken != "" {
		req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", c.authToken))
	}

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to execute request: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("query failed with status %d", resp.StatusCode)
	}

	var result struct {
		Data struct {
			Result []struct {
				Time      float64           `json:"time"`
				TraceID   string            `json:"traceID"`
				SpanID    string            `json:"spanID"`
				Service   string            `json:"service"`
				Operation string            `json:"operation"`
				Duration  float64           `json:"duration"`
				Labels    map[string]string `json:"labels"`
			} `json:"result"`
		} `json:"data"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, fmt.Errorf("failed to decode response: %w", err)
	}

	var traces []Trace
	for _, res := range result.Data.Result {
		traces = append(traces, Trace{
			Timestamp: time.Unix(int64(res.Time), 0),
			TraceID:   res.TraceID,
			SpanID:    res.SpanID,
			Service:   res.Service,
			Operation: res.Operation,
			Duration:  res.Duration,
			Labels:    res.Labels,
		})
	}

	return traces, nil
}

// Close cleans up the client resources
func (c *Client) Close() {
	// Clean up any resources
	c.httpClient.CloseIdleConnections()
}
