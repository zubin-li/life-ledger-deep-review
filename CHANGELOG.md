# Changelog

All notable changes are documented here.

## [Unreleased]

### Changed

- **Review Money insights:** budget line also notes fewer low-mood days or more calm/good mood on over-budget category spend days (`positiveHotRate` / `positiveOtherRate` in `moodOverspendCategoryInsight`).
- **Review habit trend:** when no completion line exists yet, the day-by-day chart shows hairline empty guidance; inspector habit table uses the same empty pattern.
- **Review Money insights:** over-budget categories summary with optional low-mood correlation on spend days in those categories; habit-by-habit table uses hairline empty art when data is thin (`budgetOverspendList`, `moodOverspendCategoryInsight`).
- **Review Money insights:** mood/habit/focus comparison lines include a percent delta when one side spends more; top expense category shown under monthly stats (`spendInsightDeltaPercent`, `v210.css`).
- **Timeline & shared empty art:** `hairlineEmptyMarkup` uses `ll-empty-enter` for feed/journal/habit empty placeholders.
- **README (EN/ZH/DE):** product tour adds desktop Money (`08-ledger-v21`) screenshot between Timeline and mobile row.

### Added

- **Today & journal (Goal 2):** hero card daypart ambience (morning/afternoon/evening/night), progress-ring glow when habits complete, journal composer focus elevation, timeline feed row enter + hover lift, **reflection streak** badge on daily timeline (`v224-today-journal-hero.css`; `LifeLedgerAnalytics.reflectionStreak`).
- **Review & Today (Goal 2):** month insight metrics and hero habit count use `LifeLedgerInteraction.rollText`; habit cards get press/completed glow; ledger category donut reveal + ring contrast (`v225-roll-habit-ledger.css`).
- **Review:** wide-screen three-column grid for mood/habit/focus scatter charts plus compact insight stack (`v219-review-scatter-grid.css`).
- **Review:** mobile scatter rhythm, insight kickers (Mood/Habits/Focus), and clearer conflict Money preview on narrow screens (`v220-review-mobile.css`).
- **Review:** mobile jump chips to scroll to mood/habit/focus charts and insight stack; month stat roll-up when changing months (`v221-review-scatter-jump.css`).
- **Review:** scroll-spy highlights the jump chip for the chart section in view (`v222-review-jump-spy.css`).
- **Money:** per-category monthly budget limits with set/edit popover and undoable delete (`v223-ledger-budget-ui.css`).
- **Review:** habit-completion-vs-spend scatter in the monthly Money panel (`v217-habit-scatter.css`).
- **Review:** focus-time-vs-spend scatter beside mood/habit charts (`v218-focus-scatter.css`); demo workspace aligns focus minutes with spend for insights.
- **Import & export:** read-only **Money merge preview** on the sync-conflict recovery card (`v217-conflict-ledger.css`).
- **Review:** mood-vs-spend scatter chart in the monthly Money summary panel (`v216-mood-scatter.css`).
- **Ledger charts:** SVG annular donut for category breakdown (reliable in WebKit/headless; `breakdownDonutSlices` / `annularSectorPath`).
- **Review score grid:** completion rate/count roll on month change, staggered card enter, hairline empty when no habits (`v226-review-score-donut.css`).
- **Review rhythm bars:** month completion bar-chart retarget, habit compare bar width pulse, weekday column regrow + percent roll, focus week bars stagger (`review-bars.js`, `v227-review-bars-weekday.css`).
- **Money & Today empty states:** ledger onboarding, list/budget/recurring/donut/trend placeholders and Today spending card use shared `ll-empty-enter` motion (`v228-ledger-empty-enter.css`).
- **Money:** budget progress bars grow with stagger when switching months (`v229-ledger-budget-bars.css`; `LifeLedgerReviewBars.animateLedgerBudgetFills`).
- **Money:** category donut / treemap cells and daily spend heatmap stagger when switching months (`v230-ledger-chart-retarget.css`; `LifeLedgerInteraction.retarget` on chart scopes).
- **Review:** monthly Money stat columns, scatter dots, and insight lines restagger when changing review months (`v231-review-ledger-retarget.css`; `LifeLedgerInteraction.retarget` on `#reviewLedgerSummary`).
- **Money (Goal 2):** quick-entry form success flash, new transaction row enter, submit button press (`v232-ledger-entry-feedback.css`).
- **Long-range (Goal 2):** horizon workspace sections stagger on page enter (`v210.css` batch 5 round 1).
- **Timeline (Goal 2):** switching daily / weekly / monthly feed replays row enter; photo library tiles stagger on Photos mode; Today photo wall gets a subtle bottom vignette (`v210.css` batch 5 round 5).
- **QA:** `npm test` skips `*.browser.test.mjs`; run `npm run test:browser` for Playwright suites locally or in CI.
- **QA:** `fakecloud-conflict.browser.test.mjs` exercises stale CAS PUT → conflict recovery card on the Import tab, including Money merge preview (after seeding ledger on cloud payload).
- **QA:** `fakecloud-preview-ledger.browser.test.mjs` — `?mode=cloudflare&local-preview=demo-showcase-v1` seeds fiction demo (incl. Money) and uploads ledger on first sync without manual API seeding.
- **Cloud sync:** `?local-preview=demo-showcase-v1` now seeds the three-month fiction demo (including Money) in online editions; after pull, missing remote `ledger` triggers a one-time backfill push.
- **QA:** `fakecloud.sh` copies the site into `/tmp/life-ledger-overnight-fakecloud` so local Pages dev does not inherit repo-root `wrangler.jsonc` D1 bindings (fixes empty `states` table / 500 on GET).

