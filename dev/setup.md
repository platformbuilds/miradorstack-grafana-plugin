# Developer Environment Setup

This repository already contains the scaffolded Mirador Explorer app plugin (`app/`) and Mirador Core Connector data source (`datasource/`). The steps below describe how to configure a local workstation.

## 1. Install prerequisites
- Node.js 22+
- npm 10+
- Docker Desktop (or compatible engine)

## 2. Install dependencies
```bash
npm install --prefix app
npm install --prefix datasource
```

## 3. Build the plugins once
```bash
npm run build --prefix app
npm run build --prefix datasource
```

## 4. Start frontend watchers
Run each command in its own terminal.
```bash
npm run dev --prefix app
npm run dev --prefix datasource
```

The watchers emit their bundles into `app/dist` and `datasource/dist`, which are mounted by Grafana.

## 5. Launch Grafana
From the repository root:
```bash
docker compose up --build
```

Grafana starts at [http://localhost:3000](http://localhost:3000) with anonymous admin access. The app plugin appears under **Apps → Mirador Explorer** and the data source under **Configuration → Data sources**.

## 6. Useful scripts
| Command | Location | Description |
|---------|----------|-------------|
| `npm run test:ci` | `app/`, `datasource/` | Run Jest unit suites |
| `npm run typecheck` | `app/`, `datasource/` | Static type analysis |
| `npm run lint` | `app/`, `datasource/` | ESLint + Prettier |
| `npm run e2e` | `app/`, `datasource/` | Playwright Chromium tests |
| `go test ./...` | `datasource/` | Backend plugin unit tests |

## 7. Environment variables
Create `.env.development` in each package (optional) to override defaults. Relevant keys:
- `MIRADOR_BASE_URL`
- `MIRADOR_TENANT_ID`
- `MIRADOR_BEARER_TOKEN`

(Integration with these variables will be wired during Phase 2.)
