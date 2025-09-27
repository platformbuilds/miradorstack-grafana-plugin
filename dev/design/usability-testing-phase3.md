# Phase 3 Guided Usability Sessions

_Date: 2025-02-18_
_Moderator: aarvee11_

We conducted five remote sessions with internal SREs (15–20 minutes each) focusing on the Discover MVP.

## Participant Summary
- **P1 (Morgan)** – Senior SRE monitoring Mirador logs daily.
- **P2 (Jamie)** – Lead developer responsible for triaging incidents.
- **P3 (Taylor)** – Frontend engineer building dashboards.
- **P4 (Riley)** – QA engineer validating release smoke suites.
- **P5 (Samir)** – DevOps engineer deploying Grafana instances.

## Task Coverage
1. Locate error logs for the `payments` service within last 30 minutes.
2. Pin the `tenant` field and identify the top values.
3. Save a filter group for `service:payments` and `level:ERROR`.
4. Narrow results to a specific error code using the histogram and advanced filters.

## Observations & Quotes
- P1: “Field stats overlay is helpful, but tooltips for the icons would reduce trial-and-error.”
- P2: “Saving filter groups without feedback left me unsure it worked.”
- P3: “Histogram click targets feel small when using a trackpad.”
- P4: “Run Query button pegs at loading but I couldn’t tell if the system was stuck.”
- P5: “Advanced filters drawer covering the screen made it harder to compare results.”

## Metrics
- **Task Success:** 5/5 users completed all tasks.
- **Avg. Completion Time:** 6m 40s per session.
- **SUS Score (self-reported):** 78/100.

## Key Issues Logged
- Lack of confirmation when saving filter groups (UX-32).
- Histogram accessibility gaps (UX-37).
- Drawer exit flow (UX-34).

## Next Steps
- Address medium-severity usability issues in Phase 4 backlog.
- Plan follow-up validation once schema browsing ships (target Phase 4 review).
