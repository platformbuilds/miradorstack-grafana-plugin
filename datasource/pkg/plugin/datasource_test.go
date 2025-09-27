package plugin

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/grafana/grafana-plugin-sdk-go/backend"
	"github.com/grafana/grafana-plugin-sdk-go/data"
	"github.com/miradorstack/mirador-core-connector/pkg/mirador"
)

type httpResponder func(w http.ResponseWriter, r *http.Request)

type roundTripFunc func(req *http.Request) (*http.Response, error)

func (fn roundTripFunc) RoundTrip(req *http.Request) (*http.Response, error) {
	return fn(req)
}

func setupTestHTTPClient(t *testing.T, handlers map[string]httpResponder) func() {
	t.Helper()

	client := &http.Client{
		Transport: roundTripFunc(func(req *http.Request) (*http.Response, error) {
			recorder := httptest.NewRecorder()
			if handler, ok := handlers[req.URL.Path]; ok {
				handler(recorder, req)
			} else {
				http.NotFound(recorder, req)
			}
			return recorder.Result(), nil
		}),
	}

	prev := testHTTPClient
	testHTTPClient = client

	return func() {
		testHTTPClient = prev
	}
}

func resetSchemaStateForTest(tb testing.TB) {
	tb.Helper()
	schemaCacheStore.reset()
	schemaOverridesStore.reset()
}

func TestQueryDataLogsIntegration(t *testing.T) {
	cleanup := setupTestHTTPClient(t, map[string]httpResponder{
		"/api/v1/logs/query": func(w http.ResponseWriter, r *http.Request) {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusOK)
			w.Write([]byte(`{"results":[{"_time":"2025-01-01T00:00:00Z","service":"payments","level":"ERROR","message":"failure"}],"total":1,"took":5}`))
		},
	})
	defer cleanup()

	ds := Datasource{}
	settings := backend.DataSourceInstanceSettings{
		JSONData:                []byte(`{"url":"http://mirador.local"}`),
		DecryptedSecureJSONData: map[string]string{"bearerToken": "token"},
	}

	resp, err := ds.QueryData(context.Background(), &backend.QueryDataRequest{
		PluginContext: backend.PluginContext{DataSourceInstanceSettings: &settings},
		Queries: []backend.DataQuery{
			{
				RefID:     "A",
				JSON:      []byte(`{"queryType":"logs","query":"level:ERROR"}`),
				TimeRange: backend.TimeRange{From: time.Unix(1735689600, 0), To: time.Unix(1735689660, 0)},
			},
		},
	})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	frame := resp.Responses["A"].Frames[0]
	serviceField := fieldByName(t, frame, "service")
	value, _ := serviceField.ConcreteAt(0)
	if value.(string) != "payments" {
		t.Fatalf("expected payments service, got %v", value)
	}
}

func TestQueryDataMetricsIntegration(t *testing.T) {
	cleanup := setupTestHTTPClient(t, map[string]httpResponder{
		"/api/v1/query": func(w http.ResponseWriter, r *http.Request) {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusOK)
			w.Write([]byte(`{"status":"success","data":{"resultType":"matrix","result":[{"metric":{"__name__":"http_requests_total","service":"payments"},"values":[["1735689600","5"],["1735689660","7"]]}]}}`))
		},
	})
	defer cleanup()

	ds := Datasource{}
	settings := backend.DataSourceInstanceSettings{
		JSONData:                []byte(`{"url":"http://mirador.local"}`),
		DecryptedSecureJSONData: map[string]string{"bearerToken": "token"},
	}

	resp, err := ds.QueryData(context.Background(), &backend.QueryDataRequest{
		PluginContext: backend.PluginContext{DataSourceInstanceSettings: &settings},
		Queries: []backend.DataQuery{
			{
				RefID:     "A",
				JSON:      []byte(`{"queryType":"metrics","query":"rate(http_requests_total[5m])"}`),
				TimeRange: backend.TimeRange{From: time.Unix(1735689600, 0), To: time.Unix(1735689660, 0)},
				Interval:  time.Minute,
			},
		},
	})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	frame := resp.Responses["A"].Frames[0]
	valueField := fieldByName(t, frame, "value")
	first, _ := valueField.ConcreteAt(0)
	second, _ := valueField.ConcreteAt(1)
	if first.(float64) != 5 || second.(float64) != 7 {
		t.Fatalf("unexpected metric values: %v %v", first, second)
	}
}

