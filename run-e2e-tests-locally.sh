#!/bin/bash

# Variables
GRAFANA_CONTAINER_NAME="miradorstack-integration-grafana"
GRAFANA_IMAGE="grafana/grafana:12.2.0"
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
npm ci
npm run build  # Assuming this builds the app and populates the dist directory
cd ..

echo "Building the datasource plugins..."
cd $DATASOURCE_DIR
npm ci
npm run build  # Assuming this builds the datasource and populates the dist directory
cd ..

# Start the Grafana container
docker run -d --name $GRAFANA_CONTAINER_NAME \
  -p 3000:3000 \
  --health-cmd="wget -qO- http://localhost:3000/login >/dev/null || exit 1" \
  --health-interval=5s \
  --health-timeout=3s \
  --health-retries=20 \
  $GRAFANA_IMAGE

# Wait for Grafana to be healthy
echo "Waiting for Grafana to be healthy..."
for i in {1..60}; do
  status=$(docker inspect -f '{{.State.Health.Status}}' $GRAFANA_CONTAINER_NAME || echo "unknown")
  if [ "$status" = "healthy" ]; then
    echo "Grafana is healthy"
    break
  fi
  sleep 2
done

# Copy app plugins to Grafana
echo "Copying app plugins to Grafana container..."
docker exec $GRAFANA_CONTAINER_NAME mkdir -p /var/lib/grafana/plugins/platformbuilds-miradorstack-app
docker cp $PLUGIN_DIR/. $GRAFANA_CONTAINER_NAME:/var/lib/grafana/plugins/platformbuilds-miradorstack-app/

# Copy datasource plugins to Grafana
echo "Copying datasource plugins to Grafana container..."
docker exec $GRAFANA_CONTAINER_NAME mkdir -p /var/lib/grafana/plugins/platformbuilds-miradorstack-datasource
docker cp $DATASOURCE_PLUGIN_DIR/. $GRAFANA_CONTAINER_NAME:/var/lib/grafana/plugins/platformbuilds-miradorstack-datasource/

# Run tests for the app plugins inside the Grafana container
echo "Running integration tests for the app plugins in the container..."
docker exec -w /var/lib/grafana/plugins/platformbuilds-miradorstack-app $GRAFANA_CONTAINER_NAME npm run e2e > app_test_results.log

# Run tests for the datasource plugins inside the Grafana container
echo "Running integration tests for the datasource plugins in the container..."
docker exec -w /var/lib/grafana/plugins/platformbuilds-miradorstack-datasource $GRAFANA_CONTAINER_NAME npm run e2e > datasource_test_results.log

# Output the test results
echo "App Test results:"
cat app_test_results.log
echo "Datasource Test results:"
cat datasource_test_results.log

# Clean up: stop and remove the Grafana container
docker stop $GRAFANA_CONTAINER_NAME
docker rm $GRAFANA_CONTAINER_NAME