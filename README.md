# Miradorstack Grafana Plugin Suite

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