func TestQueryDataTracesIntegration(t *testing.T) {
	cleanup := setupTestHTTPClient(t, map[string]httpResponder{
		"/api/v1/traces/search": func(w http.ResponseWriter, r *http.Request) {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusOK)
			w.Write([]byte(`{"data":[{"traceID":"abc","duration":1200,"spans":[{"spanID":"s1","operationName":"GET","startTime":1735689600000,"duration":120,"tags":{"service":"payments"}}]}]}`))
		},
	})
	defer cleanup()

	ds := Datasource{}
	settings := backend.DataSourceInstanceSettings{
		JSONData:                []byte(`{"url":"http://mirador.local"}`),
		DecryptedSecureJSONData: map[string]string{"bearerToken": "token"},
	}

	resp, err := ds.QueryData(context.Background(), &backend.QueryDataRequest{
		PluginContext: backend.PluginContext{DataSourceInstanceSettings: &settings},
		Queries: []backend.DataQuery{
			{
				RefID:     "A",
				JSON:      []byte(`{"queryType":"traces","query":"service:payments"}`),
				TimeRange: backend.TimeRange{From: time.Unix(1735689600, 0), To: time.Unix(1735689660, 0)},
			},
		},
	})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	frame := resp.Responses["A"].Frames[0]
	traceField := fieldByName(t, frame, "traceID")
	val, _ := traceField.ConcreteAt(0)
	if val.(string) != "abc" {
		t.Fatalf("unexpected trace id: %v", val)
	}
}

func TestCheckHealthCallsMirador(t *testing.T) {
	healthCalled := false
	cleanup := setupTestHTTPClient(t, map[string]httpResponder{
		"/api/v1/health": func(w http.ResponseWriter, r *http.Request) {
			healthCalled = true
			w.WriteHeader(http.StatusOK)
			w.Write([]byte(`{"status":"ok"}`))
		},
	})
	defer cleanup()

	ds := Datasource{}

	settings := backend.DataSourceInstanceSettings{
		JSONData:                []byte(`{"url":"http://mirador.local"}`),
		DecryptedSecureJSONData: map[string]string{"bearerToken": "token"},
	}

	res, _ := ds.CheckHealth(context.Background(), &backend.CheckHealthRequest{
		PluginContext: backend.PluginContext{DataSourceInstanceSettings: &settings},
	})

	if !healthCalled {
		t.Fatalf("expected health endpoint to be called")
	}

	if res.Status != backend.HealthStatusOk {
		t.Fatalf("expected ok status, got %s", res.Status)
	}
}

func TestCallResourceLogsSchema(t *testing.T) {
	resetSchemaStateForTest(t)
	cleanup := setupTestHTTPClient(t, map[string]httpResponder{
		"/api/v1/schema/logs/fields": func(w http.ResponseWriter, r *http.Request) {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusOK)
			w.Write([]byte(`{"fields":[{"name":"service","type":"keyword","description":"Service name"}],"version":"2025-01-01"}`))
		},
	})
	defer cleanup()

	ds := Datasource{}
	settings := backend.DataSourceInstanceSettings{
		JSONData:                []byte(`{"url":"http://mirador.local"}`),
		DecryptedSecureJSONData: map[string]string{"bearerToken": "token"},
	}

	var response backend.CallResourceResponse
	err := ds.CallResource(context.Background(), &backend.CallResourceRequest{
		PluginContext: backend.PluginContext{DataSourceInstanceSettings: &settings},
		Path:          "schema/logs",
		Method:        http.MethodGet,
	}, backend.CallResourceResponseSenderFunc(func(resp *backend.CallResourceResponse) error {
		response = *resp
		return nil
	}))
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if response.Status != http.StatusOK {
		t.Fatalf("unexpected status: %d", response.Status)
	}

	var schema mirador.LogsSchema
	if err := json.Unmarshal(response.Body, &schema); err != nil {
		t.Fatalf("unmarshal response: %v", err)
	}

	if len(schema.Fields) != 1 || schema.Fields[0].Name != "service" {
		t.Fatalf("unexpected schema payload: %#v", schema)
	}
}

