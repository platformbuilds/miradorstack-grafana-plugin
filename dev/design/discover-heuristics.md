# Discover Workflow Heuristic Review (Phase 3)

_Date: 2025-02-17_
_Reviewer: aarvee11_

We evaluated the Discover MVP against Nielsen’s ten usability heuristics plus Grafana’s design system guidance. Findings below include severity ratings (1 = low, 3 = high) and recommended follow-up work for Phase 4+.

## 1. Visibility of System Status
- **Finding (Severity 2):** Histogram loading state is subtle; when datasets are large the spinner in the Run Query button is the only indicator. 
  - **Action:** Add skeleton bars to `TimeHistogram` during refetch and emit toast on long-running (>2s) queries.
- **Finding (Severity 1):** Saved filter load/delete operations lack confirmation messaging.
  - **Action:** Introduce `AppEvents.success`/`error` notifications for saved group changes in Phase 4.

## 2. Match Between System and Real World
- **Finding (Severity 1):** “Pinned fields” terminology is clear but the order is non-deterministic on first load.
  - **Action:** Sort pinned fields alphabetically and persist ordering per user (Phase 4 backlog). 

## 3. User Control & Freedom
- **Finding (Severity 2):** Advanced Filters drawer blocks the main view when open; cancellation requires pressing the close button.
  - **Action:** Allow `Esc` key to always close the drawer and wire `Drawer`’s close icon (fixed in current build) plus re-focus the trigger button for accessibility. 

## 4. Consistency & Standards
- **Finding (Severity 1):** Field action buttons (Pin, Filter, Stats) rely on icon metaphors without labels.
  - **Action:** Add tooltips in Phase 4; short-term we use aria-labels and will supplement with tooltip microcopy. 

## 5. Error Prevention
- **Finding (Severity 2):** Range filters accept non-numeric strings, generating zero matches without feedback.
  - **Action:** Validate range values before submission and surface inline error state.

## 6. Recognition Rather Than Recall
- **Finding (Severity 1):** Saved filter groups list lacks contextual metadata (e.g., last updated, filter count).
  - **Action:** Include metadata chips and quick preview in next iteration.

## 7. Flexibility & Efficiency of Use
- **Finding (Severity 2):** Keyboard navigation is partially supported; quick filter buttons are tabbable but histogram buckets require pointer.
  - **Action:** Add `button` overlays to histogram bars to support keyboard selection; track in accessibility backlog.

## 8. Aesthetic & Minimalist Design
- **Finding (Severity 1):** Breadcrumb + header spacing compresses on smaller breakpoints.
  - **Action:** Add responsive gap adjustments (<960px) and allow header to wrap gracefully.

## 9. Help Users Recognize and Recover from Errors
- **Finding (Severity 2):** LocalStorage parse failures log to console but provide no user guidance.
  - **Action:** Show banner when saved filters cannot be loaded and offer reset option.

## 10. Help & Documentation
- **Finding (Severity 1):** No embedded help link for Mirador search syntax.
  - **Action:** Add doc link next to the query input tooltip.

## Summary
Overall Discover MVP is usable for internal users, but several medium-severity items remain. Follow-up stories are captured in `issues-phase3.md` and categorized for Phase 4 scheduling. Updated Figma frames were exported to the shared design workspace (`Mirador > Discover v0.3`) and circulated via Slack. No blocking heuristics remain for advancing to schema work.
