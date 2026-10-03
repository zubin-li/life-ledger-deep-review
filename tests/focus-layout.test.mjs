import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const index = await readFile(new URL("../public/index.html", import.meta.url), "utf8");
const app = await readFile(new URL("../public/app.js", import.meta.url), "utf8");

test("today keeps focus controls inline in the inspector and reports minutes rather than sessions", () => {
  const inspectorFocus = index.match(/id="inspectorFocusSection"([\s\S]*?)<\/section>/);
  assert.ok(inspectorFocus, "inspector focus section is missing");
  assert.match(inspectorFocus[1], /id="inspectorFocusRow"/);
  assert.match(inspectorFocus[1], /id="focusInlineTime"/);
  assert.match(inspectorFocus[1], /id="focusInlineLabel"/);
  assert.match(inspectorFocus[1], /id="focusQuickPrimary"/);
  assert.match(inspectorFocus[1], /id="focusQuickPresets"/);
  assert.doesNotMatch(index, /id="focusQuickLabel"/);
  assert.doesNotMatch(index, /id="focusPill"/);
  assert.doesNotMatch(index, /id="focusTodaySessions"/);
  assert.doesNotMatch(index, /id="dailyToolViewport"/);
  assert.match(app, /focus\.todaySummary/);
  assert.match(app, /focusSessionMinutes/);
  assert.match(app, /setText\("#focusInlineTime"/);
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
