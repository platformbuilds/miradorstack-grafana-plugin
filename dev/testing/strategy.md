# Testing Strategy – Mirador Explorer Plugin Suite

_Last updated: 2025-09-26 15:49 IST_

## 1. Testing Goals
- Guarantee core log/metrics/traces flows stay functional during rapid iteration.
- Provide fast feedback (≤60s) for PR checks covering lint, unit, and type validation.
- Catch API contract regressions against Mirador Core staging endpoints nightly.

## 2. Test Pyramid
| Layer              | Scope                                                     | Tooling                                 | Target cadence |
|--------------------|-----------------------------------------------------------|------------------------------------------|----------------|
| Static analysis     | ESLint, Prettier, TypeScript type-check                  | `npm run lint`, `npm run typecheck`      | per commit     |
| Unit tests          | React components, query builders, utilities              | Jest + Testing Library                   | per commit     |
| Integration/Contract| Datasource <-> Mirador API (recorded fixtures)           | Jest + MSW + supertest (future)          | nightly        |
| E2E                 | Grafana app navigation + data source config + discover   | Playwright (Chromium)                    | nightly / pre-release |

## 3. Tooling Setup
- Workspaces: run tests per package (`app`, `datasource`) via existing NPM scripts.
- Jest config scaffolding provided by `@grafana/create-plugin`; extend with shared test utils under `packages/test-utils` (to be added in Phase 2).
- Playwright config pinned to Chromium; CI pipeline will reuse Grafana-provided GitHub Actions.
- Mock Service Worker (MSW) will emulate Mirador Core endpoints for deterministic front-end tests.

## 4. Continuous Integration
- GitHub Actions (from scaffolding) lint + unit test on push/PR.
- Add workflow matrix (Phase 2) to run datasource + app test suites in parallel.
- Nightly scheduled workflow to execute contract + e2e tests against staging Mirador Core gateway (requires secrets: `MIRADOR_BASE_URL`, `MIRADOR_TOKEN`).

## 5. Coverage Targets
- Unit tests ≥80% statements/function coverage for datasource utilities and Discover UI.
- Contract/e2e tests to confirm top 5 workflows: configure datasource, run log query, load histogram, apply filter, export results.

## 6. Immediate Actions
1. Add shared test utils package and wiring (Phase 2).
2. Record Mirador API fixtures via staging environment (Phase 2).
3. Configure GitHub secrets for nightly jobs once connectivity confirmed.
