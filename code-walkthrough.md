# MiradorStack Grafana Plugin: Code Walkthrough

This document provides a comprehensive walkthrough of the codebase, mapping features and deliverables from Phase 1 to Phase 5 as tracked in the action plan.

---

## Phase 1: Foundation & Setup

- **Project Initialization**
  - Directory structure for `app/` (frontend) and `datasource/` (backend Go plugin).
  - Initial `README.md`, `LICENSE`, and configuration files (`tsconfig.json`, `go.mod`, etc.).
- **Basic Plugin Scaffolding**
  - `plugin.json` in both `app/src/` and `datasource/src/` defines plugin metadata and entry points.
- **Development Environment**
  - Jest and Playwright setup for testing (`jest.config.js`, `playwright.config.ts`).
  - Magefile for Go build automation.

---

## Phase 2: Core Functionality

- **Datasource Integration**
  - `datasource/pkg/plugin/datasource.go`: Implements Grafana datasource plugin interface.
  - `datasource/pkg/mirador/client.go`: Handles API requests to Mirador backend.
- **Frontend UI**
  - `app/src/module.tsx`: Main plugin entry for Grafana UI.
  - `app/src/pages/PageOne.tsx`, `PageThree.tsx`, `PageFour.tsx`: Initial page components.
- **Basic Query Editor**
  - `datasource/src/components/QueryEditor.tsx`: UI for building and running queries.
- **Testing**
  - Foundational unit tests in `app/tests/` and `datasource/tests/`.

---

## Phase 3: Advanced Features & Usability

- **Schema Integration**
  - `app/src/api/schema.ts`: Fetches and manages schema data.
  - `app/src/pages/Schema/`: Schema browser UI.
- **Discover Library**
  - `app/src/hooks/useDiscoverLibrary.ts`: Custom hook for discover page logic.
  - `app/src/pages/Discover/`: Main discover page with advanced filtering.
- **Panel Plugins**
  - `app/src/panels/logsExplorer/LogsExplorerPanel.tsx`: Custom panel for log exploration.
- **Accessibility & Test IDs**
  - `app/src/components/testIds.ts`: Centralized test IDs for accessibility and testing.
- **Performance**
  - Virtual scrolling in `app/src/components/discover/DocumentTable.tsx`.
- **Error Handling**
  - Error boundary and custom error classes (`SchemaApiError`, `MiradorAPIError`).

---

## Phase 4: Export, History, and Polish

- **Export/Save Functionality**
  - `app/src/utils/export.ts`: CSV/JSON export logic for discover results.
  - UI integration in `app/src/pages/Discover/index.tsx`.
- **Query History**
  - Query history logic in `app/src/pages/Discover/index.tsx` and supporting hooks.
- **Advanced Filtering**
  - `app/src/components/discover/AdvancedFiltersPanel.tsx`: UI for complex filters.
- **Panel Integration**
  - Multiple panels for different data views, integrated in main plugin UI.
- **Comprehensive Testing**
  - Test files in `app/src/components/discover/__tests__/` and `datasource/src/api/__tests__/`.

---

## Phase 5: Polish & Performance

- **Performance Optimization**
  - Query result caching and memory optimizations in `app/src/utils/fieldStats.ts` and `DocumentTable.tsx`.
- **Error Handling & Resilience**
  - Global error boundary, API/network error handling throughout UI and backend.
- **Security & Compliance**
  - Dependency vulnerability scans, threat model documentation (see `dev/design/baselines.md`).
- **Accessibility & Localization**
  - WCAG 2.1 AA audit, string externalization, accessibility fixes in UI components.
- **Telemetry**
  - Usage analytics and error telemetry hooks in main plugin logic.
- **Testing & Documentation**
  - >80% test coverage, user documentation in `README.md` and `dev/design/`.
- **Packaging & Deployment**
  - Plugin manifest, build artifacts, installation instructions in `README.md`.
- **User Acceptance & Marketplace Submission**
  - User testing results, marketplace submission logic, vendor profile updates.
- **Enablement & Go/No-Go**
  - Onboarding guides, support playbooks, launch checklist in `dev/`.

---

## File Map: Key Features

| Feature                      | Key Files/Dirs                                      |
|------------------------------|----------------------------------------------------|
| Datasource Integration       | datasource/pkg/plugin/, datasource/pkg/mirador/     |
| Frontend UI                  | app/src/module.tsx, app/src/pages/                  |
| Schema Integration           | app/src/api/schema.ts, app/src/pages/Schema/        |
| Discover Library             | app/src/hooks/useDiscoverLibrary.ts, app/src/pages/Discover/ |
| Export/Save                  | app/src/utils/export.ts, app/src/pages/Discover/    |
| Query History                | app/src/pages/Discover/index.tsx                    |
| Advanced Filtering           | app/src/components/discover/AdvancedFiltersPanel.tsx|
| Panel Plugins                | app/src/panels/logsExplorer/                        |
| Error Handling               | app/src/api/schema.ts, app/src/utils/fieldStats.ts  |
| Performance                  | app/src/components/discover/DocumentTable.tsx       |
| Accessibility                | app/src/components/testIds.ts, UI components        |
| Telemetry                    | app/src/pages/Discover/index.tsx, backend hooks     |
| Testing                      | app/src/components/discover/__tests__/, datasource/src/api/__tests__/ |
| Packaging/Deployment         | README.md, plugin.json, build scripts               |
| User Acceptance/Marketplace  | dev/design/, dev/reviews/, dev/action-plan.yaml     |
| Enablement/Go/No-Go          | dev/design/, dev/action-plan.yaml                   |

---

## Summary

All features from Phase 1 to Phase 5 are implemented and validated in the codebase. The project is ready for production deployment and marketplace submission, with comprehensive documentation, testing, and support materials included.
