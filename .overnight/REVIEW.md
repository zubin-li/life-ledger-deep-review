# Antigravity review

status: completed

### Overnight Build Code Review (Base: `v2.0.10` → HEAD: `814b3a5`)

| # | HIGH/MED/LOW | file:line | problem | concrete fix |
|---|---|---|---|---|
| 1 | **LOW** | [public/v210.css:1-4207](file:///Users/ashan/Documents/Codex/ll-overnight/public/v210.css#L1-L4207) | **CSS redundancy across concatenated overnight slices.** Over 4,200 lines were consolidated across 10 rounds, leaving 20+ repeated `@media (prefers-reduced-motion)` blocks and duplicate `@keyframes` declarations (e.g. [lines 1187-1190](file:///Users/ashan/Documents/Codex/ll-overnight/public/v210.css#L1187-L1190), [lines 3380-3385](file:///Users/ashan/Documents/Codex/ll-overnight/public/v210.css#L3380-L3385), and [lines 3887-3901](file:///Users/ashan/Documents/Codex/ll-overnight/public/v210.css#L3887-L3901)). As acknowledged in `.overnight/CSS-LAYERS.md`, this does not break layout or runtime behavior, but inflates stylesheet size. | In v2.2, deduplicate keyframes and unify `@media (prefers-reduced-motion)` overrides into a single reset section at the end of the stylesheet. |
| 2 | **LOW** | [public/ledger-core.js:568-583](file:///Users/ashan/Documents/Codex/ll-overnight/public/ledger-core.js#L568-L583) | **Weekly recurring templates fulfill for the whole month on first post.** `transactionFulfillsRecurring` checks only `tx.date.startsWith(ym)` and `(categoryId, amountMinor)`. Once a single entry matching the weekly template is posted, `recurringPendingForMonth` marks the template satisfied for the entire calendar month, under-counting pending entries for subsequent weeks. | Check `cadence === "weekly"` against the specific ISO week (`isoWeekKey`) instead of the whole month `ym` when computing pending occurrences. |
| 3 | **INFO** | [tests/](file:///Users/ashan/Documents/Codex/ll-overnight/tests/) | **Playwright browser test suite unverified in sandbox.** All 358 unit tests and syntax checks (`npm test`) pass cleanly. However, executing `npm run test:browser` (17 Playwright suites across ports 5271–5275) cannot complete inside the restricted sandbox environment due to loopback network socket binding restrictions. | Run `npm run test:browser` in an unsandboxed local terminal. (**Unverified** in sandbox). |

---

### Key Evidence by Evaluation Area

1. **Data safety (No HIGH risks found):**
   - **Old state without `ledger`:** Loads completely unmodified; missing `ledger` defaults cleanly to `undefined` without mutating stored JSON ([app.js:2628-2629](file:///Users/ashan/Documents/Codex/ll-overnight/public/app.js#L2628-L2629)). Existing user transactions in `state.ledger` actively block sample/demo overwrites ([demo-workspace.js:83](file:///Users/ashan/Documents/Codex/ll-overnight/public/demo-workspace.js#L83)).
   - **Persistence & Cloud Sync:** Survives local `saveState` ([app.js:3307](file:///Users/ashan/Documents/Codex/ll-overnight/public/app.js#L3307)); `mergeRemoteCloudPayload` preserves local ledger when the remote payload omits it ([app.js:3047-3051](file:///Users/ashan/Documents/Codex/ll-overnight/public/app.js#L3047-L3051)); local transactions backfill missing remote ledger on subsequent push ([app.js:3054-3058](file:///Users/ashan/Documents/Codex/ll-overnight/public/app.js#L3054-L3058), [app.js:3591-3594](file:///Users/ashan/Documents/Codex/ll-overnight/public/app.js#L3591-L3594)); CAS 409 conflicts safeguard losing states into downloadable conflict backups ([app.js:3074](file:///Users/ashan/Documents/Codex/ll-overnight/public/app.js#L3074), [app.js:3168-3182](file:///Users/ashan/Documents/Codex/ll-overnight/public/app.js#L3168-L3182)); and backup v3 export/import round-trips deduplicate transactions by ID and budgets by `(month, categoryId)` ([app.js:6007-6014](file:///Users/ashan/Documents/Codex/ll-overnight/public/app.js#L6007-L6014), [app.js:6549-6551](file:///Users/ashan/Documents/Codex/ll-overnight/public/app.js#L6549-L6551), [ledger-core.js:1715-1738](file:///Users/ashan/Documents/Codex/ll-overnight/public/ledger-core.js#L1715-L1738)).
   - **Undo delete:** Transactions ([ledger-ui.js:1031-1042](file:///Users/ashan/Documents/Codex/ll-overnight/public/ledger-ui.js#L1031-L1042)), budgets ([ledger-ui.js:964-975](file:///Users/ashan/Documents/Codex/ll-overnight/public/ledger-ui.js#L964-L975)), and recurring templates ([ledger-ui.js:900-911](file:///Users/ashan/Documents/Codex/ll-overnight/public/ledger-ui.js#L900-L911)) each provide toast undo actions that restore deleted entities to their previous index.
2. **Money correctness:**
   - **Integer minor units & Rounding:** Strict signed integer representation throughout (`amountMinor`); inputs round using `Math.round(val * 100)` ([ledger-core.js:231](file:///Users/ashan/Documents/Codex/ll-overnight/public/ledger-core.js#L231), [ledger-core.js:1080](file:///Users/ashan/Documents/Codex/ll-overnight/public/ledger-core.js#L1080)).
   - **Currency mixing:** Monthly totals, breakdowns, and budgets aggregate solely in the default currency; non-default currencies are separated and surfaced in hint copy ([ledger-core.js:333-350](file:///Users/ashan/Documents/Codex/ll-overnight/public/ledger-core.js#L333-L350), [ledger-ui.js:1059-1065](file:///Users/ashan/Documents/Codex/ll-overnight/public/ledger-ui.js#L1059-L1065)).
   - **Parsing:** Natural language field accepts "12,50", "3.2", "-45", "+2000", and German/English/Chinese date keywords without timezone drift ([ledger-core.js:219-318](file:///Users/ashan/Documents/Codex/ll-overnight/public/ledger-core.js#L219-L318)).
   - **German CSV:** Tokenizer character loop preserves empty `;;` cells without shifting columns ([ledger-core.js:1047-1065](file:///Users/ashan/Documents/Codex/ll-overnight/public/ledger-core.js#L1047-L1065)); parses trailing minus amounts (`12,50-`) ([ledger-core.js:1071-1076](file:///Users/ashan/Documents/Codex/ll-overnight/public/ledger-core.js#L1071-L1076)); and export localizes category names with an explicit currency column ([ledger-core.js:1152-1175](file:///Users/ashan/Documents/Codex/ll-overnight/public/ledger-core.js#L1152-L1175)).
3. **Regressions & UX:**
   - **No `<label>` wrapping interactive buttons:** Quick entry input and submit button are structured using `div.ledger-quick-label` ([ledger-ui.js:1085-1089](file:///Users/ashan/Documents/Codex/ll-overnight/public/ledger-ui.js#L1085-L1089)).
   - **Popovers:** Opaque backgrounds (`#fff` / `#1e2630`) and top-layer `z-index: 12000` ([v210.css:1130-1150](file:///Users/ashan/Documents/Codex/ll-overnight/public/v210.css#L1130-L1150)); dismissed via backdrop click or `Escape` ([ledger-ui.js:69-77](file:///Users/ashan/Documents/Codex/ll-overnight/public/ledger-ui.js#L69-L77)).
   - **Typing persistence:** Filter input updates list container innerHTML only, avoiding input focus loss ([ledger-ui.js:790-801](file:///Users/ashan/Documents/Codex/ll-overnight/public/ledger-ui.js#L790-L801)).
   - **Mac shell:** Month navigation steps the Money view when active ([desktop/mac/shell.js:67](file:///Users/ashan/Documents/Codex/ll-overnight/desktop/mac/shell.js#L67)).
4. **Rule breaks:**
   - Zero runtime external network requests, CDNs, or telemetry.
   - No GPL code copied (cleanroom MIT/Apache design patterns only).
   - Zero secrets; `functions/` and production SQL migrations have zero diff.
   - Tauri updater keys and signing configuration untouched.
   - Full trilingual parity across `zh-CN`, `en`, and `de-DE` in code and documentation.
   - Manifest versions synchronized to web `2.1.0` / Mac `3.1.0` across `package.json`, `package-lock.json`, `release-metadata.js`, `public/sw.js`, `public/index.html`, and `src-tauri/Cargo.toml`.

---

### Verdict

**Yes, this overnight build is completely safe for the owner to try locally tomorrow.** Data safety and backward compatibility are preserved across local storage, cloud CAS sync, conflict recovery, and backup cycles; user transactions cannot be wiped or corrupted by empty states or sample seeding; financial inputs and CSV parsing conform to German banking rules without floating-point inaccuracies; no forbidden `<label>` nesting or translucent popovers were introduced; and all 358 unit tests pass cleanly. The only unverified element in this review is the 17-suite Playwright browser test run (`npm run test:browser`), which requires an unsandboxed local terminal due to sandbox loopback socket restrictions.
