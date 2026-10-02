import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const html = readFileSync(new URL("../public/index.html", import.meta.url), "utf8");
const app = readFileSync(new URL("../public/app.js", import.meta.url), "utf8");

test("week and review introductions avoid repeated visible headings", () => {
  const weekView = html.match(/<section class="view" id="weekView">([\s\S]*?)<\/section>\s*<section class="view" id="timelineView">/);
  assert.ok(weekView, "Week view is missing");
  assert.doesNotMatch(weekView[1], /THIS WEEK|weekly-writing-panel|weekly-classical-image/);
  assert.match(weekView[1], /class="sr-only" id="weeklyWorkspaceTitle"/);
  assert.match(weekView[1], /id="weekAgenda"/);

  const reviewIntro = html.match(/<div class="review-intro quiet-intro">([\s\S]*?)<\/div>/);
  assert.ok(reviewIntro);
  assert.doesNotMatch(reviewIntro[1], /review-year|class="kicker"|Monthly Review/);

  assert.match(app, /title: "\{year\}年\{month\}月"/);
  assert.match(app, /title: "\{monthName\} \{year\}"/);
});
