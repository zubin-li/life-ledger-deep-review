# Overnight progress

## Round 6 — done

- **Recurring templates:** `upsertRecurringTemplate` / `removeRecurringTemplate` / `restoreRecurringTemplate` + normalize sanitization in `ledger-core.js`. Money page **Add recurring** + edit/delete (undo toast), opaque body popover (fields not wrapped in `<label>` with inner buttons).
- **Review habits:** `habitMonthSparkSvg` daily strip column in habit table; weekday bars get staggered grow-in (`rv-weekdays--enter`).
- **Page motion:** Week `.module-card` and Timeline feed/layout enter stagger in `v211-polish.css` (respects `html.motion-reduced`).
- **Tests:** +1 recurring CRUD test → **258 pass**.
- **Screenshots:** `ledger-recurring-popover-light-1440.png`, `timeline-enter-light-1440.png`, full capture refresh (5291).

## Round 7 — done

- **Recurring income + weekly cadence:** popover optgroups (expense/income), cadence monthly|weekly with weekday field; core `normalizeRecurringEntry` / `applyRecurringTemplate` / `nearestWeekdayIso`.
- **Review:** `focusSpendInsight` + second line on monthly Money panel (high- vs low-focus day spend); demo capture seeds sample `focusSessions`.
- **Ledger polish:** treemap in-tile labels (large cells), mobile `#ledgerView` bottom padding for keypad + nav, best-streak headline gradient on review insights.
- **Cloud merge tests:** `tests/ledger-cloud-merge.test.mjs` exercises `mergeRemoteCloudPayload` local-ledger retention (functions/ not in this clone — full fakecloud wrangler skipped).
- **Tests:** +5 → **263 pass**.
- **Screenshots:** `ledger-recurring-weekly-light-1440.png`, `ledger-mobile-keypad-light-390.png`, `review-focus-spend-light-1440.png`, capture refresh.

## Half-done

- fakecloud Pages dev smoke — blocked: no `functions/` or `schema.sql` in overnight clone; merge path covered by unit test.
- Broader Goal 2: global skeleton on week/timeline loads.

## Next round priorities

1. If functions tree available elsewhere, run `.overnight/fakecloud.sh` end-to-end PUT/GET with ledger payload.
2. Habit/review skeleton placeholders on slow renders.
3. Treemap label truncation i18n / contrast pass on small tiles.

## Known bugs / gaps

- Mobile floating nav dock may still partially overlap keypad on very short viewports (padding mitigated, not eliminated).
- `mergeRemoteCloudPayload` conflict adopt edge case (local ledger) — unchanged, low risk.
- fakecloud script expects repo-root `functions/` + `schema.sql` (missing here).

## npm test

```
263 pass, 0 fail (round 7)
```

## Gate result

_pending (driver appends after commit)_

## Driver gate after round 1
ℹ tests 248 ℹ pass 248 ℹ fail 0 

## Driver gate after round 2
ℹ tests 251 ℹ pass 251 ℹ fail 0 

## Driver gate after round 3
ℹ tests 253 ℹ pass 253 ℹ fail 0 

## Driver gate after round 4
ℹ tests 256 ℹ pass 256 ℹ fail 0 

## Driver gate after round 5
ℹ tests 257 ℹ pass 257 ℹ fail 0 

## Driver gate after round 6
ℹ tests 258 ℹ pass 258 ℹ fail 0 

## Driver gate after round 7
ℹ tests 263 ℹ pass 263 ℹ fail 0 
