#!/bin/bash

# localdev-up.sh - Automated local development environment setup for Miradorstack Grafana Plugin
# This script builds plugins end-to-end, deploys Grafana in container, and brings up the testing environment

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

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

# Function to detect system architecture for binary selection
detect_architecture() {
    local arch=$(uname -m)
    local os=$(uname -s | tr '[:upper:]' '[:lower:]')
    
    case $arch in
        x86_64|amd64)
            echo "${os}_amd64"
            ;;
        arm64|aarch64)
            echo "${os}_arm64"
            ;;
        arm*)
            echo "${os}_arm"
            ;;
        *)
            echo "${os}_amd64"  # fallback
            ;;
    esac
}

# Function to ensure correct binary is available for Docker
ensure_docker_binary() {
    local plugin_dir=$1
    local executable_name=$2
    local arch_suffix=$3
    
    local binary_path="${plugin_dir}/dist/${executable_name}_${arch_suffix}"
    local expected_path="${plugin_dir}/dist/${executable_name}"
    
    if [ -f "$binary_path" ]; then
        log_info "Found binary: ${binary_path}"
        # Create a copy with the expected name if it doesn't exist
        if [ ! -f "$expected_path" ]; then
            cp "$binary_path" "$expected_path"
            log_info "Copied ${binary_path} to ${expected_path}"
        fi
    else
        log_warning "Binary not found: ${binary_path}"
        # Try linux_amd64 as fallback for Docker compatibility
        local linux_binary="${plugin_dir}/dist/${executable_name}_linux_amd64"
        if [ -f "$linux_binary" ]; then
            log_info "Using Linux binary as fallback: ${linux_binary}"
            if [ ! -f "$expected_path" ]; then
                cp "$linux_binary" "$expected_path"
                log_info "Copied ${linux_binary} to ${expected_path}"
            fi
        fi
    fi
}

# Function to check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."

    # Check for Node.js
    if ! command_exists node; then
        log_error "Node.js is not installed. Please install Node.js 22+ first."
        exit 1
    fi

    NODE_VERSION=$(node --version | sed 's/v//')
    if ! [[ "$NODE_VERSION" =~ ^22\. ]]; then
        log_warning "Node.js version $NODE_VERSION detected. Recommended: 22.0.0+"
    fi

    # Check for npm
    if ! command_exists npm; then
        log_error "npm is not installed. Please install npm 11.5+ first."
        exit 1
    fi

    NPM_VERSION=$(npm --version)
    if ! [[ "$NPM_VERSION" =~ ^11\. ]]; then
        log_warning "npm version $NPM_VERSION detected. Recommended: 11.5.1+"
    fi

    # Check for mage (Go build tool)
    if ! command_exists mage; then
        log_error "mage is not installed. Please install mage (go install github.com/magefile/mage@latest) first."
        exit 1
    fi

    # Check for Go (required for mage builds)
    if ! command_exists go; then
        log_error "Go is not installed. Please install Go 1.21+ first."
        exit 1
    fi

    GO_VERSION=$(go version | grep -o 'go[0-9]\+\.[0-9]\+' | sed 's/go//')
    if ! [[ "$GO_VERSION" =~ ^1\.(2[1-9]|[3-9][0-9]) ]]; then
        log_warning "Go version $GO_VERSION detected. Recommended: 1.21+"
    fi
    if ! command_exists docker; then
        log_error "Docker is not installed. Please install Docker Desktop first."
        exit 1
    fi

    # Check if Docker is running
    if ! docker info >/dev/null 2>&1; then
        log_error "Docker is not running. Please start Docker Desktop first."
        exit 1
    fi

    log_success "Prerequisites check passed"
}

