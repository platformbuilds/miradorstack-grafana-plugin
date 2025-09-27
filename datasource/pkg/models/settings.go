package models

import (
	"encoding/json"
	"fmt"

	"github.com/grafana/grafana-plugin-sdk-go/backend"
)

type PluginSettings struct {
	URL             string                `json:"url"`
	TenantID        string                `json:"tenantId"`
	EnableWebSocket bool                  `json:"enableWebSocket"`
	TimeoutMs       int                   `json:"timeoutMs"`
	WebsocketURL    string                `json:"websocketUrl"`
	Secrets         *SecretPluginSettings `json:"-"`
}

type SecretPluginSettings struct {
	BearerToken string `json:"bearerToken"`
}

func LoadPluginSettings(source backend.DataSourceInstanceSettings) (*PluginSettings, error) {
	settings := PluginSettings{}
	err := json.Unmarshal(source.JSONData, &settings)
	if err != nil {
		return nil, fmt.Errorf("could not unmarshal PluginSettings json: %w", err)
	}

	settings.Secrets = loadSecretPluginSettings(source.DecryptedSecureJSONData)

	return &settings, nil
}

func loadSecretPluginSettings(source map[string]string) *SecretPluginSettings {
	return &SecretPluginSettings{
		BearerToken: source["bearerToken"],
	}
}
