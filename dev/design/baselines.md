# Mirador Explorer – UX & Accessibility Baselines

_Last updated: $(date '+%Y-%m-%d %H:%M %Z')_

## 1. Scope & Personas
- **Primary persona**: SRE / Observability engineer triaging incidents under time pressure.
- **Secondary persona**: Data analyst exploring log patterns and field statistics for optimization.

## 2. Core Flows (Wireframe Notes)

### 2.1 Data Source Configuration
```
┌──────────────────────────────────────────────────────────────┐
│ Mirador Core Connector                                       │
├──────────────────────────────────────────────────────────────┤
│ URL: [ https://mirador.example.com          ]                │
│ Tenant ID: [ tenant-123                ] (optional)          │
│ Enable WebSocket: [•]                                        │
│ Bearer Token: [ ••••••••••••••••••••••••••••••••••••••• ]     │
│ ------------------------------------------------------------ │
│ [ Test Connection ]  [ Save & Apply ]                        │
└──────────────────────────────────────────────────────────────┘
```
- Validation feedback inline, with live status banner for test connection.
- Helper text explains credential scope and retention.

### 2.2 Discover Log Explorer (App Page)
```
┌───────────────────────────────────────────────────────────────────────────┐
│ Header: Time range selector | Query bar [service:"payments" AND level:ERR]│
│ Breadcrumbs: Mirador Explorer / Discover                                  │
├───────────────────────────────────────────────────────────────────────────┤
│ Sidebar (25%)                     │ Main Canvas (75%)                     │
│ ┌───────────────┐                 │ ┌───────────────────────────────────┐ │
│ │ Fields        │                 │ │ Histogram (15% height)           │ │
│ │ • service ◀▶  │                 │ └───────────────────────────────────┘ │
│ │ • level       │                 │ ┌───────────────────────────────────┐ │
│ │ • duration    │                 │ │ Log table w/ virtual rows        │ │
│ │ ...           │                 │ │ Row expanders + field badges     │ │
│ └───────────────┘                 │ └───────────────────────────────────┘ │
│ Filters stack w/ pills below list │ Footer: pagination, auto-refresh    │
└───────────────────────────────────────────────────────────────────────────┘
```
- Field list includes inline stats preview (sparkline, top values).
- Histogram supports brushing to update time window.
- Log table columns adapt to selected fields; raw JSON view available per row.

### 2.3 Quick RCA Overlay
```
┌─────────────────────────────┐
│ AI Insights                 │
├─────────────────────────────┤
│ • Probable cause: Payment   │
│   gateway timeout           │
│ • Related alerts (3)        │
│ • Suggested actions         │
│   - restart gateway pod     │
│   - clear backlog queue     │
└─────────────────────────────┘
```
- Non-blocking panel sliding from right, focusable via keyboard.

## 3. Information Architecture Decisions
- Left-hand navigation: Discover, Field Stats, AI Insights, Schema Explorer.
- Context bar surfaces active data source + tenant, with quick switcher.
- Persisted filters displayed above results with include/exclude toggles.

## 4. Accessibility Foundations
- **Color palette (meets WCAG AA, contrast ≥ 4.5:1)**
  - Primary background: `#0B1B33`
  - Card background: `#132B4A`
  - Primary accent: `#3D8BFF`
  - Success accent: `#58D68D`
  - Warning accent: `#F5B041`
  - Critical accent: `#E74C3C`
  - Text on dark: `#F7FAFC`
  - Muted text: `#A0AEC0`
- Keyboard focus states: 2px outline using `#3D8BFF` on dark surfaces.
- Hit areas ≥ 32px, filter pills support keyboard removal via `Delete`/`Backspace`.
- All live regions (`Test Connection`, streaming status) announced via ARIA `role="status"`.

## 5. Open Questions
- Do we support multiple Mirador environments per org? impacts tenant switcher.
- Should histogram default to log count or configurable metric density?
- Validate color palette with Mirador brand before locking.

## 6. Next Actions
1. Create high-fidelity Figma references based on these frames.
2. Partner with backend to confirm WebSocket connection states exposed via API.
3. Schedule accessibility review once core Discover flow is interactive.
