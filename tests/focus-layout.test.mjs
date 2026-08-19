import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const index = await readFile(new URL("../public/index.html", import.meta.url), "utf8");
const app = await readFile(new URL("../public/app.js", import.meta.url), "utf8");

test("today keeps focus controls inline with factual completed-session feedback", () => {
  assert.match(index, /id="focusInlineTimer"/);
  assert.match(index, /id="focusQuickPrimary"/);
  assert.match(index, /id="focusSessionSummary"/);
  assert.doesNotMatch(index, /id="focusPill"/);
  assert.doesNotMatch(index, /id="focusTodaySessions"/);
  assert.match(app, /session\.outcome === "completed"/);
  assert.match(app, /focus\.sessionOrdinal/);
});

test("review uses focused-time analytics instead of duplicating weekly notes", () => {
  assert.match(index, /class="panel focus-review-panel"/);
  assert.match(index, /id="focusReviewBars"/);
  assert.doesNotMatch(index, /class="panel weekly-output-archive"/);
  assert.match(app, /function renderFocusReview\(/);
});
