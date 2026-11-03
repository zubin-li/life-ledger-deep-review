# Antigravity review

status: completed

### Overnight Build Review (`v2.0.10` → `HEAD`)

| # | HIGH/MED/LOW | file:line | problem | concrete fix |
|---|---|---|---|---|
| 1 | **MED** | [public/ledger-core.js:409-411](file:///Users/ashan/Documents/Codex/ll-overnight/public/ledger-core.js#L409-L411), [460-462](file:///Users/ashan/Documents/Codex/ll-overnight/public/ledger-core.js#L460-L462), [490-492](file:///Users/ashan/Documents/Codex/ll-overnight/public/ledger-core.js#L490-L492) | **Expense decrease percentage divides by current spending instead of previous baseline.** When spending drops (`curExp < prevExp`), passing `Math.max` and `Math.min` into `spendInsightDeltaPercent(higher, lower)` computes `(prev - cur) / cur` instead of `(prev - cur) / prev`. For example, if spending drops from 100 € to 10 € (a 90% drop), it calculates `(100 - 10) / 10 = 900%` and renders `"−900%"` (noted in `PROGRESS.md` as exaggerated percentages). | Compute temporal percent change against the baseline: `const deltaPercent = prevExp > 0 ? Math.round(Math.abs(curExp - prevExp) / prevExp * 100) : null;`. |
| 2 | **LOW** | [public/v210.css:1-4420](file:///Users/ashan/Documents/Codex/ll-overnight/public/v210.css#L1-L4420) | **CSS redundancy across concatenated overnight slices.** Concatenating CSS across 10 rounds left 20+ duplicate `@media (prefers-reduced-motion)` blocks and repeated keyframes (e.g. lines 1187, 3380, 3904). Runtime behavior is intact, but stylesheet payload is inflated. | As noted in `.overnight/CSS-LAYERS.md`, consolidate all motion overrides into a single media query block at the end of the file in v2.2. |
| 3 | **LOW** | [public/app.js:2162-2166](file:///Users/ashan/Documents/Codex/ll-overnight/public/app.js#L2162-L2166) | **Redundant language preference check.** Line 2162 tests `explicitLanguagePreference === "true"`, immediately followed by line 2164 checking `explicitLanguagePreference !== "false"`. The first condition is completely subsumed by the second. | Remove line 2162–2163 to simplify the ternary ladder. |
| 4 | **INFO** | [tests/*.browser.test.mjs](file:///Users/ashan/Documents/Codex/ll-overnight/tests/) | **Playwright browser test suite (17 tests) unverified in sandbox.** All 374 unit tests and syntax checks pass (`npm test`). However, `npm run test:browser` cannot complete in the standard sandbox because loopback network socket binding (`127.0.0.1:529x`) is restricted by the sandbox environment. *(Unverified)* | Run `npm run test:browser` in an unsandboxed local terminal before shipping. |

---

### Detailed Findings by Evaluation Area

1. **Data safety (Zero HIGH risks):**
   - **Legacy State Compatibility:** State lacking `state.ledger` loads completely unchanged ([public/app.js:2733-2744](file:///Users/ashan/Documents/Codex/ll-overnight/public/app.js#L2733-L2744)). Missing ledger safely normalizes to a non-persisted fallback during widget reads ([public/today-widgets.js:545](file:///Users/ashan/Documents/Codex/ll-overnight/public/today-widgets.js#L545)).
   - **Local Persistence & Sync:** `saveState()` writes `state.ledger` cleanly to `localStorage` ([public/app.js:3411-3418](file:///Users/ashan/Documents/Codex/ll-overnight/public/app.js#L3411-L3418)). `mergeRemoteCloudPayload()` preserves local ledger data when the remote cloud payload lacks it ([public/app.js:3155-3159](file:///Users/ashan/Documents/Codex/ll-overnight/public/app.js#L3155-L3159)). If the cloud lacks ledger data while the local copy has transactions, `shouldBackfillCloudLedger()` triggers an automatic backfill push ([public/app.js:3162-3165](file:///Users/ashan/Documents/Codex/ll-overnight/public/app.js#L3162-L3165), [app.js:3672](file:///Users/ashan/Documents/Codex/ll-overnight/public/app.js#L3672)).
   - **Conflict Copies & CAS:** On 409 CAS conflict, `planCloudStateConflict()` preserves the local losing state (including its ledger) into a portable backup record ([public/app.js:3276-3290](file:///Users/ashan/Documents/Codex/ll-overnight/public/app.js#L3276-L3290)).
   - **Backup Import/Export & Undo:** Backup exports scope ledger data by date range ([public/app.js:6115-6123](file:///Users/ashan/Documents/Codex/ll-overnight/public/app.js#L6115-L6123)); partial imports cleanly merge transactions and budgets ([public/app.js:6657-6659](file:///Users/ashan/Documents/Codex/ll-overnight/public/app.js#L6657-L6659)); full imports restore ledger data ([public/app.js:6589](file:///Users/ashan/Documents/Codex/ll-overnight/public/app.js#L6589)); and `undoLastRestore()` restores the previous snapshot ([public/app.js:6767-6798](file:///Users/ashan/Documents/Codex/ll-overnight/public/app.js#L6767-L6798)).
   - **Undo Delete:** Deletions for transactions ([public/ledger-ui.js:1049-1055](file:///Users/ashan/Documents/Codex/ll-overnight/public/ledger-ui.js#L1049-L1055)), budgets ([public/ledger-ui.js:982-988](file:///Users/ashan/Documents/Codex/ll-overnight/public/ledger-ui.js#L982-L988)), and recurring templates ([public/ledger-ui.js:918-924](file:///Users/ashan/Documents/Codex/ll-overnight/public/ledger-ui.js#L918-L924)) provide toast-action undo restoration.

2. **Money correctness:**
   - **Integer Minor Units:** All monetary values strictly use signed integer cents (`amountMinor`), rounding via `Math.round(val * 100)` ([public/ledger-core.js:231](file:///Users/ashan/Documents/Codex/ll-overnight/public/ledger-core.js#L231), [ledger-core.js:1318](file:///Users/ashan/Documents/Codex/ll-overnight/public/ledger-core.js#L1318)).
   - **Currency Isolation:** Totals and summaries filter strictly by `txInReportingCurrency(base, tx)` ([public/ledger-core.js:333-355](file:///Users/ashan/Documents/Codex/ll-overnight/public/ledger-core.js#L333-L355)). Multi-currency entries are never mixed into totals and are surfaced via `otherCurrencyCount` hints ([public/ledger-ui.js:1097](file:///Users/ashan/Documents/Codex/ll-overnight/public/ledger-ui.js#L1097)).
   - **Parsing:** Natural language entry parses `"12,50"`, `"3.2"`, `"-45"`, `"+2000"`, and date keywords (`"gestern"`, `"heute"`, `"yesterday"`) without floating-point errors ([public/ledger-core.js:219-318](file:///Users/ashan/Documents/Codex/ll-overnight/public/ledger-core.js#L219-L318)).
   - **German CSV:** Semicolon delimiter parser handles embedded quotes and empty columns (`splitGermanCsvLine`, [public/ledger-core.js:1285-1303](file:///Users/ashan/Documents/Codex/ll-overnight/public/ledger-core.js#L1285-L1303)), parses trailing negative signs (`12,50-`) ([public/ledger-core.js:1309-1314](file:///Users/ashan/Documents/Codex/ll-overnight/public/ledger-core.js#L1309-L1314)), and exports `DD.MM.YYYY` with decimal commas ([public/ledger-core.js:1390-1402](file:///Users/ashan/Documents/Codex/ll-overnight/public/ledger-core.js#L1390-L1402)).
   - **Time Zones & Month Rollovers:** Date computations use local noon (`12:00:00`) to prevent DST date shifts ([public/ledger-core.js:255](file:///Users/ashan/Documents/Codex/ll-overnight/public/ledger-core.js#L255), [ledger-core.js:383](file:///Users/ashan/Documents/Codex/ll-overnight/public/ledger-core.js#L383), [ledger-core.js:1483](file:///Users/ashan/Documents/Codex/ll-overnight/public/ledger-core.js#L1483)).

3. **Regressions:**
   - **Label Tag Nesting:** Zero `<button>` elements exist inside `<label>` tags (confirmed via AST search). Quick entry uses `div.ledger-quick-label` ([public/ledger-ui.js:1099-1102](file:///Users/ashan/Documents/Codex/ll-overnight/public/ledger-ui.js#L1099-L1102)).
   - **Popovers:** All popovers use `z-index: 12000` with opaque backgrounds (`#fff` / `#1e2630`) ([public/v210.css:1143-1166](file:///Users/ashan/Documents/Codex/ll-overnight/public/v210.css#L1143-L1166)) and dismiss cleanly on `Escape` or backdrop click ([public/ledger-ui.js:69-77](file:///Users/ashan/Documents/Codex/ll-overnight/public/ledger-ui.js#L69-L77)).
   - **Input Focus:** Filter input dynamically patches only `.ledger-list-wrap` without tearing down or stealing focus from the active search input ([public/ledger-ui.js:804-815](file:///Users/ashan/Documents/Codex/ll-overnight/public/ledger-ui.js#L804-L815)). Keyboard shortcuts defer when inputs are focused ([public/ledger-ui.js:14-24](file:///Users/ashan/Documents/Codex/ll-overnight/public/ledger-ui.js#L14-L24)).
   - **Mac Shell:** Shell shortcut mapping includes month navigation for the ledger view ([desktop/mac/shell.js:67](file:///Users/ashan/Documents/Codex/ll-overnight/desktop/mac/shell.js#L67)).

4. **Rule breaks:**
   - Zero runtime network calls, external fonts, or analytics (verified via search on `public/`).
   - Zero server-side `functions/`, migrations, or D1 schema modifications.
   - Tauri updater keys and signing configurations are untouched.
   - No GPL code copied (only cleanroom concepts from Actual/ezBookkeeping).
   - Consistent version synchronization: Web `2.1.0` / Mac `3.1.0` across `package.json`, `package-lock.json`, `src/release-metadata.js`, `public/sw.js`, `public/index.html`, and `src-tauri/Cargo.toml`.
   - Full trilingual parity across `zh-CN`, `en`, and `de-DE` in UI strings and READMEs.

---

### Verdict

**Yes, this overnight build is safe for the owner to try locally tomorrow.** Data integrity is rigorously safeguarded across local storage, cloud CAS sync, conflict resolution, and backup round-trips; old user state without bookkeeping is completely unaffected; money handling strictly uses integer minor units; and no input focus or WebKit `<label>` click-forwarding regressions were introduced. The only substantive defect is MED finding #1 (spending drop percentages dividing by the smaller current value rather than the baseline), which affects only the display caption and does not corrupt any underlying data. All 374 unit tests pass (`npm test`); the 17 Playwright browser tests (`npm run test:browser`) remain *unverified* solely due to standard sandbox loopback socket restrictions.
