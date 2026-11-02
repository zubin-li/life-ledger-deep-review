# Overnight progress

## Round 8 — done

- **Treemap i18n:** `truncateTreemapLabel` / `treemapLabelMaxChars` in `ledger-core.js`; labels scale with cell size and locale (DE shorter density); stroke/contrast tweak in `v211-polish.css`.
- **Review correlation:** `habitCompletionSpendInsight` + third line on monthly Money panel (needs ≥4 days with spend + completion variance; demo month still often only 2 logged days).
- **Skeleton polish:** `LifeLedgerInteraction.paintWithSkeleton` + `skeletonMarkup`; `v212-skeleton.css`; journal **日度** feed shows skeleton while photos load; review heatmap/habit panels shimmer one frame on repaint; week insight `<strong>` pulse while stats recalc.
- **PWA cache:** `v212-skeleton.css` in `sw.js` APP_SHELL.
- **Tests:** +2 treemap truncate + habit completion insight → **265 pass**.
- **Screenshots:** `ledger-treemap-de-light-1440.png`, `week-insights-light-1440.png`, capture refresh (5291).

## Half-done

- fakecloud Pages dev smoke — still no `functions/` in overnight clone.
- Habit×支出复盘文案在演示数据下常不出现（当月记录天数不足 4 天）。

## Next round priorities

1. Pad demo logs across more November days so habit×spend insight visible in review screenshots.
2. Timeline calendar mode skeleton while photo month loads (same pattern as feed).
3. Optional: treemap label luminance class for pale accent tiles.

## Known bugs / gaps

- Mobile floating nav dock may still partially overlap keypad on very short viewports.
- `mergeRemoteCloudPayload` conflict adopt edge case (local ledger) — unchanged.
- fakecloud script expects repo-root `functions/` + `schema.sql` (missing here).

## npm test

```
265 pass, 0 fail (round 8)
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

## Driver gate after round 8
_pending_

## Driver gate after round 8
ℹ tests 265 ℹ pass 265 ℹ fail 0 
