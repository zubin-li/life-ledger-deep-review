import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const index = await readFile(new URL("../public/index.html", import.meta.url), "utf8");
const app = await readFile(new URL("../public/app.js", import.meta.url), "utf8");

test("weekly and monthly reviews open one local evidence canvas", () => {
  assert.match(index, /id="reviewCanvasDialog"/);
  assert.match(index, /id="openWeeklyReviewCanvas"/);
  assert.match(index, /data-review-scope="week"/);
  assert.match(index, /data-review-scope="month"/);
  assert.match(app, /function reviewEvidence\(/);
  assert.match(app, /function buildLocalReviewDraft\(/);
});

test("weekly review drafts are stored separately from weekly output", () => {
  assert.match(app, /weeklyReviews: \{\}/);
  assert.match(app, /reviewCanvasScope === "week" \? state\.weeklyReviews : state\.reviews/);
  assert.match(app, /weeklyReviews: \{ \.\.\.\(current\.weeklyReviews/);
});

test("daily reminder entry lives in Habit Settings instead of the global toolbar", () => {
  assert.match(index, /id="habitReminderCard"/);
  assert.doesNotMatch(index, /id="reminderButton"/);
  assert.match(app, /\$\("#habitReminderCard"\)\.addEventListener/);
});
