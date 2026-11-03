import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const app = readFileSync(new URL("../public/app.js", import.meta.url), "utf8");
const html = readFileSync(new URL("../public/index.html", import.meta.url), "utf8");

test("week insights completion tile compares habit rate to last week", () => {
  assert.match(html, /id="weekCompletionHint"/);
  assert.match(app, /habitCompletionStatsInRange/);
  assert.match(app, /alignedWeekCompletionCompare/);
  assert.match(app, /week\.completionMorePeriod/);
  assert.match(app, /weekCompletionHint/);
});
