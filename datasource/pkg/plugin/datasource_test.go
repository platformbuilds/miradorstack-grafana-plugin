package plugin

import (
	"context"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/grafana/grafana-plugin-sdk-go/backend"
	"github.com/grafana/grafana-plugin-sdk-go/data"
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
