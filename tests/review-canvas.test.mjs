import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const index = await readFile(new URL("../public/index.html", import.meta.url), "utf8");
const app = await readFile(new URL("../public/app.js", import.meta.url), "utf8");

test("no generated review canvas: week and month reflections are only what you write (user 10/27)", () => {
  assert.doesNotMatch(index, /reviewCanvasDialog|openWeeklyReviewCanvas|id="generateReview"/);
  assert.doesNotMatch(app, /buildLocalReviewDraft|openReviewCanvas|reviewCanvas/);
  // the week timeline reads the weekly reflection only, never the old generated drafts
  assert.match(app, /entries = Object\.keys\(state\.weeklyOutputs \|\| \{\}\)/);
  assert.doesNotMatch(app, /text:state\.weeklyReviews/);
  // old drafts stay in backups and sync so nothing is lost
  assert.match(app, /weeklyReviews: \{ \.\.\.\(current\.weeklyReviews/);
});

test("daily reminder entry lives in Habit Settings instead of the global toolbar", () => {
  assert.match(index, /id="habitReminderCard"/);
  assert.doesNotMatch(index, /id="reminderButton"/);
  assert.match(app, /\$\("#habitReminderCard"\)\.addEventListener/);
});
