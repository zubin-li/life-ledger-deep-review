# Changelog

All notable changes are documented here.

## [Unreleased]

### Added
- **Polish (Batch 12 r6):** **Money** filtered **Transactions** list shows an entry count and net total strip; **Clear all filters** appears when two or more filters are active (search, day, category); day+category empty combo has a dedicated empty state.
- **QA (Batch 12 r6):** Unit test for `summarizeTransactions`; Playwright day+category filters → subtotal or combo empty → clear all.
- **Polish (Batch 12 r5):** **Money** donut/treemap segments filter the **Transactions** list (keyboard + clearable category chip); empty category filter shows **Clear category filter**.
- **QA (Batch 12 r5):** Unit test for category-scoped `filterTransactions`; Playwright donut segment → list filter.
- **Polish (Batch 12 r4):** **Money** transaction list, budget, and recurring sections use hairline empty art with primary CTAs (**Start typing**, **Set budget**, **Add recurring**); search/day filter empties reuse the search hairline with **Clear search** when needed.
- **QA (Batch 12 r4):** Playwright **Money** month-empty CTA focuses quick entry; budget empty opens popover.
- **Polish (Batch 12 r3):** **Money** **This month’s correlations** shows the same three-step empty checklist as **Review** when the month has spending but not enough mood/habit days for mini scatter charts (pills jump to **Today**, **Habits**, or **Money**).
- **QA (Batch 12 r3):** Playwright **Money** wellness scatter empty checklist (WebKit 390).
- **Polish (Batch 12 r2):** **Money** daily spend heatmap cells are tappable (keyboard + screen reader) to filter the transaction list for that day, with a clearable date chip; wellness mini scatter charts reuse Review dot tooltips and arrow-key navigation.
- **QA (Batch 12 r2):** Unit test for day-scoped `filterTransactions`; Playwright heatmap day filter + wellness scatter tooltip.
- **Polish (Batch 12 r1):** **Money** page shows side-by-side **mood × spend** and **habit × spend** mini scatter charts for the viewed month, with links that open the matching scatter in **Review** (shared `buildLedgerMonthDailyRows` with the review Money panel).
- **QA (Batch 12 r1):** Playwright **Money** wellness insights → **Review** habit scatter spotlight.
- **QA (Batch 11 r4):** Offline PWA browser test (cached ledger scripts + Money view while offline); fakecloud preview flow opens **Money** and asserts month summary + category viz.
- **QA (Batch 11 r5):** Mac shell + fakecloud online demo opens **Money** with cloud-synced demo rows (WebKit).
- **QA (Batch 11 r6):** Mac shell fakecloud **Money** asserts **← / N** shortcuts and native menu month step (`date:next`).
- **QA (Batch 11 r7):** Mac menu **`date:prev`** month step on fakecloud **Money**; Today habit×spend hint link scrolls to habit-vs-spend scatter in **Review**.
- **QA (Batch 11 r8):** Mac shell **`date:prev` / `date:next`** on **Review** and **Week**; journal timeline mood×spend insight link opens mood scatter.
- **Polish (Batch 11 r9):** **Week** page header shows the rolling **30-day habit × spend** chip on the current week (links to habit scatter in **Review** with spotlight); Today habit insight link uses the same scatter spotlight.
- **QA (Batch 11 r9):** Playwright **Week** habit×spend insight → `#review-scatter-habit`.
- **QA (Batch 11 r10 · final):** Release screenshot set `capture-batch11-round10.mjs` (Today / 记账 / 时间轴 / 复盘 / 本周 / Mac shell **Money**); overnight Batch 11 closed at **394** unit + **45** browser tests.

### Fixed
- **PWA offline:** `ledger-core.js` / `ledger-ui.js` included in service worker network-first managed assets so offline installs load bookkeeping scripts from cache.
- **CSV import:** German bank amounts with dot decimals only (e.g. `12.50`) no longer inflate 100×; `formatMoney` no longer prints `-0,00 €` for negative zero.
- **Quick entry:** invalid parse sets `aria-invalid` on the input for screen readers (visual `is-error` unchanged).
- **Demo insights:** Active demo workspaces with ledger but without `meta.demo.insightAlign` re-align moods/habits/focus once on boot so Today mood×spending and habit×spending hints render without `demo-reset=1`.

