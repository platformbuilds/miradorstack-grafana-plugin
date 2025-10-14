#!/bin/bash
set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Starting MiradorStack Grafana Plugin local development setup...${NC}"

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "Docker is not running. Please start Docker and try again."
    exit 1
fi

# Function to check if rebuild is needed
needs_rebuild() {
    local dist_dir="$1"
    local source_dir="$2"
    
    # If dist directory doesn't exist, rebuild is needed
    if [ ! -d "$dist_dir" ]; then
        return 0
    fi
    
    # Check if any source files are newer than the dist directory
    if find "$source_dir" -type f -newer "$dist_dir" | grep -q .; then
        return 0
    fi
    
    return 1
}

# Build Go code only if needed
cd platformbuilds-miradorstackgrafanaplugin-app
if needs_rebuild "dist" "." || [ "$1" == "--force" ]; then
    echo -e "${GREEN}Building Go code and frontend...${NC}"
    go build -v ./...
    go generate ./...
    yarn install
    yarn build
else
    echo -e "${BLUE}Code is up to date, skipping build${NC}"
fi
cd ..

# Ensure plugin directories exist
mkdir -p platformbuilds-miradorstackgrafanaplugin-app/dist

# Check if Grafana is already running
if docker compose ps | grep -q "miradorstack-grafana.*Up"; then
    echo -e "${YELLOW}Grafana is already running. Restarting...${NC}"
    docker compose restart grafana
else
    # Start Grafana with our plugin
    echo -e "${GREEN}Starting Grafana with MiradorStack plugin...${NC}"
    docker compose up --build -d
fi

# Wait for Grafana to be ready
echo -e "${YELLOW}Waiting for Grafana to be ready...${NC}"
attempts=0
max_attempts=30
until curl -s http://localhost:3000 > /dev/null || [ $attempts -eq $max_attempts ]; do
    echo "Waiting for Grafana... ($(( max_attempts - attempts )) attempts remaining)"
    attempts=$((attempts + 1))
    sleep 2
done

if [ $attempts -eq $max_attempts ]; then
    echo -e "${RED}Failed to connect to Grafana after $(( max_attempts * 2 )) seconds${NC}"
    echo "Check docker logs with: docker compose logs grafana"
    exit 1
fi

echo -e "${GREEN}==================================${NC}"
echo -e "${GREEN}Setup completed successfully!${NC}"
echo -e "${GREEN}Grafana is running at: ${NC}http://localhost:3000"
echo -e "${GREEN}Default credentials: ${NC}"
echo -e "${GREEN}Username: ${NC}admin"
echo -e "${GREEN}Password: ${NC}admin"
echo -e ""
echo -e "${BLUE}Development commands:${NC}"
echo -e "${BLUE}- View Grafana logs: ${NC}docker compose logs -f grafana"
echo -e "${BLUE}- Rebuild plugins: ${NC}$0 --force"
echo -e "${BLUE}- Stop environment: ${NC}./localdev-down.sh"
echo -e "${GREEN}==================================${NC}"
