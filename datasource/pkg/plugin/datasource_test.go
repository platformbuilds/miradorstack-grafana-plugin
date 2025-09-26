package plugin

import (
	"context"
	"encoding/json"
	"testing"
	"time"

	"github.com/grafana/grafana-plugin-sdk-go/backend"
)

func TestQueryDataLogs(t *testing.T) {
	ds := Datasource{}

	settings := backend.DataSourceInstanceSettings{
		JSONData:                []byte(`{"url":"https://example.com"}`),
		DecryptedSecureJSONData: map[string]string{"bearerToken": "token"},
	}

	queryModel := map[string]any{
		"queryType": "logs",
		"query":     "level:ERROR",
		"limit":     1,
	}
	queryJSON, _ := json.Marshal(queryModel)

	resp, err := ds.QueryData(
		context.Background(),
		&backend.QueryDataRequest{
			PluginContext: backend.PluginContext{
				DataSourceInstanceSettings: &settings,
			},
			Queries: []backend.DataQuery{
				{
					RefID:     "A",
					JSON:      queryJSON,
					TimeRange: backend.TimeRange{From: time.Now().Add(-5 * time.Minute), To: time.Now()},
				},
			},
		},
	)
	if err != nil {
		t.Fatalf("QueryData returned error: %v", err)
	}

	res, ok := resp.Responses["A"]
	if !ok {
		t.Fatalf("expected response for ref A")
	}

	if len(res.Frames) == 0 {
		t.Fatalf("expected at least one frame in response")
	}

	if res.Frames[0].Fields[0].Len() == 0 {
		t.Fatalf("expected log rows in frame")
	}
}

func TestCheckHealthValidatesConfig(t *testing.T) {
	ds := Datasource{}

	settings := backend.DataSourceInstanceSettings{
		JSONData: []byte(`{"url":"https://example.com"}`),
	}

	res, _ := ds.CheckHealth(context.Background(), &backend.CheckHealthRequest{
		PluginContext: backend.PluginContext{DataSourceInstanceSettings: &settings},
	})

	if res.Status != backend.HealthStatusError {
		t.Fatalf("expected error due to missing token")
	}

	settings.DecryptedSecureJSONData = map[string]string{"bearerToken": "token"}

	res, _ = ds.CheckHealth(context.Background(), &backend.CheckHealthRequest{
		PluginContext: backend.PluginContext{DataSourceInstanceSettings: &settings},
	})

	if res.Status != backend.HealthStatusOk {
		t.Fatalf("expected ok status once token is provided")
	}
}