func TestCallResourceMetricDescriptor(t *testing.T) {
	resetSchemaStateForTest(t)
	cleanup := setupTestHTTPClient(t, map[string]httpResponder{
		"/api/v1/schema/metrics/http_requests_total": func(w http.ResponseWriter, r *http.Request) {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusOK)
			w.Write([]byte(`{"name":"http_requests_total","type":"counter","unit":"requests","labels":["status"],"description":"Total requests"}`))
		},
	})
	defer cleanup()

	ds := Datasource{}
	settings := backend.DataSourceInstanceSettings{
		JSONData:                []byte(`{"url":"http://mirador.local"}`),
		DecryptedSecureJSONData: map[string]string{"bearerToken": "token"},
	}

	var response backend.CallResourceResponse
	err := ds.CallResource(context.Background(), &backend.CallResourceRequest{
		PluginContext: backend.PluginContext{DataSourceInstanceSettings: &settings},
		Path:          "schema/metrics/http_requests_total",
		Method:        http.MethodGet,
	}, backend.CallResourceResponseSenderFunc(func(resp *backend.CallResourceResponse) error {
		response = *resp
		return nil
	}))
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if response.Status != http.StatusOK {
		t.Fatalf("unexpected status: %d", response.Status)
	}

	var descriptor mirador.MetricDescriptor
	if err := json.Unmarshal(response.Body, &descriptor); err != nil {
		t.Fatalf("unmarshal response: %v", err)
	}

	if descriptor.Name != "http_requests_total" || descriptor.Unit != "requests" {
		t.Fatalf("unexpected metric descriptor: %#v", descriptor)
	}
}

func TestCallResourceTracesSchemaError(t *testing.T) {
	resetSchemaStateForTest(t)
	cleanup := setupTestHTTPClient(t, map[string]httpResponder{
		"/api/v1/schema/traces/services": func(w http.ResponseWriter, r *http.Request) {
			w.WriteHeader(http.StatusInternalServerError)
			w.Write([]byte(`{"error":"upstream failure"}`))
		},
	})
	defer cleanup()

	ds := Datasource{}
	settings := backend.DataSourceInstanceSettings{
		JSONData:                []byte(`{"url":"http://mirador.local"}`),
		DecryptedSecureJSONData: map[string]string{"bearerToken": "token"},
	}

	var response backend.CallResourceResponse
	err := ds.CallResource(context.Background(), &backend.CallResourceRequest{
		PluginContext: backend.PluginContext{DataSourceInstanceSettings: &settings},
		Path:          "schema/traces",
		Method:        http.MethodGet,
	}, backend.CallResourceResponseSenderFunc(func(resp *backend.CallResourceResponse) error {
		response = *resp
		return nil
	}))
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if response.Status != http.StatusBadGateway {
		t.Fatalf("expected bad gateway status, got %d", response.Status)
	}

	var payload map[string]string
	if err := json.Unmarshal(response.Body, &payload); err != nil {
		t.Fatalf("unmarshal response: %v", err)
	}

	if payload["error"] == "" {
		t.Fatal("expected error message in payload")
	}
}

