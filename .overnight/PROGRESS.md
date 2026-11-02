# Overnight progress

## Round 3 — done

- **ledger-core:** `duplicateTransaction`, `moodSpendComparison` (testable mood vs spend averages); tests +2 (253 total).
- **ledger-ui:** touch amount keypad (coarse / ≤640px), duplicate action on rows, month summary `rollText`, quick-entry field no longer inside `<label>`.
- **Goal 2 (start):** `public/v211-polish.css` — ledger page enter stagger, extra bottom safe-area, spending card press feedback, review ledger panel motion; Today spending amount roll-up.
- **Review:** mood-vs-spend line uses `moodSpendComparison` instead of inline logic.
- **Screenshots:** demo-seeded captures via `?lang=` — `.overnight/shots/ledger-chromium-light-1440.png`, `ledger-webkit-dark-de-390.png`, `today-spending-zh-390.png`, `review-ledger-light-1440.png`.
- **CHANGELOG** `[Unreleased]` notes for above.

## Half-done

- Demo sample still skews November toward income (expenses mostly in prior months in heatmap/trend) — charts vs summary mismatch in screenshots.
- Recurring templates, treemap view, swipe-delete on mobile, broader Goal 2 (habits/mood charts, skeletons, page transitions elsewhere).
- Mac shell screenshot pass not re-run this round.

## Next round priorities

1. Enrich `buildDemoSample` so current month has visible expenses (donut + Today card non-zero).
2. Goal 2 sweep: empty states, habit review micro-charts, `is-entering` coverage on Today cards.
3. Ledger: edit transaction inline, recurring entry stubs in UI.
4. Optional Mac-window shot via `ll-mac-qa/habitpick-silent.mjs` pattern.

## Known bugs / gaps

- Mobile floating nav dock still overlaps ledger keypad area (pre-existing shell).
- `mergeRemoteCloudPayload` conflict adopt edge case (local ledger) — unchanged, low risk.
- Mood correlation only appears when both 很好 and 低落 days have spend in the month.

## npm test

```
253 pass, 0 fail (round 3)
```

## Gate result

_pending (driver appends after commit)_

## Driver gate after round 1
ℹ tests 248 ℹ pass 248 ℹ fail 0 

## Driver gate after round 2
ℹ tests 251 ℹ pass 251 ℹ fail 0 

## Driver gate after round 3
ℹ tests 253 ℹ pass 253 ℹ fail 0 
