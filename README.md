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

Install dependencies for both packages:

```bash
npm install --prefix app
npm install --prefix datasource
```

Build the plugins once to generate initial `dist/` bundles:

```bash
npm run build --prefix app
npm run build --prefix datasource
```

Run the development watchers in separate shells:

```bash
npm run dev --prefix app
npm run dev --prefix datasource
```

Start Grafana with both plugins mounted from the repository root:

```bash
docker compose up --build
```

Grafana will be available at `http://localhost:3000` with anonymous admin access for development convenience.

Within Grafana, open **Configuration → Mirador Explorer** and supply the Mirador Core API URL, API key, and the UID of your Mirador Core Connector datasource. The Schema Browser relies on these settings to call the backend schema resources.

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

- Lint & type-check: `npm run lint --prefix <package>` / `npm run typecheck --prefix <package>`
- Unit tests: `npm run test:ci --prefix <package>`
- Playwright E2E scaffolding is available via `npm run e2e` (Chromium profile).
- Backend Go tests: `go test ./...` from `datasource/`
- Combined smoke suite (datasource): `dev/tests/smoke.sh`

See `dev/testing/strategy.md` for the evolving quality plan and `dev/design/baselines.md` for UX foundations.

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