### Changed
- **Journal — Timeline:** Daily feed description can show a mood×spending insight chip with a link to the mood scatter in **Review** (when data exists).
- **Today:** Habit×spend insight **Review** link scrolls to the habit-vs-spend scatter (mood hint already jumps to mood scatter).
- **Habits:** Selected habit streak calendar cells pop in with a short stagger (respects reduced motion).
- **Money:** Quick-entry submit button gets a brief success pop (respects reduced motion).
- **Review — Money:** scatter empty state shows a three-step checklist (mood / habits / spending) and a primary **Log on Today** CTA; checklist pills jump to **Today**, **Habits**, or **Money**.

## [2.1.0] - 2026-11-03

Web 2.1.0 and Life Ledger for Mac 3.1.0. Bookkeeping (Goal 1) and overnight polish (Goal 2) ship in this release.

### Added

- **Bookkeeping (记账):** `state.ledger` (accounts, categories with icon/colour, transactions, budgets, recurring templates) in integer minor units + ISO currency; local save, cloud CAS payload, backup v3, demo sample, undoable delete. Sidebar **Money / 记账 / Finanzen** in all editions.
- **Quick entry:** natural-language field (`12,50 咖啡`, `-45 Miete gestern`, …), touch amount keypad, category chips, edit/duplicate/swipe-delete, opaque edit popover, recurring create/edit/delete with “Post now” and **Post all pending** (optional `recurringId` on generated rows).
- **Money views:** month overview, donut/treemap toggle (SVG annular + treemap), daily spend heatmap, uPlot trend, budget progress bars, search/filter, German CSV import/export (`;`, decimal comma, DD.MM.YYYY) with import confirm sheet.
- **Today — Spending today:** day/month totals with roll-up animation, 7-day mini sparkline, link to Money; mood pill (opens Review scatter), recurring **pending** pill (opens ledger due banner); first-visit syntax hint; quieter copy when history exists but today is zero.
- **Monthly review — Money panel:** spending summary; mood-, habit-, and focus-vs-spend scatters with hover/focus readout and keyboard roving; budget overspend list with optional mood correlation; habit spark `<title>` tooltips; wide three-column scatter grid; mobile jump chips + scroll-spy; collapsed **Detailed metrics** preview chips.
- **Integrations:** recurring-due accent on **Money** (current month), **Today** card, and **Review** summary (current review month only); ledger save refreshes Today widgets.
- **Sample workspace:** ~90 days EUR transactions, category budgets, recurring templates; demo aligns mood/habit/focus for insight copy.
- **Goal 2 polish:** Today hero daypart ambience, reflection streak on timeline, habit/review/ledger motion (`LifeLedgerInteraction` roll + retarget), shared `ll-empty-enter` empty art, settings/import dialog enter, long-range/week/habits stagger — styles consolidated in `v210.css` (formerly `v211`–`v232` slices).
- **QA:** ledger parsing/totals/CSV/backup/cloud-merge unit tests; Playwright `npm run test:browser` (17 suites) including fakecloud conflict/preview; `.overnight/fakecloud.sh` for offline Pages stand-in.

### Changed

