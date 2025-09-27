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

- Node.js 22+
- npm 10+
- Docker (for local Grafana dev server)

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
