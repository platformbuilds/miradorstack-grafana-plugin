# Discover UI Regression Plan

1. Storybook stories for the Discover shell, field sidebar, and document table live under `app/src/components/discover/stories/` (to be expanded in Phase 4).
2. CI will invoke Chromatic against these stories and persist baselines into `dev/tests/ui-regression/`.
3. Developers can trigger a local regression run via `npm run test:ci --prefix app -- --updateSnapshot` after starting Storybook with `npm run dev:storybook --prefix app` (command stub to be added in the next phase).
4. Any approved diffs must be exported into this directory and referenced from the pull request description for auditability.
