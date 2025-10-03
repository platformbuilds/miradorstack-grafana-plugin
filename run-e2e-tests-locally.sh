#!/bin/bash

# Variables
APP_DIR="./app"            # Directory for the app
DATASOURCE_DIR="./datasource"  # Directory for the datasource
PLUGIN_DIR="$APP_DIR/dist"     # Path for the built app plugins
DATASOURCE_PLUGIN_DIR="$DATASOURCE_DIR/dist"  # Path for the built datasource plugins

# Clean previous builds
echo "Cleaning previous build artifacts..."
rm -rf $PLUGIN_DIR/*
rm -rf $DATASOURCE_PLUGIN_DIR/*

# Build the app and datasource plugins
echo "Building the app plugins..."
cd $APP_DIR
mage -v buildAll
npm ci
npm run build
cd ..

echo "Building the datasource plugins..."
cd $DATASOURCE_DIR
mage -v buildAll
npm ci
npm run build
cd ..

# Start the Grafana container using docker compose
echo "Starting Grafana with docker compose..."
docker compose up -d

# Wait for Grafana to be healthy
echo "Waiting for Grafana to be healthy..."
for i in {1..60}; do
  if curl -s http://admin:admin@localhost:3000/api/health > /dev/null; then
    echo "Grafana is healthy"
    break
  fi
  sleep 2
done

# Check if plugins are loaded
echo "Checking if plugins are loaded..."
PLUGIN_CHECK_ATTEMPTS=30
for i in $(seq 1 $PLUGIN_CHECK_ATTEMPTS); do
  APP_PLUGIN_LOADED=$(curl -s "http://admin:admin@localhost:3000/api/plugins/miradorstack-miradorexplorer-app" | grep -q '"id":"miradorstack-miradorexplorer-app"' && echo "true" || echo "false")
  DATASOURCE_PLUGIN_LOADED=$(curl -s "http://admin:admin@localhost:3000/api/plugins/miradorstack-miradorcoreconnector-datasource" | grep -q '"id":"miradorstack-miradorcoreconnector-datasource"' && echo "true" || echo "false")

  if [ "$APP_PLUGIN_LOADED" = "true" ] && [ "$DATASOURCE_PLUGIN_LOADED" = "true" ]; then
    echo "Both plugins loaded successfully"
    break
  fi

  if [ $i -eq $PLUGIN_CHECK_ATTEMPTS ]; then
    echo "ERROR: Plugins failed to load after $PLUGIN_CHECK_ATTEMPTS attempts"
    echo "App plugin loaded: $APP_PLUGIN_LOADED"
    echo "Datasource plugin loaded: $DATASOURCE_PLUGIN_LOADED"
    echo "Grafana logs:"
    docker compose logs grafana
    exit 1
  fi

  echo "Waiting for plugins to load... (attempt $i/$PLUGIN_CHECK_ATTEMPTS)"
  sleep 3
done

# Run tests for the app plugins locally
echo "Running e2e tests for the app plugins locally..."
cd $APP_DIR
npm ci
npm run e2e > ../app_test_results.log 2>&1
cd ..

# Run tests for the datasource plugins locally
echo "Running e2e tests for the datasource plugins locally..."
cd $DATASOURCE_DIR
npm ci
npm run e2e > ../datasource_test_results.log 2>&1
cd ..

# Output the test results
echo "App Test results:"
cat app_test_results.log
echo "Datasource Test results:"
cat datasource_test_results.log

# Clean up: stop and remove the Grafana container
#echo "Cleaning up..."
#docker compose down