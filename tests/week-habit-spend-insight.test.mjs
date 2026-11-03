import { readFileSync } from "node:fs";
import test from "node:test";
import assert from "node:assert/strict";

test("week page wires habit×spend insight chip", () => {
  const html = readFileSync(new URL("../public/index.html", import.meta.url), "utf8");
  assert.match(html, /id="weekHabitSpendHint"/);
  const app = readFileSync(new URL("../public/app.js", import.meta.url), "utf8");
  assert.match(app, /function renderWeekHabitSpendHint\(/);
  assert.match(app, /renderWeekHabitSpendHint\(weekOffset\)/);
  assert.match(app, /week-page-spend-link/);
  assert.match(app, /review-scatter-habit/);
  const css = readFileSync(new URL("../public/v210.css", import.meta.url), "utf8");
  assert.match(css, /Batch 11 r9 — Week header habit×spend insight/);
  assert.match(css, /\.week-page-spend-insight/);
});
