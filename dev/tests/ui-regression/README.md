# Discover UI Regression Harness

This folder tracks the visual regression flow introduced in Phase 3.

## Tooling
- **Storybook** renders Discover surfaces for screenshot capture (`npm run storybook --prefix app`).
- **Chromatic** stores approved baselines. Use the team token from 1Password (`CHROMATIC_PROJECT_TOKEN`).
- **Playwright** captures fallback PNG diffs for local review (`npm run test:visual --prefix app`).

## Workflow
1. Build story snapshots: `npm run storybook --prefix app` (runs on port 6006).
2. Record visuals locally: `npm run test:visual --prefix app` (custom script wraps `npx playwright test dev/tests/ui-regression/visual.spec.ts`).
3. Upload to Chromatic: `npx chromatic --project-token $CHROMATIC_PROJECT_TOKEN --storybook-build-dir app/storybook-static`.
4. Commit updated baselines under this directory (PNG + JSON metadata) when reviewers approve diffs.

## States Covered
- Discover shell empty state
- Discover with `service:payments` filters
- Field stats overlay with sample distribution
- Histogram zoom interactions

The Playwright spec (`visual.spec.ts`) is deterministic against bundled mock data; update mocks before regenerating baselines.
