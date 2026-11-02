# Overnight progress

## Round 4 — done

- **Demo sample:** `ensureDemoMonthActivity` — early month (e.g. 2026-11-02) gets rent, groceries, transit, lunch; `recurring[]` seeds rent + subscription; donut/heatmap/Today card align with summary (seed 42 verified in screenshots).
- **Ledger core:** `updateTransaction`, `applyRecurringTemplate`, exported `parseAmountToken`.
- **Ledger UI:** edit popover (opaque, fixed, buttons not in nested label traps), recurring “记一笔/Post now”, swipe-left delete on touch rows, ✎ edit on each row.
- **Goal 2:** Today `.tw-card` enter stagger; richer `.ledger-empty`; review `.rv-bar` width transition; Today month spend display uses `Math.abs(expenseMinor)`.
- **Tests:** +3 (256 total): demo month padding, updateTransaction, applyRecurringTemplate.
- **Screenshots:** re-captured `.overnight/shots/ledger-chromium-light-1440.png`, `today-spending-zh-390.png`, etc. (server 5291).

## Half-done

- Treemap category view, full recurring editor (create/edit cadence), Mac shell screenshot pass.
- Broader Goal 2: skeleton loaders, habit/mood correlation charts beyond review bar, page transitions on week/timeline.

## Next round priorities

1. Mac-window headless shot via `ll-mac-qa/habitpick-silent.mjs` pattern.
2. Optional treemap toggle on ledger categories panel.
3. Seed demo journal moods on spend days so mood-vs-spend panel appears in review screenshots.
4. Skeleton placeholders for ledger uPlot / donut while render mounts.

## Known bugs / gaps

- Mobile floating nav dock still overlaps ledger keypad area (pre-existing shell).
- `mergeRemoteCloudPayload` conflict adopt edge case (local ledger) — unchanged, low risk.
- Today card “today” total includes all expenses on selected planning date (can be large if rent posted same day — expected for demo).

## npm test

```
256 pass, 0 fail (round 4)
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