func TestCallResourceLogsSchemaCachesResponses(t *testing.T) {
	resetSchemaStateForTest(t)
	callCount := 0
	cleanup := setupTestHTTPClient(t, map[string]httpResponder{
		"/api/v1/schema/logs/fields": func(w http.ResponseWriter, r *http.Request) {
			callCount++
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusOK)
			w.Write([]byte(`{"fields":[{"name":"service","type":"keyword"}],"version":"v1"}`))
		},
	})
	defer cleanup()

	ds := Datasource{}
	settings := backend.DataSourceInstanceSettings{
		JSONData:                []byte(`{"url":"http://mirador.local"}`),
		DecryptedSecureJSONData: map[string]string{"bearerToken": "token"},
	}

	req := &backend.CallResourceRequest{
		PluginContext: backend.PluginContext{DataSourceInstanceSettings: &settings},
		Path:          "schema/logs",
		Method:        http.MethodGet,
	}

	var response backend.CallResourceResponse
	sender := backend.CallResourceResponseSenderFunc(func(resp *backend.CallResourceResponse) error {
		response = *resp
		return nil
	})

	if err := ds.CallResource(context.Background(), req, sender); err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if err := ds.CallResource(context.Background(), req, sender); err != nil {
		t.Fatalf("second call unexpected error: %v", err)
	}

	if callCount != 1 {
		t.Fatalf("expected upstream to be called once, got %d", callCount)
	}

	var schema mirador.LogsSchema
	if err := json.Unmarshal(response.Body, &schema); err != nil {
		t.Fatalf("unmarshal response: %v", err)
	}
	if len(schema.Fields) != 1 || schema.Fields[0].Name != "service" {
		t.Fatalf("unexpected schema: %#v", schema)
	}
}

func TestCallResourceLogsSchemaOverride(t *testing.T) {
	resetSchemaStateForTest(t)
	callCount := 0
	cleanup := setupTestHTTPClient(t, map[string]httpResponder{
		"/api/v1/schema/logs/fields": func(w http.ResponseWriter, r *http.Request) {
			callCount++
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusOK)
			w.Write([]byte(`{"fields":[{"name":"service","type":"keyword","description":"Upstream"}]}`))
		},
	})
	defer cleanup()

	ds := Datasource{}
	settings := backend.DataSourceInstanceSettings{
		JSONData:                []byte(`{"url":"http://mirador.local"}`),
		DecryptedSecureJSONData: map[string]string{"bearerToken": "token"},
	}

	getReq := &backend.CallResourceRequest{
		PluginContext: backend.PluginContext{DataSourceInstanceSettings: &settings},
		Path:          "schema/logs",
		Method:        http.MethodGet,
	}

	sender := backend.CallResourceResponseSenderFunc(func(resp *backend.CallResourceResponse) error {
		return nil
	})

	if err := ds.CallResource(context.Background(), getReq, sender); err != nil {
		t.Fatalf("initial get error: %v", err)
	}

	if callCount != 1 {
		t.Fatalf("expected initial upstream call count 1, got %d", callCount)
	}

	postReq := &backend.CallResourceRequest{
		PluginContext: backend.PluginContext{DataSourceInstanceSettings: &settings},
		Path:          "schema/logs",
		Method:        http.MethodPost,
		Body:          []byte(`{"name":"service","type":"keyword","description":"Override"}`),
	}

	if err := ds.CallResource(context.Background(), postReq, sender); err != nil {
		t.Fatalf("post error: %v", err)
	}

	var response backend.CallResourceResponse
	senderCapture := backend.CallResourceResponseSenderFunc(func(resp *backend.CallResourceResponse) error {
		response = *resp
		return nil
	})

	if err := ds.CallResource(context.Background(), getReq, senderCapture); err != nil {
		t.Fatalf("second get error: %v", err)
	}

	if callCount != 2 {
		t.Fatalf("expected cache invalidation to refetch upstream, got %d calls", callCount)
	}

	var schema mirador.LogsSchema
	if err := json.Unmarshal(response.Body, &schema); err != nil {
		t.Fatalf("unmarshal response: %v", err)
	}

	if len(schema.Fields) == 0 || schema.Fields[0].Description != "Override" {
		t.Fatalf("expected override description, got %#v", schema.Fields)
	}

	// subsequent get should use cache and keep override
	if err := ds.CallResource(context.Background(), getReq, senderCapture); err != nil {
		t.Fatalf("third get error: %v", err)
	}

	if callCount != 2 {
		t.Fatalf("expected cache to prevent additional upstream calls, got %d", callCount)
	}
}

func fieldByName(t *testing.T, frame *data.Frame, name string) *data.Field {
	t.Helper()
	for _, field := range frame.Fields {
		if field.Name == name {
			return field
		}
	}
	t.Fatalf("field %s not found", name)
	return nil
}