# Function to install dependencies
install_dependencies() {
    log_info "Installing dependencies for plugins..."

    # Install app plugin dependencies
    log_info "Installing app plugin dependencies..."
    if ! npm install --prefix app; then
        log_error "Failed to install app plugin dependencies"
        exit 1
    fi

    # Install datasource plugin dependencies
    log_info "Installing datasource plugin dependencies..."
    if ! npm install --prefix datasource; then
        log_error "Failed to install datasource plugin dependencies"
        exit 1
    fi

    log_success "Dependencies installed successfully"
}

# Function to build plugins
build_plugins() {
    log_info "Building plugins..."

    # Clean previous builds to ensure freshness
    log_info "Cleaning previous builds..."
    rm -rf app/dist
    rm -rf datasource/dist

    # Detect architecture for binary selection
    ARCH_SUFFIX=$(detect_architecture)
    log_info "Detected architecture: $ARCH_SUFFIX"

    # Build app plugin frontend
    log_info "Building app plugin frontend..."
    if ! npm run build --prefix app; then
        log_error "Failed to build app plugin frontend"
        exit 1
    fi

    # Verify app plugin frontend build
    if [ ! -f "app/dist/module.js" ]; then
        log_error "App plugin frontend build failed - module.js not found"
        exit 1
    fi

    # Build app plugin backend
    log_info "Building app plugin backend..."
    if ! (cd app && mage buildAll); then
        log_error "Failed to build app plugin backend"
        exit 1
    fi

    # Ensure correct binary for Docker
    ensure_docker_binary "app" "platformbuilds-miradorstackconnect-app" "$ARCH_SUFFIX"

    # Verify app plugin backend build (check for Linux binary for Docker)
    if [ ! -f "app/dist/platformbuilds-miradorstackconnect-app_linux_amd64" ]; then
        log_error "App plugin backend build failed - Linux AMD64 binary not found"
        exit 1
    fi

    # Build datasource plugin frontend
    log_info "Building datasource plugin frontend..."
    if ! npm run build --prefix datasource; then
        log_error "Failed to build datasource plugin frontend"
        exit 1
    fi

    # Verify datasource plugin frontend build
    if [ ! -f "datasource/dist/module.js" ]; then
        log_error "Datasource plugin frontend build failed - module.js not found"
        exit 1
    fi

    # Build datasource plugin backend
    log_info "Building datasource plugin backend..."
    if ! (cd datasource && mage buildAll); then
        log_error "Failed to build datasource plugin backend"
        exit 1
    fi

    # Ensure correct binary for Docker
    ensure_docker_binary "datasource" "gpx_miradorstack_datasource" "$ARCH_SUFFIX"

    # Verify datasource plugin backend build (check for Linux binary for Docker)
    if [ ! -f "datasource/dist/gpx_miradorstack_datasource_linux_amd64" ]; then
        log_error "Datasource plugin backend build failed - Linux AMD64 binary not found"
        exit 1
    fi

    log_success "Plugins built successfully"
}

# Function to start Grafana with Docker Compose
start_grafana() {
    log_info "Starting Grafana with Docker Compose..."

    # Modify docker-compose.yml to use host network for Grafana
    log_info "Configuring Grafana to use host network..."
    if command_exists sed; then
        # Create a backup of the original docker-compose.yml
        cp docker-compose.yml docker-compose.yml.backup
        
        # Replace the networks configuration with network_mode: host
        sed -i.bak '/networks:/,/miradorstack:/{ 
            /networks:/{
                s/networks:/network_mode: host/
                N
                s/\n.*miradorstack.*//
            }
        }' docker-compose.yml
        
        # Remove the networks section at the bottom
        sed -i.bak '/^networks:/,/^volumes:/{ 
            /^networks:/d
            /^  miradorstack:/d
            /^    driver: bridge/d
        }' docker-compose.yml
        
        # Clean up temporary backup files
        rm -f docker-compose.yml.bak
    else
        log_warning "sed not available, skipping network configuration modification"
    fi

    # Stop any existing containers first
    log_info "Stopping any existing containers..."
    docker compose down >/dev/null 2>&1 || true

    # Start Grafana with plugins
    log_info "Starting Grafana container with plugins..."
    if ! docker compose up --build -d; then
        log_error "Failed to start Grafana with Docker Compose"
        exit 1
    fi

    log_success "Grafana started successfully"
}

