# Overnight progress

## Round 6 — done

- **Recurring templates:** `upsertRecurringTemplate` / `removeRecurringTemplate` / `restoreRecurringTemplate` + normalize sanitization in `ledger-core.js`. Money page **Add recurring** + edit/delete (undo toast), opaque body popover (fields not wrapped in `<label>` with inner buttons).
- **Review habits:** `habitMonthSparkSvg` daily strip column in habit table; weekday bars get staggered grow-in (`rv-weekdays--enter`).
- **Page motion:** Week `.module-card` and Timeline feed/layout enter stagger in `v211-polish.css` (respects `html.motion-reduced`).
- **Tests:** +1 recurring CRUD test → **258 pass**.
- **Screenshots:** `ledger-recurring-popover-light-1440.png`, `timeline-enter-light-1440.png`, full capture refresh (5291).

## Half-done

- Income-side recurring (salary templates) — UI only lists expense categories today.
- fakecloud ledger smoke on 5298 — not run this round.
- Broader Goal 2: global skeleton pattern on week/timeline loads, treemap tile labels.

## Next round priorities

1. Recurring: income category option + optional weekly cadence (if justified in design note).
2. fakecloud local stand-in smoke for `state.ledger` sync path.
3. Mobile keypad vs bottom nav overlap mitigation (padding/safe-area on `#ledgerView`).
4. More review correlations (focus vs spend) or habit streak headline polish.

## Known bugs / gaps

- Mobile floating nav dock still overlaps ledger keypad area (pre-existing shell).
- `mergeRemoteCloudPayload` conflict adopt edge case (local ledger) — unchanged, low risk.
- Treemap illustrative only (hover title, no in-tile labels).

## npm test

```
258 pass, 0 fail (round 6)
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
