#!/bin/bash

# localdev-down.sh - Clean shutdown of local development environment for Miradorstack Grafana Plugin

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if Docker is running
check_docker() {
    if ! docker info >/dev/null 2>&1; then
        log_error "Docker is not running. Cannot stop containers."
        exit 1
    fi
}

# Function to stop Grafana containers
stop_containers() {
    log_info "Stopping Grafana containers..."

    if docker compose ps | grep -q "miradorstack-grafana"; then
        if ! docker compose down; then
            log_error "Failed to stop containers gracefully"
            exit 1
        fi
        log_success "Containers stopped successfully"
    else
        log_info "No running containers found"
    fi
}

# Function to clean up Docker resources (optional)
cleanup_resources() {
    local do_cleanup=false

    # Check if --clean flag is provided
    if [[ "$1" == "--clean" ]]; then
        do_cleanup=true
    fi

    if [[ "$do_cleanup" == true ]]; then
        log_info "Cleaning up Docker resources..."

        # Remove stopped containers
        log_info "Removing stopped containers..."
        docker container prune -f >/dev/null 2>&1 || true

        # Remove unused networks
        log_info "Removing unused networks..."
        docker network prune -f >/dev/null 2>&1 || true

        # Remove unused volumes (be careful with this)
        log_info "Removing unused volumes..."
        docker volume prune -f >/dev/null 2>&1 || true

        log_success "Docker resources cleaned up"
    fi
}

# Function to clean build artifacts (optional)
clean_build_artifacts() {
    local do_clean_build=false

    # Check if --clean-build flag is provided
    if [[ "$1" == "true" ]]; then
        do_clean_build=true
    fi

    if [[ "$do_clean_build" == true ]]; then
        log_info "Cleaning build artifacts..."

        # Remove app dist directory
        if [[ -d "app/dist" ]]; then
            rm -rf app/dist
            log_info "Removed app/dist directory"
        fi

        # Remove datasource dist directory
        if [[ -d "datasource/dist" ]]; then
            rm -rf datasource/dist
            log_info "Removed datasource/dist directory"
        fi

        # Remove Golang binaries
        if [[ -f "app/gpx_miradorstack_app" ]]; then
            rm -f app/gpx_miradorstack_app
            log_info "Removed app/gpx_miradorstack_app binary"
        fi

        if [[ -f "datasource/gpx_miradorstack_datasource" ]]; then
            rm -f datasource/gpx_miradorstack_datasource
            log_info "Removed datasource/gpx_miradorstack_datasource binary"
        fi

        # Remove node_modules (optional, more aggressive)
        if [[ "$2" == "true" ]]; then
            if [[ -d "app/node_modules" ]]; then
                rm -rf app/node_modules
                log_info "Removed app/node_modules directory"
            fi
            if [[ -d "datasource/node_modules" ]]; then
                rm -rf datasource/node_modules
                log_info "Removed datasource/node_modules directory"
            fi
        fi

        log_success "Build artifacts cleaned"
    fi
}

# Function to display usage information
show_usage() {
    echo "Usage: $0 [OPTIONS]"
    echo
    echo "Clean shutdown of local development environment for Miradorstack Grafana Plugin"
    echo
    echo "Options:"
    echo "  --clean         Clean up Docker resources (containers, networks, volumes)"
    echo "  --clean-build   Clean build artifacts (dist directories)"
    echo "  --full          When used with --clean-build, also remove node_modules"
    echo "  -h, --help      Show this help message"
    echo
    echo "Examples:"
    echo "  $0                          # Stop containers only"
    echo "  $0 --clean                  # Stop containers and clean Docker resources"
    echo "  $0 --clean-build            # Stop containers and clean build artifacts"
    echo "  $0 --clean --clean-build --full  # Full cleanup including node_modules"
}

# Main execution
main() {
    echo -e "${BLUE}🛑 Shutting down Miradorstack Grafana Plugin Local Development Environment${NC}"
    echo

    # Parse command line arguments
    local clean=false
    local clean_build=false
    local full=false

    while [[ $# -gt 0 ]]; do
        case $1 in
            --clean)
                clean=true
                shift
                ;;
            --clean-build)
                clean_build=true
                shift
                ;;
            --full)
                full=true
                shift
                ;;
            -h|--help)
                show_usage
                exit 0
                ;;
            *)
                log_error "Unknown option: $1"
                show_usage
                exit 1
                ;;
        esac
    done

    check_docker
    stop_containers

    if [[ "$clean" == true ]]; then
        cleanup_resources
    fi

    if [[ "$clean_build" == true ]]; then
        clean_build_artifacts "$clean_build" "$full"
    fi

    echo
    log_success "Environment shutdown complete!"
    echo
    echo -e "${YELLOW}To restart the environment, run:${NC} ./localdev-up.sh"
}

# Run main function
main "$@"