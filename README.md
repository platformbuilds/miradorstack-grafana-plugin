# Miradorstack Grafana Plugin Suite

Mirador Explorer is a Grafana app plugin bundled with a dedicated Mirador Core data source. The app delivers Kibana-style log discovery workflows (field stats, AI insights, schema browsing) while the data source handles authenticated access to Mirador Core APIs.

## Repository Layout

- `app/` – Mirador Explorer app plugin (custom pages, navigation, UX shell)
- `datasource/` – Mirador Core Connector data source plugin
- `dev/` – Engineering docs (action plan, design baselines, testing strategy)
- `architecture-plan.md` – High-level technical blueprint

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

## Testing

- Lint & type-check: `npm run lint --prefix <package>` / `npm run typecheck --prefix <package>`
- Unit tests: `npm run test:ci --prefix <package>`
- Playwright E2E scaffolding is available via `npm run e2e` (Chromium profile).
- Backend Go tests: `go test ./...` from `datasource/`

See `dev/testing/strategy.md` for the evolving quality plan and `dev/design/baselines.md` for UX foundations.
