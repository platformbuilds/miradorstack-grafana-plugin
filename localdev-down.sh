#!/bin/bash
set -e

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}Shutting down MiradorStack Grafana Plugin development environment...${NC}"

# Stop all containers
docker compose down -v

echo -e "${GREEN}Cleanup completed successfully!${NC}"
