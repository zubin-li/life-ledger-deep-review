import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const index = await readFile(new URL("../public/index.html", import.meta.url), "utf8");
const app = await readFile(new URL("../public/app.js", import.meta.url), "utf8");

test("today keeps focus controls inline and reports minutes rather than sessions", () => {
  const dailyToolStart = index.indexOf('class="daily-goals-card daily-tool-card"');
  const journalPanel = index.indexOf('id="journalToolPanel"');
  const focusPanel = index.indexOf('id="focusToolPanel"');
  assert.ok(dailyToolStart > 0);
  assert.ok(journalPanel > dailyToolStart);
  assert.ok(focusPanel > journalPanel);
  assert.match(index, /id="dailyToolViewport"/);
  assert.match(index, /data-daily-tool="journal"/);
  assert.match(index, /data-daily-tool="focus"/);
  assert.match(index, /id="focusMiniStatus"/);
  assert.match(index, /id="focusInlineTimer"/);
  assert.match(index, /id="focusQuickPrimary"/);
  assert.match(index, /id="focusTodayBreakdown"/);
  assert.match(index, /id="focusTodaySummary"/);
  assert.match(index, /id="focusCustomLabel"/);
  assert.doesNotMatch(index, /id="focusQuickLabel"/);
  assert.doesNotMatch(index, /id="focusPill"/);
  assert.doesNotMatch(index, /id="focusTodaySessions"/);
  assert.match(app, /focus\.todaySummary/);
  assert.match(app, /function setDailyToolPage\(/);
  assert.match(app, /syncDailyToolPageFromScroll/);
  assert.doesNotMatch(app, /focus\.sessionOrdinal/);
  assert.match(app, /defaultTopic/);
});

test("review uses focused-time analytics instead of duplicating weekly notes", () => {
  assert.match(index, /class="panel focus-review-panel"/);
  assert.match(index, /id="focusReviewBars"/);
  assert.doesNotMatch(index, /class="panel weekly-output-archive"/);
  assert.match(app, /function renderFocusReview\(/);
  assert.match(index, /id="focusReviewBreakdown"/);
  assert.match(index, /data-focus-review-scope="month"/);
  assert.match(index, /id="focusReviewMonthSelect"/);
  assert.match(app, /focus-heatmap-day/);
  assert.ok(index.indexOf('class="panel focus-review-panel"') < index.indexOf('class="review-grid"'));
});
