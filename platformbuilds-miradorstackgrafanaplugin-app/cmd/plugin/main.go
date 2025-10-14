package main

import (
	"os"

	"github.com/grafana/grafana-plugin-sdk-go/backend"
	miradorbackend "github.com/platformbuilds/miradorstack-grafana-plugin/pkg/backend"
)

func main() {
	// Initialize the plugin environment
	backend.SetupPluginEnvironment("platformbuilds-miradorstack")

	backend.Logger.Info("Starting Mirador Stack plugin")

	// Create and start the plugin
	plugin := miradorbackend.New()
	opts := backend.ServeOpts{
		CheckHealthHandler: plugin,
		QueryDataHandler:   plugin,
	}

	if err := backend.Serve(opts); err != nil {
		backend.Logger.Error("Plugin server failed", "error", err.Error())
		os.Exit(1)
	}
}
