import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

test("v210 view enter stagger targets the active view element (not a phantom ancestor)", () => {
  const css = fs.readFileSync(new URL("../public/v210.css", import.meta.url), "utf8");
  assert.doesNotMatch(css, /\.view\.is-entering #todayView/);
  assert.doesNotMatch(css, /\.view\.is-entering #timelineView/);
  assert.doesNotMatch(css, /\.view\.is-entering #longrangeView/);
  assert.match(css, /#todayView\.view\.is-entering/);
  assert.match(css, /#timelineView\.view\.is-entering/);
  assert.match(css, /#longrangeView\.view\.is-entering/);
  assert.match(css, /Batch 5 round 2 — Today hero \+ daily tool enter stagger/);
  assert.match(css, /#reviewView\.view\.is-entering/);
  assert.match(css, /Batch 5 round 3 — review enter stagger/);
  assert.match(css, /#habitsView\.view\.is-entering/);
  assert.match(css, /Batch 5 round 4 — habits \+ week enter stagger/);
  assert.match(css, /#weekView\.view\.is-entering #weekCalendar \.week-calendar-day/);
  assert.match(css, /Batch 5 round 5 — timeline feed mode switch \+ photo library enter/);
  assert.match(css, /#journalFeedPane\.is-mode-entering/);
  assert.match(css, /#journalPhotoLibrary\.journal-library--ready/);
  assert.match(css, /Batch 5 round 6 — calendar enter, feed filter\/load-more/);
  assert.match(css, /#timelineView\.is-calendar-entering/);
  assert.match(css, /#journalFeedPane\.is-filter-entering/);
  assert.match(css, /journal-feed-entry--append/);
});

test("Batch 5 round 7 review metric motion and Today edit saved feedback", () => {
  const css = fs.readFileSync(new URL("../public/v210.css", import.meta.url), "utf8");
  const app = fs.readFileSync(new URL("../public/app.js", import.meta.url), "utf8");
  const cards = fs.readFileSync(new URL("../public/today-cards.js", import.meta.url), "utf8");
  assert.match(css, /Batch 5 round 7 — review month\/metric motion/);
  assert.match(css, /#reviewInsights \.rv-metrics\.is-retargeting/);
  assert.match(css, /#weeklyResistance \.analytics-chart\.is-retargeting/);
  assert.match(css, /\.tc-bar\.is-saved/);
  assert.match(app, /pulseReviewInsightMotion/);
  assert.match(app, /pulsePeriodicAnalyticsChart/);
  assert.match(cards, /pulseEditSaved/);
  assert.match(cards, /tc-drop-success/);
});

test("Batch 5 round 8 shell nav, week modules, ledger month, scatter spotlight", () => {
  const css = fs.readFileSync(new URL("../public/v210.css", import.meta.url), "utf8");
  const app = fs.readFileSync(new URL("../public/app.js", import.meta.url), "utf8");
  const ledgerUi = fs.readFileSync(new URL("../public/ledger-ui.js", import.meta.url), "utf8");
  assert.match(css, /Batch 5 round 8 — shell nav, week modules, ledger month, scatter spotlight/);
  assert.match(css, /#viewTitle\.is-view-switch/);
  assert.match(css, /#weekView\.view\.is-entering \.module-card/);
  assert.match(css, /#ledgerView \.ledger-summary\.is-retargeting/);
  assert.match(css, /\.is-scatter-spotlight/);
  assert.match(app, /pulseShellNav/);
  assert.match(app, /pulseWeekWorkspaceMotion/);
  assert.match(app, /spotlightReviewScatterSection/);
  assert.match(ledgerUi, /pulseLedgerMonthMotion/);
});

test("Batch 5 round 9 settings backup dialog motion and Today hero rhythm", () => {
  const css = fs.readFileSync(new URL("../public/v210.css", import.meta.url), "utf8");
  const app = fs.readFileSync(new URL("../public/app.js", import.meta.url), "utf8");
  assert.match(css, /Batch 5 round 9 — settings \/ backup dialogs, Today rhythm, scatter a11y/);
  assert.match(css, /#todayView\.tc-grid\.active:not\(\.tc-editing\) > \.tc-top/);
  assert.match(css, /\.is-modal-enter/);
  assert.match(css, /\.is-scatter-spotlight-static/);
  assert.match(app, /pulseModalDialog/);
  assert.match(app, /pulseBackupTabSwitch/);
  assert.match(app, /review-scatter-live/);
});

test("short viewport ledger keypad docks fixed while quick field focused", () => {
  const css = fs.readFileSync(new URL("../public/v210.css", import.meta.url), "utf8");
  assert.match(css, /Batch 5 round 3 — dock keypad/);
  assert.match(css, /#ledgerView \.ledger-quick:focus-within ~ \.ledger-keypad/);
  assert.match(css, /position:\s*fixed/);
});

test("focus inline timer exposes running state for CSS micro-interaction", () => {
  const app = fs.readFileSync(new URL("../public/app.js", import.meta.url), "utf8");
  assert.match(app, /inlineTimer\?\.classList\.toggle\("is-running"/);
  assert.match(app, /inlineTimer\?\.classList\.toggle\("is-break"/);
});

test("Batch 6 round 9 review scatter keyboard roving focus", () => {
  const css = fs.readFileSync(new URL("../public/v210.css", import.meta.url), "utf8");
  const app = fs.readFileSync(new URL("../public/app.js", import.meta.url), "utf8");
  const core = fs.readFileSync(new URL("../public/ledger-core.js", import.meta.url), "utf8");
  assert.match(css, /Batch 6 round 8 — review scatter dot readout/);
  assert.match(css, /\.review-scatter-dot-hit:focus-visible \+ circle/);
  assert.match(app, /_scatterTipFocus/);
  assert.match(app, /focusScatterDot/);
  assert.match(core, /tabindex="\$\{tab\}"/);
});

test("Batch 12 r1 — Money wellness mini scatters + shared daily rows", () => {
  const css = fs.readFileSync(new URL("../public/v210.css", import.meta.url), "utf8");
  const app = fs.readFileSync(new URL("../public/app.js", import.meta.url), "utf8");
  const ledgerUi = fs.readFileSync(new URL("../public/ledger-ui.js", import.meta.url), "utf8");
  assert.match(css, /Batch 12 r1 — Money page mood\/habit mini scatter correlations/);
  assert.match(css, /\.ledger-wellness-insights/);
  assert.match(app, /function buildLedgerMonthDailyRows/);
  assert.match(app, /openReviewScatterForMonth/);
  assert.match(ledgerUi, /renderWellnessInsights/);
  assert.match(ledgerUi, /data-ledger-review-scatter/);
});

test("Batch 12 r3 — Money wellness scatter empty checklist", () => {
  const css = fs.readFileSync(new URL("../public/v210.css", import.meta.url), "utf8");
  const ledgerUi = fs.readFileSync(new URL("../public/ledger-ui.js", import.meta.url), "utf8");
  const app = fs.readFileSync(new URL("../public/app.js", import.meta.url), "utf8");
  assert.match(css, /Batch 12 r3 — Money wellness scatter empty/);
  assert.match(css, /#ledgerView \.ledger-wellness-empty/);
  assert.match(ledgerUi, /ledgerWellnessEmptyHint/);
  assert.match(ledgerUi, /renderWellnessEmptyBlock/);
  assert.match(app, /switchView: switchToView/);
});

test("Batch 12 r4 — Money section polished empties", () => {
  const css = fs.readFileSync(new URL("../public/v210.css", import.meta.url), "utf8");
  const ledgerUi = fs.readFileSync(new URL("../public/ledger-ui.js", import.meta.url), "utf8");
  assert.match(css, /Batch 12 r4 — Money polished section empties/);
  assert.match(css, /#ledgerView \.ledger-list-empty\.ll-polished/);
  assert.match(ledgerUi, /ledgerPolishedEmpty/);
  assert.match(ledgerUi, /ledgerListEmptyQuick/);
  assert.match(ledgerUi, /focusLedgerQuickEntry/);
});

test("Batch 12 r5 — Money category chart filters list", () => {
  const css = fs.readFileSync(new URL("../public/v210.css", import.meta.url), "utf8");
  const ledgerUi = fs.readFileSync(new URL("../public/ledger-ui.js", import.meta.url), "utf8");
  const core = fs.readFileSync(new URL("../public/ledger-core.js", import.meta.url), "utf8");
  assert.match(css, /Batch 12 r5 — Money category chart filters transaction list/);
  assert.match(css, /\.ledger-cat-seg/);
  assert.match(ledgerUi, /bindCategoryVizFilter/);
  assert.match(ledgerUi, /listCategoryFilter/);
  assert.match(ledgerUi, /ledger-category-filter-chip/);
  assert.match(core, /function filterTransactions\(ledger, ym, query, dayIso, categoryId\)/);
});

test("Batch 12 r6 — Money filtered list subtotal strip", () => {
  const css = fs.readFileSync(new URL("../public/v210.css", import.meta.url), "utf8");
  const ledgerUi = fs.readFileSync(new URL("../public/ledger-ui.js", import.meta.url), "utf8");
  const core = fs.readFileSync(new URL("../public/ledger-core.js", import.meta.url), "utf8");
  assert.match(css, /Batch 12 r6 — Money filtered list subtotal strip/);
  assert.match(css, /\.ledger-list-filter-sum/);
  assert.match(ledgerUi, /renderListFilterSummary/);
  assert.match(ledgerUi, /clearAllListFilters/);
  assert.match(ledgerUi, /data-ledger-clear-all-filters/);
  assert.match(core, /function summarizeTransactions\(ledger, transactions\)/);
});

test("Batch 12 r7 — Money Escape clears filters and split subtotal", () => {
  const css = fs.readFileSync(new URL("../public/v210.css", import.meta.url), "utf8");
  const ledgerUi = fs.readFileSync(new URL("../public/ledger-ui.js", import.meta.url), "utf8");
  assert.match(css, /\.ledger-list-filter-sum-split/);
  assert.match(css, /\.ledger-list-filter-sum-in/);
  assert.match(ledgerUi, /ledger-list-filter-sum-split/);
  assert.match(ledgerUi, /event\.key === "Escape"/);
  assert.match(ledgerUi, /listFiltersActive\(\)/);
});

test("Batch 12 r8 — Today spending opens Money with day filter", () => {
  const css = fs.readFileSync(new URL("../public/v210.css", import.meta.url), "utf8");
  const ledgerUi = fs.readFileSync(new URL("../public/ledger-ui.js", import.meta.url), "utf8");
  const widgets = fs.readFileSync(new URL("../public/today-widgets.js", import.meta.url), "utf8");
  assert.match(css, /Batch 12 r8 — Today spending card → Money day filter/);
  assert.match(css, /\.ledger-list-wrap\.is-spotlight/);
  assert.match(ledgerUi, /function openToDay\(/);
  assert.match(ledgerUi, /openToDay,/);
  assert.match(widgets, /openLedgerForPlanningDay/);
  assert.match(widgets, /openToDay\?\.\(selectedPlanningDate\)/);
  assert.match(widgets, /button type="button" class="tw-spend-today"/);
});

test("Batch 12 r9 — Review Money stats open ledger month", () => {
  const css = fs.readFileSync(new URL("../public/v210.css", import.meta.url), "utf8");
  const ledgerUi = fs.readFileSync(new URL("../public/ledger-ui.js", import.meta.url), "utf8");
  const app = fs.readFileSync(new URL("../public/app.js", import.meta.url), "utf8");
  assert.match(css, /Batch 12 r9 — Review Money stats open ledger month/);
  assert.match(css, /button\.review-ledger-stat-btn/);
  assert.match(ledgerUi, /function openToMonth\(/);
  assert.match(ledgerUi, /openToMonth,/);
  assert.match(app, /function openLedgerForReviewMonth\(/);
  assert.match(app, /review-ledger-stat-btn/);
  assert.match(app, /data-open-ledger-month/);
});

test("Batch 13 r1 — Money sample entry onboarding", () => {
  const css = fs.readFileSync(new URL("../public/v210.css", import.meta.url), "utf8");
  const ledgerUi = fs.readFileSync(new URL("../public/ledger-ui.js", import.meta.url), "utf8");
  const core = fs.readFileSync(new URL("../public/ledger-core.js", import.meta.url), "utf8");
  assert.match(css, /Batch 13 r1 — Money first-entry sample/);
  assert.match(ledgerUi, /data-ledger-sample-entry/);
  assert.match(ledgerUi, /function postSampleEntry\(/);
  assert.match(core, /SPEND_COMPARE_AMOUNT_DELTA_MINOR/);
});

test("Batch 13 r2 — journal autosave pulse + mood pick polish", () => {
  const css = fs.readFileSync(new URL("../public/v210.css", import.meta.url), "utf8");
  const app = fs.readFileSync(new URL("../public/app.js", import.meta.url), "utf8");
  const widgets = fs.readFileSync(new URL("../public/today-widgets.js", import.meta.url), "utf8");
  assert.match(css, /Batch 13 r2 — journal autosave pulse/);
  assert.match(app, /function pulseHomeJournalSaved\(/);
  assert.match(app, /function pulseMoodButton\(/);
  assert.match(widgets, /dataset\.spendCompare/);
});

test("Batch 13 r3 — CSV import preview, drag-drop, import pulse", () => {
  const css = fs.readFileSync(new URL("../public/v210.css", import.meta.url), "utf8");
  const ledgerUi = fs.readFileSync(new URL("../public/ledger-ui.js", import.meta.url), "utf8");
  const core = fs.readFileSync(new URL("../public/ledger-core.js", import.meta.url), "utf8");
  const html = fs.readFileSync(new URL("../public/index.html", import.meta.url), "utf8");
  assert.match(css, /Batch 13 r3 — CSV import preview/);
  assert.match(ledgerUi, /function renderCsvImportPreview\(/);
  assert.match(ledgerUi, /function bindLedgerCsvDrop\(/);
  assert.match(ledgerUi, /ledgerImportPulse/);
  assert.match(core, /samples\.push/);
  assert.match(html, /ledgerCsvDropHint/);
});

test("Batch 13 r4 — habit check pulse + weekly goal toggle polish", () => {
  const css = fs.readFileSync(new URL("../public/v210.css", import.meta.url), "utf8");
  const app = fs.readFileSync(new URL("../public/app.js", import.meta.url), "utf8");
  assert.match(css, /Batch 13 r4 — habit check pulse/);
  assert.match(app, /function applyHabitCardPulse\(/);
  assert.match(app, /function pulseProgressOrbit\(/);
  assert.match(app, /function pulseWeeklyGoalRow\(/);
});

test("Batch 13 r5 — all habits celebration + review stat press", () => {
  const css = fs.readFileSync(new URL("../public/v210.css", import.meta.url), "utf8");
  const app = fs.readFileSync(new URL("../public/app.js", import.meta.url), "utf8");
  assert.match(css, /Batch 13 r5 — all habits celebration/);
  assert.match(app, /function pulseAllCompleteOrbit\(/);
  assert.match(app, /function pulseReviewLedgerStatBtn\(/);
  assert.match(css, /is-all-complete-orbit/);
  assert.match(css, /is-stat-press/);
});

test("Batch 13 r6 — global M shortcut, kbd hints, long-press edit, review open press", () => {
  const css = fs.readFileSync(new URL("../public/v210.css", import.meta.url), "utf8");
  const app = fs.readFileSync(new URL("../public/app.js", import.meta.url), "utf8");
  const ledgerUi = fs.readFileSync(new URL("../public/ledger-ui.js", import.meta.url), "utf8");
  assert.match(css, /Batch 13 r6 — global M shortcut hints/);
  assert.match(app, /function bindGlobalKeyboardShortcuts\(/);
  assert.match(app, /LifeLedgerLedgerUI\?\.focusQuickEntry/);
  assert.match(ledgerUi, /function bindTouchRowGestures\(/);
  assert.match(ledgerUi, /function focusQuickEntry\(/);
  assert.match(ledgerUi, /ledger-kbd-hints--menu/);
  assert.match(css, /is-long-press-hint/);
  assert.match(css, /button\.text-button\[data-open-ledger\]\.is-stat-press/);
});

test("Batch 13 r7 — scatter jump chip press + Mac View Money menu", () => {
  const css = fs.readFileSync(new URL("../public/v210.css", import.meta.url), "utf8");
  const app = fs.readFileSync(new URL("../public/app.js", import.meta.url), "utf8");
  const libRs = fs.readFileSync(new URL("../src-tauri/src/lib.rs", import.meta.url), "utf8");
  assert.match(css, /Batch 13 r7 — review scatter jump chip press/);
  assert.match(app, /function pulseReviewScatterJumpChip\(/);
  assert.match(css, /is-jump-press/);
  assert.match(libRs, /item\("view_ledger", Some\("CmdOrCtrl\+5"\)/);
  assert.match(libRs, /item\("view_habits", Some\("CmdOrCtrl\+7"\)/);
  assert.match(libRs, /"view_ledger" => Some\("view:ledger"\)/);
});

test("Batch 13 r8 — sidebar nav press + ledger category chip press", () => {
  const css = fs.readFileSync(new URL("../public/v210.css", import.meta.url), "utf8");
  const app = fs.readFileSync(new URL("../public/app.js", import.meta.url), "utf8");
  const ledgerUi = fs.readFileSync(new URL("../public/ledger-ui.js", import.meta.url), "utf8");
  assert.match(css, /Batch 13 r8 — sidebar nav press/);
  assert.match(app, /function pulseNavItemPress\(/);
  assert.match(ledgerUi, /function pulseLedgerCategoryChip\(/);
  assert.match(css, /is-nav-press/);
  assert.match(css, /is-chip-press/);
});

test("Batch 13 r9 — Today spending open + ledger chart / heat press", () => {
  const css = fs.readFileSync(new URL("../public/v210.css", import.meta.url), "utf8");
  const ledgerUi = fs.readFileSync(new URL("../public/ledger-ui.js", import.meta.url), "utf8");
  const todayWidgets = fs.readFileSync(new URL("../public/today-widgets.js", import.meta.url), "utf8");
  assert.match(css, /Batch 13 r9 — Today spending open/);
  assert.match(todayWidgets, /function pulseTodaySpendControl\(/);
  assert.match(ledgerUi, /function pulseLedgerChartMode\(/);
  assert.match(ledgerUi, /function pulseLedgerHeatDay\(/);
  assert.match(css, /is-spend-press/);
  assert.match(css, /is-mode-press/);
  assert.match(css, /is-heat-press/);
});

test("Owner feedback r1 — daily ledger shell + nav order", () => {
  const html = fs.readFileSync(new URL("../public/index.html", import.meta.url), "utf8");
  const ledgerUi = fs.readFileSync(new URL("../public/ledger-ui.js", import.meta.url), "utf8");
  const core = fs.readFileSync(new URL("../public/ledger-core.js", import.meta.url), "utf8");
  const navBlock = html.match(/<nav class="main-nav"[\s\S]*?<\/nav>/)[0];
  assert.ok(navBlock.indexOf('data-view="timeline"') < navBlock.indexOf('data-view="ledger"'));
  assert.ok(navBlock.indexOf('data-view="ledger"') < navBlock.indexOf('data-view="review"'));
  assert.match(ledgerUi, /renderStatsPanel/);
  assert.match(ledgerUi, /data-ledger-day-prev/);
  assert.match(ledgerUi, /renderSubscriptionList/);
  assert.match(core, /inferCategoryFromNote/);
  assert.match(core, /autoPostDueMonthlyRecurring/);
});
