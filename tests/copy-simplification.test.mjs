import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const html = readFileSync(new URL("../public/index.html", import.meta.url), "utf8");
const app = readFileSync(new URL("../public/app.js", import.meta.url), "utf8");

test("week and review introductions avoid repeated visible headings", () => {
  // Week page = approved 858ede8 design (module cards: review, completed, insights, goals).
  const weekView = html.match(/<section class="view week-board" id="weekView"[^>]*>([\s\S]*?)<section class="view[^"]*" id="longrangeView"[^>]*>/);
  assert.ok(weekView, "Week view is missing");
  assert.doesNotMatch(weekView[1], /weekly-writing-panel|weekly-classical-image/);
  assert.match(weekView[1], /data-module="completed"/);
  assert.match(weekView[1], /data-module="review"/);
  assert.match(weekView[1], /class="sr-only" id="weeklyWorkspaceTitle"/);

  const reviewIntro = html.match(/<div class="review-intro quiet-intro">([\s\S]*?)<\/div>/);
  assert.ok(reviewIntro);
  assert.doesNotMatch(reviewIntro[1], /review-year|class="kicker"|Monthly Review/);

  assert.match(app, /title: "\{year\}年\{month\}月"/);
  assert.match(app, /title: "\{monthName\} \{year\}"/);
});
