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
