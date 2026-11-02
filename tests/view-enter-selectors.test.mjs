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
