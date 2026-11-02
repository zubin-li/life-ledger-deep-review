# CSS layering (v210–v225)

Overnight Goal 2 work landed in **small, last-loaded stylesheets** instead of one megabyte `v210.css` merge:

| File | Role |
|------|------|
| `v210.css` | Ledger page base, keypad, treemap labels |
| `v211-polish.css` | Cross-page motion, spending card press, ledger enter |
| `v212-skeleton.css` | Skeleton placeholders |
| `v213-onboarding.css` | First-run / ledger onboarding |
| `v214-goals-journal.css` | Empty states, goal form hint |
| `v215`–`v222` | Review scatter, mobile, jump-spy (incremental review UX) |
| `v223-ledger-budget-ui.css` | Budget progress + popover (opaque stack) |
| `v224-today-journal-hero.css` | Today hero daypart, journal composer + feed |
| `v225-roll-habit-ledger.css` | Metric roll hosts, habit press, ledger donut reveal |

**Why not one file:** easier round-by-round diffs, parallel overnight batches, and PWA cache bust per feature slice. `index.html` + `sw.js` list order = cascade order (always append new files **last**).

**Duplicate `v217`:** intentional split — habit scatter vs conflict-ledger preview — to avoid merge conflicts during batch 2.

Before a stable release, maintainers *may* concatenate into `v210.css` once; behaviour must stay identical.
