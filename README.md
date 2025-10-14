# Miradorstack Grafana Plugin Suite

[![CodeQL Analysis](https://github.com/platformbuilds/miradorstack-grafana-plugin/actions/workflows/code-analysis.yml/badge.svg)](https://github.com/platformbuilds/miradorstack-grafana-plugin/actions/workflows/code-analysis.yml)
[![Security Scan](https://github.com/platformbuilds/miradorstack-grafana-plugin/actions/workflows/code-analysis.yml/badge.svg?event=security_scan)](https://github.com/platformbuilds/miradorstack-grafana-plugin/actions/workflows/code-analysis.yml)
[![Go Report Card](https://goreportcard.com/badge/github.com/platformbuilds/miradorstack-grafana-plugin/datasource)](https://goreportcard.com/report/github.com/platformbuilds/miradorstack-grafana-plugin/datasource)
[![License](https://img.shields.io/github/license/platformbuilds/miradorstack-grafana-plugin)](LICENSE)

## Security and Code Quality

| Analysis Type | Status | Details |
|--------------|--------|----------|
| CodeQL Analysis | ✅ Enabled | Daily scans for Go & TypeScript |
| Vulnerability Check | ✅ Enabled | Using govulncheck (Go) & OWASP Dependency-Check (TS) |
| Code Quality | ✅ Monitored | Regular scans with severity-based alerts |
| Security Scanning | 🔒 Active | CVSS 7+ vulnerabilities blocked |

Mirador Explorer is a Grafana app plugin bundled with a dedicated Mirador Core data source. The app delivers Kibana-style log discovery workflows (field stats, AI insights, schema browsing) while the data source handles authenticated access to Mirador Core APIs.

## Repository Layout

- `app/` – Mirador Explorer app plugin (custom pages, navigation, UX shell)
- `datasource/` – Mirador Core Connector data source plugin
- `dev/` – Engineering docs (action plan, design baselines, testing strategy)
- `architecture-plan.md` – High-level technical blueprint

## Key Features

- Discover workspace with field statistics, histogram interactions, and Lucene builder powered queries.
- Schema Browser surfacing Mirador log fields, metric descriptors, and trace services pulled directly from the datasource backend.
- Mirador Core datasource with authenticated log/metric/trace queries, health checks, and schema resource handlers.
- Live log streaming via WebSocket and comprehensive test harness across Go and TypeScript layers.
- Saved searches, query history, and CSV/JSON exports to accelerate investigation workflows.
- Logs Explorer dashboard panel that deep links Grafana dashboards into the Discover experience.

## Prerequisites
## Linting & ESLint Compatibility

**Sanity/ToDo:**

- This repo uses ESLint 8.x and `@grafana/eslint-config@8.x` because Grafana's official config does **not** support ESLint 9.x or flat config as of September 2025.
- Attempting to use ESLint 9.x or the flat config will break linting and CI/CD due to missing compatibility in `@grafana/eslint-config`.
- We are pinned to 8.x until Grafana releases a compatible config for ESLint 9.x. This is a hard dependency for all plugin code quality and CI workflows.
- **TODO:** Upgrade to ESLint 9.x and flat config once Grafana releases an official compatible version. Track this in future sprints.

**Why:**
- Grafana plugin development requires using their official lint config for code style, best practices, and CI/CD compatibility.
- The latest available version (`@grafana/eslint-config@8.x`) only supports ESLint 8.x and legacy config format.
- This is a known limitation and is documented here for transparency and future upgrades.

### Development Requirements
- Node.js 22+
- npm 11.5+
- Docker (for local Grafana dev server)

### Production Requirements
- Grafana ≥12.2.0
  - Required for modern UI components
  - Needed for React 18 compatibility
  - Supports all plugin features and APIs

### Plugin Compatibility Matrix
| Component | Minimum Version | Recommended Version |
|-----------|----------------|-------------------|
| Grafana | 12.2.0 | 12.2.0+ |
| Node.js | 22.0.0 | 22.0.0+ |
| npm | 11.5.1 | 11.5.1+ |
| React | 18.2.0 | 18.2.0 |
| TypeScript | 5.5.4 | 5.5.4+ |

## Getting Started

### Quick Start

**Option 1: Automated Setup (Recommended)**
```bash
git clone https://github.com/platformbuilds/miradorstack-grafana-plugin
cd miradorstack-grafana-plugin

# Run the automated setup script
./localdev-up.sh
```

**Option 2: Manual Setup**
1. **Clone and install dependencies:**
   ```bash
   git clone https://github.com/platformbuilds/miradorstack-grafana-plugin
   cd miradorstack-grafana-plugin

   # Install dependencies for both plugins
   npm install --prefix app
   npm install --prefix datasource
   ```

2. **Build plugins for development:**
   ```bash
   # Build both plugins (required for Docker mounting)
   npm run build --prefix app
   npm run build --prefix datasource
   ```

3. **Start Grafana with plugins:**
   ```bash
   # Start Grafana with both plugins mounted
   docker compose up --build
   ```

4. **Access Grafana:**
   - Open http://localhost:3000
   - Login with `admin` / `admin`
   - Configure the Mirador Core Connector datasource
     - **URL**: Use `http://host.docker.internal:8080` (Docker provides this alias to reach services on the host)
   - Access Mirador Explorer from the navigation menu

### Development Workflow

For active development with hot reloading:

1. **Start development watchers** (in separate terminals):
   ```bash
   # Terminal 1: App plugin development
   npm run dev --prefix app

   # Terminal 2: Datasource plugin development
   npm run dev --prefix datasource
   ```

2. **Start Grafana** (in a third terminal):
   ```bash
   docker compose up --build
   ```

The development watchers will automatically rebuild plugins when you make changes, and Grafana will hot-reload the updated plugins.

### Manual Build Commands

```bash
# Build app plugin for production
npm run build --prefix app

# Build datasource plugin for production
npm run build --prefix datasource

# Build both plugins
npm run build --prefix app && npm run build --prefix datasource
```

### Development Server Options

```bash
# Start Grafana with specific version
GRAFANA_VERSION=12.2.0 docker compose up --build

# Start Grafana in detached mode
docker compose up -d --build

# View logs
docker compose logs -f grafana

# Stop Grafana
docker compose down
```

### Dashboard panel

Under **Dashboards → Panels → Logs Explorer Panel**, add the Mirador panel to provide one-click navigation into Discover with a preconfigured Lucene query. Panel options let you set the default query and toggle the inline summary; the panel automatically respects the dashboard time range.

## Production Deployment

### Using Helm Charts

If you're deploying Grafana using Helm charts, you can install this plugin by adding it to the plugins list in your `values.yaml`:

```yaml
grafana:
  plugins:
    - platformbuilds-miradorstack-miradorexplorer-app
    - platformbuilds-miradorcoreconnector-datasource

  # Optional: If you want to load the plugin from a specific URL
  # pluginUrls:
  #   - https://github.com/platformbuilds/miradorstack-grafana-plugin/releases/download/v1.0.0/miradorstack-miradorexplorer-app-1.0.0.zip
  #   - https://github.com/platformbuilds/miradorstack-grafana-plugin/releases/download/v1.0.0/miradorstack-miradorcoreconnector-datasource-1.0.0.zip

  # Required configuration for the plugin
  grafana.ini:
    plugins:
      allow_loading_unsigned_plugins: "platformbuilds-miradorstack-miradorexplorer-app,platformbuilds-miradorcoreconnector-datasource"
```

Deploy or upgrade your Grafana installation:

```bash
# Add the Grafana Helm repository
helm repo add grafana https://grafana.github.io/helm-charts
helm repo update

# Install/upgrade Grafana with the plugin
helm upgrade --install my-grafana grafana/grafana -f values.yaml
```

After deployment:
1. Access your Grafana instance
2. Go to **Configuration → Plugins** to verify the plugin installation
3. Configure the Mirador Core Connector data source with your API credentials
4. Open **Configuration → Mirador Explorer** to complete the setup

## Testing

This project includes comprehensive testing across multiple layers: TypeScript unit tests, Go backend tests, and end-to-end tests.

### Unit Testing

#### App Plugin Tests
```bash
# Run tests in watch mode (recommended for development)
npm run test --prefix app

# Run tests once (CI mode)
npm run test:ci --prefix app

# Run with coverage
npm run test:ci --prefix app -- --coverage
```

#### Datasource Plugin Tests
```bash
# Run tests in watch mode (recommended for development)
npm run test --prefix datasource

# Run tests once (CI mode)
npm run test:ci --prefix datasource

# Run with coverage
npm run test:ci --prefix datasource -- --coverage
```

#### Backend Go Tests
```bash
# Run all Go tests
cd datasource
go test ./...

# Run tests with verbose output
go test -v ./...

# Run tests with coverage
go test -cover ./...
```

### Code Quality Checks

#### Linting and Type Checking
```bash
# Lint app plugin
npm run lint --prefix app

# Auto-fix linting issues
npm run lint:fix --prefix app

# Type check app plugin
npm run typecheck --prefix app

# Lint datasource plugin
npm run lint --prefix datasource

# Auto-fix linting issues
npm run lint:fix --prefix datasource

# Type check datasource plugin
npm run typecheck --prefix datasource
```

### End-to-End Testing

#### Playwright E2E Tests
```bash
# Install Playwright browsers (first time only)
npm run e2e:install --prefix app

# Run E2E tests
npm run e2e --prefix app

# Run E2E tests in headed mode (see browser)
npm run e2e --prefix app -- --headed

# Run specific test
npm run e2e --prefix app -- --grep "test name"
```

### Smoke Testing

Run the comprehensive smoke test suite that validates the entire datasource plugin:

```bash
# Run smoke tests (includes unit tests, type checking, and Go tests)
./dev/tests/smoke.sh
```

### Testing in Development

For the best development experience, run tests in watch mode while developing:

```bash
# Terminal 1: App tests in watch mode
npm run test --prefix app

# Terminal 2: Datasource tests in watch mode
npm run test --prefix datasource

# Terminal 3: Go tests (rerun manually as needed)
cd datasource && go test ./...
```

### Test Coverage

Current test coverage includes:
- **TypeScript Unit Tests**: 57+ tests covering components, utilities, API clients, and live streaming
- **Go Backend Tests**: Integration tests for API endpoints and data handling
- **E2E Tests**: Playwright tests for critical user workflows
- **Code Quality**: ESLint, TypeScript strict mode, and Go best practices

### CI/CD Testing

All tests run automatically on:
- Pull requests
- Pushes to main branch
- Manual workflow dispatch

See `dev/testing/strategy.md` for detailed testing strategy and coverage goals.

## Local Docker Setup

This repository includes a ready-to-run Docker Compose setup that works on both Intel and Apple Silicon Macs.

### Quick Development Setup

1. **Prerequisites:**
   - Docker Desktop installed and running
   - Node.js 22+ and npm 11.5+ (for local development)

2. **One-time setup:**
   ```bash
   # Install dependencies
   npm install --prefix app
   npm install --prefix datasource

   # Build plugins (required for Docker mounting)
   npm run build --prefix app
   npm run build --prefix datasource
   ```

3. **Start development environment:**
   ```bash
   # Start Grafana with plugins
   docker compose up --build
   ```

4. **Enable hot reloading** (optional, in separate terminals):
   ```bash
   # App plugin hot reload
   npm run dev --prefix app

   # Datasource plugin hot reload
   npm run dev --prefix datasource
   ```

### Automated Development Setup

For a streamlined experience, use the provided automation scripts:

```bash
# Automated setup (builds plugins, starts Grafana, verifies setup)
./localdev-up.sh

# Clean shutdown
./localdev-down.sh

# Clean shutdown with Docker resource cleanup
./localdev-down.sh --clean

# Full cleanup including build artifacts
./localdev-down.sh --clean --clean-build --full
```

This script will:
- Check prerequisites (Node.js, npm, Docker)
- Install plugin dependencies
- Build both plugins
- Start Grafana with Docker Compose
- Wait for Grafana to be ready
- Verify plugin loading
- Display access information and next steps

### Apple Silicon Notes

- The Docker Compose configuration automatically detects and uses the correct platform
- Multi-arch images are pulled automatically
- No additional configuration needed for M1/M2 Macs
- If you encounter issues, ensure Docker Desktop is updated to the latest version

### Development Container Features

The development container includes:
- Grafana 12.2.0 with plugin support
- Anonymous admin access (`admin`/`admin`)
- Unsigned plugin loading enabled
- Hot reload support when using `npm run dev`
- Persistent storage for Grafana data
- **Host gateway access** via `host.docker.internal` for connecting to services running on the host machine

### Troubleshooting

```bash
# View container logs
docker compose logs -f

# Restart Grafana
docker compose restart

# Clean rebuild
docker compose down
docker compose up --build --force-recreate

# Check plugin loading
docker compose exec grafana grafana-cli plugins ls

# Quick environment management
./localdev-up.sh    # Start environment
./localdev-down.sh  # Stop environment
./localdev-down.sh --clean  # Stop and clean resources
```

## Production Deployment

To deploy this plugin in a production Grafana instance:

### 1. Build for Production

```bash
# Build the app plugin
cd app
npm install
npm run build

# Build the datasource plugin
cd ../datasource
npm install
npm run build
```

The production-ready plugins will be available in their respective `dist/` directories:
- `app/dist/` - Mirador Explorer app plugin
- `datasource/dist/` - Mirador Core Connector datasource plugin

### 2. Install in Grafana

1. Create the plugins directory in your Grafana instance if it doesn't exist:
   ```bash
   mkdir -p /var/lib/grafana/plugins
   ```

2. Copy both plugin directories to your Grafana plugins directory:
   ```bash
   cp -r app/dist /var/lib/grafana/plugins/platformbuilds-miradorstack-app
   cp -r datasource/dist /var/lib/grafana/plugins/platformbuilds-miradorstack-datasource
   ```

3. Update your Grafana configuration (`grafana.ini` or environment variables) to allow the plugin:
   ```ini
   [plugins]
   allow_loading_unsigned_plugins = platformbuilds-miradorstack-app,platformbuilds-miradorstack-datasource
   ```

4. Restart Grafana:
   ```bash
   systemctl restart grafana-server  # For systemd-based systems
   ```

### 3. Plugin Configuration

1. Log into your Grafana instance as an admin
2. Go to **Configuration → Plugins**
3. Find and click on "Mirador Core Connector"
4. Add a new datasource instance with your Mirador Core API settings
5. Go to **Configuration → Mirador Explorer**
6. Configure the app plugin with:
   - Mirador Core API URL
   - API key
   - The UID of your configured Mirador Core Connector datasource

### 4. Verify Installation

1. Check **Plugins → Apps** to ensure Mirador Explorer is listed and enabled
2. Verify the datasource connection test is successful
3. Navigate to the Discover page through the app's navigation
4. Test a basic log query to confirm end-to-end functionality

### Security Considerations

- Always use HTTPS for the Mirador Core API connection
- Store API keys securely using Grafana's built-in secrets management
- Review and set appropriate user permissions for the app and datasource access
- Consider using Grafana's role-based access control (RBAC) to manage plugin access