- Mood-vs-spend logic lives in testable `ledger-core.js` helpers; quick-entry field is not wrapped in `<label>` (Add stays outside; WebKit-safe pickers elsewhere).
- **Money desktop shortcuts:** **N** quick entry, **/** search, **← / →** month (Mac menu month step includes Money).
- Timeline calendar photo skeleton; mobile ledger keypad clearance; week insight pulse; README EN/ZH/DE showcase adds Money (`08-ledger-v21`) desktop/mobile rows; `.overnight/CSS-LAYERS.md` documents CSS slices.
- Release metadata, PWA cache, and asset `?v=` markers aligned to **2.1.0** / Mac **3.1.0**.
- **Today — Spending today:** when today has expenses, the card shows the largest category chip and an entry count in the caption; a **vs yesterday** line compares default-currency spend (+/−% or “about the same”); brand-new ledgers get a subtle € side marker on empty days; German recurring pills use occurrence wording (**offene Posten**).
- **Week — Insights:** fifth tile shows **week spending** (Mon–today for the selected week, reporting currency); tap opens **Money** on that week’s month; a caption compares the same weekday span to **last week** (+/−% or “about the same”). The **focus time** tile adds a caption for days with journal notes or mood reasons vs the same span **last week** (day count). The **completion rate** tile adds a caption comparing habit completion **percentage points** vs the same span **last week**.
- **Review — Money summary:** spending stat includes a caption comparing the same calendar days to **last month** (+/−% or “about the same”).
- **Spending compare copy:** increases cap at **+999%**; when the prior period baseline is under **€15**, captions show a **money delta** (e.g. demo coffee → rent reads **较昨日多 €947…** instead of +2000%).
- **Demo habits:** fictional sample data stores starter habit names in the active UI language (zh/de/en) while custom renames stay untouched.
- **Week insights:** switching workspace weeks rolls completion rate, spending, streak, and focus minutes (same motion as Today spending totals).
- **Journal / review empty states:** timeline feed uses **`ll-paint-host`** skeleton while photos load; feed / calendar list / review inspector empties get consistent **`ll-empty`** styling.
- **Journal filter / habits empty:** weekly/monthly feed filters no longer flash skeleton; daily filter keeps prior feed visible while photos reload; habit filter miss + review habit compare empty use **`ll-empty`** polish.
- **Today insights:** rolling 30-day **习惯完成度 × 支出** caption under foundations (link to Review); **心情 × 支出** caption under the mood card (link to Review mood scatter); daily journal filter adds **stale shimmer veil** and clears **`ll-paint-host--stale`** when photos finish.
- **Spending compare copy:** when the prior period baseline is **≥ €15** but spend rose by more than **500%**, captions show a **money delta** (e.g. €20 → €500 reads **较昨日多 480,00 €** instead of **+999%**).
- **Backup restore:** removed redundant explicit-language branch in `syncBackupPreferencesToRuntime` (same behaviour as cold start).
- **Long-range (Horizon):** empty phase and plan grids use hairline art, enter animation, and **Start your first phase** CTA; sidebar adds subtle dividers before Timeline and Money.
- **Habits library:** zero-habit empty state uses centered hairline art with **Add your first habit** CTA (filters and stats hidden until the first habit exists); filter/search miss shows horizontal **search-empty** quiet card; Today hero quote block gets a short copy stagger on enter (today only).
- **Timeline journal feed:** empty daily/weekly/monthly lists use polished hairline art with primary CTAs (**Write today's reflection**, **Open this week**, **Open monthly review**); month filter with no rows shows a quiet **search-empty** strip; Today card grid gets tighter gap rhythm and a light desktop hover lift (respects reduced motion).
- **Week & Review empty states:** empty weekly goals, blank weekly reflection, and long-term goals on the Week page use hairline art with **Add your first weekly goal**, **Start weekly reflection**, and **Add a long-term goal** CTAs; Review shows matching CTAs for empty habit scores, metrics, inspector table, and blank monthly reflection (**Add habits**, **Check in on Today**, **Start writing**).
- **Today widget library:** first visit to Today shows a dismissible hint above **Edit cards** (widget library shortcut); entering edit mode dismisses it. **Today — Edit cards:** tapping **Done** after reordering plays a short success pulse on the edit bar and **Edit cards** button (respects reduced motion). **Review — Money:** when the month has spending but scatter charts need more mood/habit/focus days, a quiet empty card points to **Log on Today** (fixed gate on negative `expenseMinor`). **Timeline — Calendar:** empty month shows hairline art with **Write today's reflection**; sidebar entry list adds the same CTA or a filter-miss quiet strip (unique CTA ids so calendar buttons work when the sidebar is hidden).
- **QA:** Playwright suite runs serially (`--test-concurrency=1`) with deconflicted static-server ports; **389** unit + **39** browser checks at release.

### Fixed

- **Weekly recurring pending:** fixed templates stay on the due list until each ISO week in the calendar month has a matching entry (legacy rows without `recurringId` only clear their week); **Post all pending** books every past occurrence in the month for weekly cadence.
- **Recurring due counts:** Today pill, Money banner, and Review strip now count **unposted occurrences** (remaining weekly dates in the month), not just template rows.
- **Voice hints:** built-in habit names in voice context terms follow the active UI language via `displayHabitName`.
- **CSV:** semicolon tokenizer preserves empty cells (`;;`); skips `Buchungstag` header rows; quoted amounts and trailing-minus parsing; export uses active UI language for categories and explicit `currency` column.
- **Sync & backup:** Tencent/Cloudflare merge keeps local ledger when remote lacks it; conflict recovery merges ledger; export/import v3 round-trip and budget dedupe by `(month, categoryId)`.
- **Money UI:** default-currency-only summaries; edit invalid amount surfaces error; popovers dismiss on backdrop/Escape; swipe-delete ignores vertical scroll; category repair for localized default names; donut/treemap counts default currency only.
- **Review:** habit score inspector visible on unified monthly page; hidden `#inspectorReviewTable` skips DOM work when collapsed; `is-entering` stagger attaches to view roots (Today/Timeline/Review/Long-range).
- **Today:** focus tab reachable again; spending card TDZ when ledger empty; language preference on first paint; cloud first-pull re-uploads layout/profile when needed.
- **Spending compare captions:** Today / Week / Review temporal spend hints (vs yesterday, last week, last month) compute ±% against the **previous** period baseline, so large drops no longer show inflated percentages (e.g. €100 → €10 reads **−90%**, not −900%).
- **QA:** Playwright suites use dedicated ports **5271–5275** (no parallel flake); deploy test writes manifests to temp dir.
- **Assets:** `pages-polish.css` / `pages-art.js` wired in shell; cascade order keeps consolidated polish winning.
- **`spend-compare-mac-shell.browser.test.mjs`:** locks Today **amount caption** when yesterday’s baseline is under €15, Mac shell **Week / Review / Today** spend hints without four-digit +% inflation (Today includes demo **habit + mood** insight lines), and **Week insights** metric roll when changing workspace week.
- **`fakecloud-preview-ledger.browser.test.mjs`:** after demo cloud sync, **本周** spend hint stays readable (no four-digit +%); **复盘** `#reviewLedgerSpendHint` same check.
- **`journal-feed-paint.browser.test.mjs`:** timeline feed paint host reaches **ready** without leaving skeleton markup.
- **`journal-feed-filter.browser.test.mjs`:** weekly timeline month filter stays **ready** without feed skeleton; daily filter clears **stale** veil when ready.
- **`today-habit-spend-hint.test.mjs`:** Today foundations habit × spend insight wiring + journal stale veil cleanup.
- **`today-habit-spend-hint.browser.test.mjs`:** demo Today **habit + mood** spend hints visible and review links work (Chromium + WebKit).
- **`fakecloud-online.browser.test.mjs`:** clears storage and waits for **cloud** save mode before asserting conflict UI stays hidden (parallel suite stability).
- **Review — Money scatter empty:** empty-state gate used `expenseMinor > 0` but expenses are negative minor units; corrected to **`expenseMinor < 0`** so the CTA appears when data is thin.
- **Timeline — Calendar CTA:** calendar and sidebar empty buttons no longer share one `id`; calendar **Write today's reflection** works when the sidebar is hidden.
- **Suite size:** `npm test` **389** unit checks; `npm run test:browser` **39** Playwright cases (Chromium + WebKit, serial **529x** ports).

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
