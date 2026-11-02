# Overnight progress (Round 1)

## Done this round

- Research note: `.overnight/LEDGER-DESIGN.md` (data model, OSS references, screen plan).
- Core module `public/ledger-core.js`: normalize/empty ledger, quick entry (`12,50 咖啡`, `-45 Miete gestern`), month totals, category breakdown, daily heatmap data, German `;` CSV import, CSV export, undo-friendly remove/restore.
- UI `public/ledger-ui.js` + `public/v210.css`: sidebar nav, ledger view (summary, quick entry, chips, donut, heatmap, transaction list, delete + undo toast).
- State wiring: backup import includes `ledger`; cloud `mergeRemoteCloudPayload` keeps local ledger when remote has none; SW shell lists new assets.
- Tests: `tests/ledger-core.test.mjs` (8 cases).
- Headless screenshots: `.overnight/shots/ledger-chromium-light-1440.png`, `.overnight/shots/ledger-webkit-dark-de-390.png`.

## Half-done

- Version still **2.0.10 / Mac 3.0.4** (2.1.0 / 3.1.0 bump deferred until Today card + README + polish land).
- Today「今日支出」card, month review spending block, demo sample transactions, budgets, recurring, uPlot trend, touch keypad, CSV UI, search/filter.
- Goal 2 global polish not started (only ledger page styling).

## Next round priorities

1. Bump release metadata to web **2.1.0** / Mac **3.1.0** with README EN/ZH/DE.
2. Today card + review integration; demo workspace sample ledger.
3. CSV import/export buttons on ledger page; budget progress rows.
4. uPlot spending trend; more headless shots (zh, light 390).
5. Begin cross-insights (mood vs spend) on review page.

## Known bugs / gaps

- Mobile bottom nav can overlap ledger content on narrow widths (pre-existing shell).
- Playwright lang switch in capture script may use wrong localStorage key — de screenshot still mostly English.
- `mergeRemoteCloudPayload` on conflict adopt path (3136) does not yet pass `localLedger` (edge case).

## npm test

```
248 pass, 0 fail (after round 1 changes)
```

## Gate result

_pending (driver appends after commit)_

## Driver gate after round 1
ℹ tests 248 ℹ pass 248 ℹ fail 0 