# Function to wait for Grafana to be ready
wait_for_grafana() {
    log_info "Waiting for Grafana to be ready..."

    local max_attempts=30
    local attempt=1

    while [ $attempt -le $max_attempts ]; do
        if curl -s http://localhost:3000/api/health >/dev/null 2>&1; then
            log_success "Grafana is ready!"
            return 0
        fi

        log_info "Waiting for Grafana... (attempt $attempt/$max_attempts)"
        sleep 2
        ((attempt++))
    done

    log_error "Grafana failed to start within expected time"
    log_info "Check Grafana logs with: docker compose logs -f grafana"
    exit 1
}

# Function to verify plugin loading
verify_plugins() {
    log_info "Verifying plugin loading..."

    # Wait a bit for plugins to load
    sleep 5

    # Check if plugins are loaded
    local plugins_output
    plugins_output=$(docker compose exec -T grafana grafana-cli plugins ls 2>/dev/null || echo "")

    if echo "$plugins_output" | grep -q "platformbuilds-miradorstackconnect-app"; then
        log_success "App plugin loaded successfully"
    else
        log_warning "App plugin may not be loaded yet"
    fi

    if echo "$plugins_output" | grep -q "miradorstack-datasource"; then
        log_success "Datasource plugin loaded successfully"
    else
        log_warning "Datasource plugin may not be loaded yet"
    fi
}

# Function to display success message and next steps
display_success() {
    echo
    log_success "🎉 Local development environment is ready!"
    echo
    echo -e "${BLUE}What was built:${NC}"
    echo "- App plugin: Frontend bundle + Go binary for $ARCH_SUFFIX"
    echo "- Datasource plugin: Frontend bundle + Go binary for $ARCH_SUFFIX"
    echo "- All binaries compiled with mage for cross-platform support"
    echo "- Docker-compatible Linux binaries verified for container deployment"
    echo
    echo -e "${BLUE}Grafana is running at:${NC} http://localhost:3000"
    echo -e "${BLUE}Login credentials:${NC} admin / admin"
    echo
    echo -e "${YELLOW}Next steps:${NC}"
    echo "1. Open http://localhost:3000 in your browser"
    echo "2. Go to Configuration → Plugins to verify plugin installation"
    echo "3. Configure the Mirador Core Connector datasource"
    echo "4. Access Mirador Explorer from the navigation menu"
    echo
    echo -e "${YELLOW}Development commands:${NC}"
    echo "- View logs: docker compose logs -f grafana"
    echo "- Stop environment: docker compose down"
    echo "- Restart: docker compose restart"
    echo
    echo -e "${YELLOW}For hot reloading during development:${NC}"
    echo "- App plugin: npm run dev --prefix app"
    echo "- Datasource plugin: npm run dev --prefix datasource"
}

# Function to display usage information
show_usage() {
    echo "Usage: $0 [OPTIONS]"
    echo
    echo "Automated local development environment setup for Miradorstack Grafana Plugin"
    echo "Builds plugins end-to-end, deploys Grafana in container, and brings up the testing environment"
    echo
    echo "Options:"
    echo "  -h, --help      Show this help message"
    echo
    echo "Examples:"
    echo "  $0              # Start the local development environment"
    echo "  $0 --help       # Show this help message"
}

# Main execution
main() {
    # Parse command line arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
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

    echo -e "${BLUE}🚀 Starting Miradorstack Grafana Plugin Local Development Environment${NC}"
    echo

    check_prerequisites
    install_dependencies
    build_plugins
    start_grafana
    wait_for_grafana
    verify_plugins
    display_success
}

# Run main function
main "$@"