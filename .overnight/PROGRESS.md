# Overnight progress

## Round 9 — done

- **Demo review depth:** `demoSeedAnchor()` (≥18th of month) for `buildDemoWorkspace` / ledger sample; **`alignDemoHabitCompletionWithSpend`**; **`effectiveDemoTodayIso()`** extends `reviewMonthDates` / analytics only while demo active (real users unchanged). `DEMO_PERSONA_VERSION` → 11.
- **Timeline calendar:** month photo load shows **`ll-skeleton--calendar`** on `.timeline-calendar-card`; `renderTimeline` loads photos before painting grid (fixes missing photo markers); `loadCalendarPhotoMonth` refreshes journal calendar when active.
- **Treemap:** `isLightAccentColor` / `relativeLuminance` in `ledger-core.js`; pale cells get `ledger-treemap-label--dim`.
- **Tests:** +3 ledger (luminance, align demo habits), +1 demoSeedAnchor → **268 pass**.
- **Screenshots:** refreshed batch on 5291; review now shows 18/18 days + mood/focus money lines (`.overnight/shots/review-ledger-light-1440.png`); new `timeline-calendar-light-1440.png`.

## Half-done

- fakecloud Pages dev smoke — still no `functions/` in overnight clone.
- Habit×支出第三行在截图描述里不稳定可见（DOM 有逻辑；若仍缺，再加大 spend 方差或 scroll capture）。

## Next round priorities

1. Polish Today / ledger empty states or onboarding hint (Goal 2).
2. Habit review sparkline animation (if not already on reduced-motion).
3. Optional: mobile keypad vs dock overlap tweak.

## Known bugs / gaps

- Mobile floating nav dock may still partially overlap keypad on very short viewports.
- `mergeRemoteCloudPayload` conflict adopt edge case (local ledger) — unchanged.
- fakecloud script expects repo-root `functions/` + `schema.sql` (missing here).

## npm test

```
268 pass, 0 fail (round 9)
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
ℹ tests 265 ℹ pass 265 ℹ fail 0 

## Driver gate after round 8
ℹ tests 265 ℹ pass 265 ℹ fail 0 

## Driver gate after round 9
ℹ tests 268 ℹ pass 268 ℹ fail 0 