### Changed

- **Assets:** consolidated overnight styles `v211`–`v232` into a single `v210.css` (fewer `<link>` tags and SW cache entries; REVIEW #4).
- **Today (Goal 2):** sidebar active pill fades in; habit check adds a brief accent ring on the habits card (`v210.css` round 3 section).
- **Habits (Goal 2):** library overview stat roll-up, page enter stagger, filter chip press, selected row glow, filter-empty hint card (`v210.css` round 4 section).
- **Review (Goal 2):** collapsed **Detailed metrics** summary shows average habit completion and focus minutes; first-visit hint until expanded (`review-metrics-preview.js`, `v210.css` round 5).
- **Review (Goal 2):** collapsed **Detailed metrics** also shows up to three top habit completion chips (colour + %); hidden when expanded to avoid duplicating the score grid (`v210.css` round 6).
- **Week (Goal 2):** module cards stagger on page enter; calendar day empty cells use softer enter styling (`v210.css` round 5).
- **Week (Goal 2):** insights stat cards stagger after modules; empty insights hairline uses shared enter motion (`v210.css` round 6).
- **Import & export:** switching to the **Import** backup tab refreshes conflict recovery visibility and the Money merge preview (so the card is not stale while the panel was hidden).
- **Week (Goal 2):** when every weekly goal is checked off, the celebration banner matches long-term empty styling and `ll-empty-enter` motion (`pages-art.js`, `v210.css` round 7).
- **Review (Goal 2):** collapsed habit chips align cleanly on viewports ≤520px (`v210.css` round 7).
- **Money (Goal 2):** ledger page enter animations target `#ledgerView.view.is-entering` (fixes inert stagger selectors).
- **CI:** separate `browser` job runs `npm run test:browser` after installing Playwright; `playwright` is a devDependency with shared `tests/playwright-resolve.mjs`.
- **Review:** heatmap-only legacy analytics path when the insight dashboard is active — no duplicate habit/weekday DOM in `#reviewHabitCompare` (`reviewUsesInsightPanels` in `app.js`).

- **Docs:** README EN/ZH/DE mention timeline **reflection streak**; `.overnight/CSS-LAYERS.md` documents `v225`–`v230`.
- **Maintainability:** documented CSS slice layout in `.overnight/CSS-LAYERS.md`; removed duplicate `isoFromDate` in `ledger-core.js`; `.overnight/scratch/` gitignored and deleted from the tree.
- **Money (mobile):** extra bottom padding on very short viewports so the amount keypad clears the tab bar (`v213-onboarding.css`); Batch 4 Round 10 extends clearance for ≤640px and ≤480px height.

- **Goal 2 (Batch 5 R2):** Today hero / daily-tool / calendar enter stagger; inline focus ring breathe while timer runs; Playwright regression for invalid edit amounts; Mac shell Today screenshot (`b5r2-*`).
- **Goal 2 (Batch 5 R3):** Review page enter stagger via `#reviewView.view.is-entering`; short-viewport ledger keypad fixed dock while quick field focused; screenshots `b5r3-*`.
- **Goal 2 (Batch 5 R4):** Habits page enter stagger scoped to `#habitsView.view.is-entering` (header → reminder → stats → list); week page header + seven-day calendar column stagger after module cards; screenshots `b5r4-*`.
- **Goal 2 (Batch 5 R9):** Settings and import/export dialogs play a short enter animation; backup Export/Import tab switch retargets the panel; Today hero/mood row spacing; review scatter jump announces section in reduced motion with a static outline spotlight; screenshots `b5r9-*`.
- **Docs (Batch 5 R10):** fictional **Money** showcase PNGs (`*-08-ledger-v21.png`) in EN/ZH/DE desktop and mobile; SHOWCASE pages updated; `readme-locales` asserts ledger screenshots exist.

### Fixed

- **Money (Batch 6 R1 / Antigravity review):** seeded categories keep English `name` for language switching; German CSV splits quoted fields and parses trailing-minus amounts; month summary shows a hint when non-default-currency rows are excluded; edit popover dismisses on backdrop/Escape (all ledger popovers Escape); mobile swipe-delete ignores vertical scroll; Mac menu previous/next month works on Money.
- **Money (Batch 6 R2):** `normalize` repairs legacy default categories whose `name` was saved as zh/de; Today **Spending today** card shows a 7-day mini sparkline when recent expenses exist (`dailyExpenseSeries` / `renderMiniSpendSparklineSvg`).
- **Page motion:** `is-entering` stagger selectors now attach to `#todayView`, `#timelineView`, and `#longrangeView` themselves (was a no-op descendant selector); long-range enter animation actually plays.
- **Review motion:** same fix for `#reviewView` — metrics cards and trend chart stagger on sidebar entry (pages-858 rule never matched).
- **Money (mobile ≤480px height):** amount keypad pins above the tab bar while the quick field is focused (opaque dock, no scroll chase).
- **Today focus tab:** `setDailyToolPage` / `updateDailyToolControls` no longer hard-code journal — the Focus timer panel is reachable again on Today.
- **Money (CSV export):** export includes explicit `currency` column (and `amount` header) so EUR/CNY rows are not mislabeled as `amount_eur` (Antigravity review).
- **Money (edit):** invalid amount in the edit popover shows `.is-error` instead of silently keeping the old amount.
- **Assets:** `pages-polish.css` loads before `v210.css` again so consolidated 2.1 polish wins the cascade (Antigravity review).
- **Release QA:** deploy unit test writes manifests into a temp dir instead of `.life-ledger-deployments/`.
- **Week / Timeline polish:** `pages-art.js` and `pages-polish.css` are now loaded in `index.html` and the service worker shell (they existed but were never wired, so empty-state art and the weekly all-done banner did not run).
- **Money (review fixes):** backup export includes `state.ledger` (scoped by date range); partial restore merges ledger transactions/categories; quick entry and edit preserve income categories without a leading `+`; German CSV quoted amounts import; summaries, budgets, and Today spend use default currency only; Today card no longer shows `-0,00` on zero-spend days; quick-entry default date uses local timezone.
- **Today spending card:** `ledgerHasEntries` is evaluated before the empty-state copy runs, fixing a temporal-dead-zone crash when the card renders on days with no spend.
- **Language:** stored `life-ledger-language` now applies on first paint when the user has not opted out (`language-preference-set` ≠ `false`), matching backup restore and fixing Playwright / deep-link cases where UI strings stayed English while localized data did not.
- **Cloud sync:** pending conflict resolution on GET now merges the conflict backup’s `ledger` when the remote payload omits it (same rule as immediate 409 adopt).
- **Cloud sync (Batch 4 / Antigravity review):** Tencent **CloudBase** pull now uses `mergeRemoteCloudPayload`, so a pre-2.1.0 remote without `ledger` no longer wipes local bookkeeping on sync.
- **Money charts:** category donut/treemap breakdown counts only the ledger’s default reporting currency (CNY/EUR no longer summed 1:1).
- **Money backup merge:** importing a backup deduplicates monthly category budgets by `(month, categoryId)` instead of UUID alone, avoiding duplicate budget bars.

## [2.1.0] - 2026-11-02

Web 2.1.0 and Life Ledger for Mac 3.1.0.

### Added

- **Bookkeeping (记账):** `state.ledger` (accounts, categories with icon/colour, transactions, budgets, recurring templates) in integer minor units + ISO currency; local save, cloud CAS payload, backup v3, demo sample, undoable delete. Sidebar **Money / 记账 / Finanzen** in all editions.
- **Quick entry:** natural-language field (`12,50 咖啡`, `-45 Miete gestern`, …), touch amount keypad, category chips, edit/duplicate/swipe-delete, opaque edit popover, recurring create/edit/delete with “Post now”.
- **Money views:** month overview, donut/treemap toggle (SVG treemap), daily spend heatmap, uPlot trend, budget progress, search/filter, German CSV import/export (`;`, decimal comma, DD.MM.YYYY).
- **Today card — Spending today:** day/month totals, roll-up animation, link to Money; first-visit syntax hint (hidden after first entry/import); quieter copy on days with ledger history but zero spend today.
- **Monthly review:** spending summary, mood-vs-spend and habit-completion-vs-spend insights, focus-vs-spend insight, habit sparkline enter, completion trend line draw (`v210`–`v215` CSS: polish, skeletons, onboarding, goals/journal empty states, review trend).
- **Sample workspace:** ~90 days EUR transactions, category budgets, early-month padding, recurring templates; demo helpers align mood/habit/focus insights for review.
- **Tests:** ledger parsing, totals, CSV, backup round-trip, cloud merge with ledger, Today spending hint contracts.

### Changed

- Mood-vs-spend uses testable `moodSpendComparison` in `ledger-core.js`; quick-entry field no longer wrapped in `<label>` (Add button stays outside).
- Timeline calendar photo skeleton; treemap pale-tile labels; mobile ledger bottom padding for keypad; week insight number pulse while recalculating.
- Release metadata, PWA cache, and asset `?v=` markers aligned to **2.1.0** / Mac **3.1.0**.

## [2.0.10] - 2026-11-02

Web 2.0.10 and Life Ledger for Mac 3.0.4.

### Fixed

- **Habit accent colour can be changed again.** The colour swatches and the icon picker sat inside a `<label>`. Apple WebKit (Safari and the Mac app) forwards a click inside a label to the label's first button once the clicked swatch has been re-drawn, so every choice snapped back to the first colour. The pickers are now plain groups (`role="group"`, still named by their caption). Also affects the colour choice in the **New habit** dialog.
- **Icon picker is readable.** The icon panel was translucent and the next form section painted over it, so labels, colours and the tracking switch showed through the icons and caught clicks. Pickers are now opaque, and an open picker lifts its section above the ones below.

## [2.0.9] - 2026-11-02

Life Ledger for Mac 3.0.3 (web unchanged apart from the version).

### Fixed

- **Mac app signature covers the whole app.** Release builds only signed the program file, not the app bundle around it; macOS can then call a browser-downloaded copy "damaged" instead of offering **Open Anyway**. The bundle is now ad-hoc signed as a whole (`signingIdentity: "-"`). This is also the first version delivered through the in-app update.

## [2.0.8] - 2026-11-02

Web 2.0.8 and Life Ledger for Mac 3.0.2.

### Added

- **Mac app: in-app updates.** The app checks for a new version at launch and once a day, and from **Life Ledger → Check for Updates…** or **Settings → Check for updates**. A native sheet shows what is new and asks before anything happens (**Update and Restart** / **Later**); records are not touched. Updates are verified with the app's own update signature (not Apple signing), served from the `mac-updates` release.

## [2.0.7] - 2026-11-02

Web 2.0.7 and Life Ledger for Mac 3.0.1. Audit remediation from PR #13, plus two fixes found while reviewing it.

### Added

- Authenticated `GET /api/version` release metadata, canonical release constants, guarded Cloudflare deploy tooling (`deploy:preflight`, `deploy:cloudflare -- --confirm`, `deploy:verify`, `deploy:rollback-command`), and English/Chinese operator runbooks under `docs/cloudflare-release-runbook*.md`.
- Safer offline PWA shell caching (API/Access bypass, no forced reload on service-worker activation, demo/hairline/HEIC assets pre-cached) and a separate `npm run desktop:icons` command so `desktop:prepare` no longer regenerates Tauri icons on every run.
- Backup schema v3 for approved non-secret preferences, safe full-restore/undo behavior, and native `.llmedia` binary import/export for the local macOS edition.
- D1 state revisions with compare-and-swap writes, recoverable conflict snapshots, and a storage-failure safety block that prevents silent cloud overwrites.

### Changed

- Removed unused `@tauri-apps/api` devDependency; the desktop shell uses the injected `window.__TAURI__` bridge and `@tauri-apps/cli` for builds only.
- Cloud clients now complete a successful first pull before any ordinary upload; reconnects and failed uploads must pull again before retrying.
- Synced names and avatars now use their own update timestamp instead of inheriting unrelated workspace timestamps.

### Fixed

- Unified both habit deletion entry points behind one confirmation flow and added a one-shot Undo that restores the original habit position and exact historical completion arrays.
- Kept native backup permissions restricted to the local Tauri window, preserved the connected desktop OAuth return marker, and aligned macOS workflow artifact paths with the actual `Life Ledger.app` bundle.
- Corrected habit accent-color rendering in the macOS webview by applying literal catalog colors and emitting the expected input/change events.
- Cloud edition: a browser that already had a custom Today layout, weather city or profile uploads them again after the first pull (the new first-pull gate had kept them local).
- Cloud edition: a full backup restore and its Undo keep the photo wall; backups do not contain wall media, so the wall used to empty on every device.

## [2.0.6] - 2026-10-28

### Fixed

- **Cloud edition: photo wall photos and videos now sync across devices.** They are stored privately in your own Cloudflare R2 (the same bucket and limits as day photos); the order and the chosen focus point travel with your records. The first browser that opens 2.0.6 with photos on its wall brings them to the cloud. Wall settings (auto-play, fill or fit) sync too.
- **Weather city:** the forecast for the synced city is loaded even when the weather card is hidden, so the header chip shows the same city on every device.
- Coming back to the app window (not only the browser tab) picks up changes from other devices.

## [2.0.5] - 2026-10-28

### Fixed

- **Cloud edition: the Today layout and the weather city now sync across devices.** Card order, sizes and hidden cards, the weather city, the heatmap colours, the habit shown in the frequency card, the page order and the calendar view travel with your records, so the browser, the phone and the Mac app look the same. Coming back to the window picks up changes made on another device. The first browser to open after the update shares the choices you already made; theme, font and language stay per device. The local edition is unchanged.
- The weather chart no longer throws an error while it switches to another city.

## [2.0.4] - 2026-10-28

### Added

- **Settings → Data → Switch to sync mode / Switch to local mode.** In the browser it opens your own deployment (or the local edition) and offers a backup first; in the Mac app it brings back the start window.
- The app version is shown at the bottom of Settings (in the Mac app also the app version).

### Changed

- **Reviews are only what you write.** Removed "Write review" on the week page, "Start guided review" on Insights and the generated review template. Day, week and month stay separate: the week timeline shows only your weekly reflection, the month only your monthly reflection. Old generated drafts are kept in backups, just no longer shown.
- The monthly reflection box is taller and grows with your text, with no inner scroll bar or resize grip.
- Every dropdown (timeline month, Insights week/month, long-range phase, the Mac launcher language) now uses the same glass pill as the language and date controls on Today.
- Settings → Data now holds both **Import & export** and **Install as app**. The sidebar footer shows only your photo and name.
- "D1 cloud sync" now reads "Cloud sync".
- **Profile photo framing:** drag the photo to move it and use the slider (or scroll) to zoom, like the photo wall. The whole photo is kept, not a fixed square crop.
- **Online edition:** name and photo sync with your records, so every device shows the same. The local edition keeps them on the device.

### Mac app 3.0.0

- **Sync edition:** connect your own deployment and sign in with an email code (Cloudflare Access). Records, photos, name and profile photo are the same on the Mac, in the browser and on the phone. New **File → Sign Out of Cloud**; the start window links to a setup guide ([English](docs/macos-cloud.md), [中文](docs/macos-cloud.zh-CN.md)).
- **Settings → Switch mode** and **File → Switch Workspace…** go back to the start window to choose this Mac or your cloud.
- Backups and photo exports from the cloud window are saved to **Downloads**; the cloud window identifies as Safari so Cloudflare's and Google's sign-in pages work.
- App commands are granted per window: the cloud page can only use native confirm/alert sheets, the menu language and the mode switch, never the file dialogs.
- The start window shows the app version and uses the same glass language picker as the app.

### Fixed

- The weather card's time is now the chosen city's live local time, not the computer's. The "now" line moves on its own.

## [2.0.3] - 2026-10-27

### Added

- Photo memories in the local web edition and the Mac app: up to three photos a day, kept on the device only (never uploaded), shown in the calendar, timeline and photo card, and included in monthly `.llmedia` backups. **Clear local data** removes them.

### Changed

- Import & export moved into **Settings → Data**; the sidebar icon is gone.
- Review: the week picker names the whole Monday–Sunday week the numbers cover, sits on one line with the Week/Month switch, and every remaining dropdown has the same flat style as Settings.
- The monthly reflection uses the full card width and grows with its text instead of scrolling inside a small box.
- The mood reason field is taller.

### Fixed

- The sidebar stays in the window while you scroll on Week, Horizon, Timeline, Review and Habits; it used to scroll away and leave an empty column. Switching pages opens the new page at its top.

## [2.0.2] - 2026-10-27

### Changed

- Today's mood card drops the seven-day strip; the title stays where it was, the three choices sit in the freed space and still ask for a reason.
- The daily review card is review only (Focus keeps its own card); it no longer pages sideways, comes in medium, large and full-row sizes, has dictation, and opens in a larger window.
- The sidebar quote is light text on the dark sidebar in both themes.
- Week page: weekly review and weekly goals sit side by side at the top.
- Year, month and language pickers look the same in Safari and Chrome.
- Every card now responds to the pointer: the Today calendar, the Today header card and the three Habits summary cards lift like the others; habit filters, Timeline view switches and Review's detailed metrics show a hover state.

### Added

- Settings → Quotes: automatic, or your own list (one stays, several rotate daily).
- Settings → Page order for Today, Week, Horizon, Timeline and Review.
- Weather shows a default city until one is chosen: Berlin for Germany, London for the UK, Beijing for Chinese.

### Fixed

- The sidebar name and photo can be edited again (click your name). The editor was lost in a rollback on 2026-10-18; name and photo stay on this device only.

### Changed

- Replaced the local sample's personal-looking German-study storyline and occupation label with three culturally distinct fictional everyday calendars for Simplified Chinese, British English, and German.

### Documentation

- Clarified that the complete Cloudflare edition includes a private R2 photo bucket and that first-time R2 activation creates a pay-as-you-go subscription even when current usage remains inside the included allowances.
- Added copy-ready English and Chinese Codex deployment prompts that inventory and reuse existing resources, separate core/R2/Google setup into evidence gates, and require same-tab OAuth plus API and D1 verification before reporting success.
- Distinguished first-time R2 activation from an existing deployment and required agents to list and reuse an existing photo bucket instead of attempting to create a duplicate.
- Added a German deployment-agent runbook, linked all three languages from every README, and routed repository-aware agents to the correct guide. The runbooks now provision D1 and R2 before the first complete deployment instead of attempting an impossible binding order.

## [2.0.1] - 2026-10-24

### Fixed

- Browsers that had used 1.x froze on the first 2.0 visit: the new service worker waited for a page reload that could only start after it finished activating. Pages now reload onto the new release after activation.
- The local edition shows the three-month sample to every visitor again, as intended for 2.0. Records a visitor made earlier in that browser are kept in a backup and can be brought back with **Settings → Restore earlier records**.

## [2.0.0] - 2026-10-24

### Added

- Today card workspace: weather, mood, daily foundations, habit heatmap, focus, recent rhythm, month, photo wall, day calendar and more as cards with **Edit cards** (add, remove, drag, resize, configure) and a card library; layouts are saved.
- Local edition opens with a deterministic three-month fictional sample (habits, mood, notes, weekly and monthly reviews, long-term plans, bundled illustrative photos); **Settings → Clear local data** and **Load sample data**.
- `docs/DESIGN.md` design family for cards and pages.

### Changed

- Redesigned Week, Horizon, Timeline, Review and Habit settings in one design family with shared motion; monthly review lives only in Review.
- Appearance and font moved into Settings; Apple system fonts by default.
- Language switching updates every page, dialog, menu option, accessibility label and the sample data immediately.
- One asset version (`?v=2.0.0`) for every script and stylesheet and a matching service-worker cache, so installed PWAs update cleanly.

### Safety

- Existing local records are never replaced automatically; only empty workspaces and older sample data are refreshed. Sample data and clearing controls never run in the cloud edition.

## [1.3.0] - 2026-09-26

### Added

- Added a first macOS Tauri v2 desktop MVP shell with a localized launcher that separates **Local on this Mac** from **Connected cloud** and keeps remote windows outside local IPC permissions.
- Added native macOS JSON backup save/open dialogs for the local desktop window as a progressive enhancement, while preserving browser/PWA download and file-input behavior unchanged.
- Added desktop build scripts (`desktop:prepare`, `desktop:dev`, `desktop:check`, `desktop:build`), Tauri capability checks, cloud URL validation tests, and desktop documentation.

### Security and compatibility

- Restricted connected cloud windows to normal HTTPS URLs (plus localhost development) and kept them outside the native IPC capability list.
- Limited native JSON imports to 10 MiB and preserved the existing validated backup preview and restore flow.
- Added a GitHub-hosted Apple Silicon verification workflow that tests and builds unsigned `.app` and `.dmg` artifacts without using a contributor's Mac.

## [1.2.1] - 2026-09-20

### Improved

- Improved Quick record with higher-fidelity capture, a real microphone-level meter, and a quiet-input warning in English, Simplified Chinese, and German.
- Added bounded personal vocabulary context from active habits, focus topics, weekly goals, and active long-term items to improve recognition of specific activities and project names.
- Made AI cleanup preserve concrete terms and correct likely speech-recognition errors only when the surrounding context is strong, without adding another inference call or storing audio.

### Documentation and community

- Reworked the English, Simplified Chinese, and German README introductions around a concise product promise, an immediate product preview, and clear paths to try or contribute.
- Added current Timeline desktop and mobile product images in English, Simplified Chinese, and German, plus a maintenance check that keeps this visible feature represented in every showcase.
- Opened public roadmap issues for cross-platform apps, deterministic PDF reports, privacy-preserving AI, editable AI report drafts, frontend modularization, and accessibility checks.
- Added GitHub Discussions, support guidance, a pull request template, and contributor routing for early ideas, self-hosting questions, and scoped implementation work.

### Fixed

- Removed the duplicate Timeline heading and localized the singular one-photo summary in all three interface languages.

## [1.2.0] - 2026-09-03

### Added

- Read-only Google Calendar context inside the daily workspace, including calendar selection, recurring-event filtering, and support for connecting up to two Google accounts.
- Mood-colored month cells with an optional habit-completion heatmap and compact calendar-event counts.
- Private Cloudflare R2 photo memories inside the mood flow, limited to three compressed photos per day.
- A chronological Timeline that combines mood, mood reasons, journal context, and photo memories.
- Compact long-term items in the desktop sidebar without introducing a second source of truth.
- Portable monthly `.llmedia` export and idempotent restore for records and compressed photos.

### Changed

- Reworked Today into a calmer daily workspace where schedule and reflection share an equal layout.
- Moved Focus into the Daily Reflection carousel so the primary page stays focused when the timer is not in use.
- Linked the Today workspace to the selected calendar date: hero progress, mood, habits, schedule, and reflection now move together.
- Removed the redundant flexible-goals panel and excluded retired daily goals from review evidence.
- Updated all three README languages with Google Calendar, photo-memory, Timeline, and backup guidance.

### Privacy and safety

- Photos are re-encoded in the browser, never published through an R2 public URL, and remain behind the existing Cloudflare Access identity.
- Media metadata and objects stay outside the whole-state JSON payload; local-only and CloudBase editions do not expose photo upload.
- Deployment-wide storage and monthly R2-operation ceilings keep application traffic well below the published Standard free allowances.
- Google Calendar access is read-only; credentials remain server-side and calendar events are not treated as completed habits or goals.

### Fixed

- Made macOS Photos-library selection resilient to temporary and zero-byte picker files while avoiding unnecessary HEIC conversion.
- Added native decoding and a bundled fallback for HEIC/HEIF, with format verification, JPEG fallback, and progressive resizing before upload.
- Improved photo errors for incomplete iCloud downloads, expired sessions, network failures, and temporary storage failures.
- Added responsive one-, two-, and three-photo Timeline compositions so portrait images no longer render as narrow strips.
- Made the mood-and-photo dialog scroll correctly in Android Firefox without forcing the mobile keyboard open.
- Kept Quick record visible in the reflection carousel and available for today and past entries while future dates remain locked.
- Replaced crowded event-dot clusters with one compact calendar/count badge.

## [1.1.0] - 2026-08-22

### Added

- A polished **Quick record** entry inside Daily Reflection for self-hosted Cloudflare deployments.
- Browser recording with pause, cancel, a ten-minute maximum, and responsive mobile/desktop states.
- Cloudflare Workers AI transcription followed by multilingual AI refinement into an editable daily-reflection draft.
- Original-transcript review, explicit confirmation, and append-only journal saving so existing reflections are never silently overwritten.
- Per-account limits of three requests and 20 recorded minutes per UTC day to keep personal free-tier usage predictable.

### Privacy and safety

- Raw audio is processed transiently and never stored in local state, D1, synchronization payloads, backups, or logs.
- The voice endpoint remains protected by the existing Cloudflare Access identity and is unavailable in local-only and CloudBase editions.
- Microphone permission is restricted to the app's own origin.
- Voice processing errors leave the existing journal unchanged and preserve a retry path whenever the in-memory recording is still available.

## [1.0.0] - 2026-08-20

Life Ledger 1.0 is the first stable release. It keeps the complete local-only experience free of accounts and central storage while preserving optional self-hosted synchronization.

### Added

- A zero-setup, HTTPS local-only PWA publishing path for GitHub Pages.
- Versioned JSON backups with validation, preview, complete restore, partial merge, earlier-export compatibility, and an undo safety copy.
- Best-effort persistent browser storage requests after local saves.
- English, Simplified Chinese, and German desktop/mobile product showcases.
- Tencent CloudBase deployment for mainland China, including email OTP authentication, creator-only document synchronization, maintained CLI configuration, and bilingual setup/cost documentation.
- A reproducible CloudBase build and one-command CLI deployment path that never includes browser-local demo data.
- A local-first focus timer with named topics, daily totals, weekly summaries, and a monthly heatmap.
- Flexible checklist or measured habits, effective-dated goal versions, optional notes, reliable ordering, and a paged mobile carousel.
- A structured product roadmap for printable reports, optional AI-assisted reflection, voice check-ins, photos, and contextual data.

### Fixed

- PWA upgrades now fetch core UI files network-first and use versioned asset URLs, preventing a new backup button from being paired with an older cached script.
- Mobile backup and restore now uses the same compact control rhythm and line-icon language as reminders and installation.
- Static HTTPS hosts no longer assume a Cloudflare API exists; deployment mode is now explicit.
- Blob download URLs remain available long enough for Safari and installed PWAs to save exports reliably.
- Simplified Chinese day-strip labels now use clear weekday abbreviations such as `周二` instead of truncating every label to `星`.
- Mobile bottom navigation now stays aligned to a stable safe-area inset while the page scrolls.
- Habit schedules and selected times now remain consistent between Today and Habit Settings.

### Compatibility notes

- Existing local and synchronized records continue to load without migration.
- JSON exports from earlier beta releases remain supported by the restore flow.
- Concurrent offline edits currently use latest-write-wins synchronization.
- Reminder delivery continues to depend on operating-system and browser PWA support.

## [0.1.0-beta.1] - 2026-08-12

### Added

- Daily habits, goals, mood, journal, and event notes.
- Weekly planning, outputs, and review archive.
- Monthly review, habit comparison dashboard, and trend charts.
- English, Simplified Chinese, and German interfaces.
- Light, dark, and system themes.
- Installable PWA, reminders while supported, and scoped JSON export.
- Optional self-hosted synchronization with Cloudflare Workers, Access, and D1.
- One-click Cloudflare deployment configuration.
- Zero-configuration local use by opening `public/index.html` directly.

### Known beta limitations

- Concurrent offline edits use latest-write-wins synchronization.
- Browser notification reliability depends on operating-system and browser PWA support.
