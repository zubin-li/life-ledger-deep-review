import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const html = readFileSync(new URL("../public/index.html", import.meta.url), "utf8");
const app = readFileSync(new URL("../public/app.js", import.meta.url), "utf8");

test("week and review introductions avoid repeated visible headings", () => {
  const weeklyHeading = html.match(/<div class="section-heading weekly-heading">([\s\S]*?)<\/div>\s*<article/);
  assert.ok(weeklyHeading);
  assert.doesNotMatch(weeklyHeading[1], /THIS WEEK/);
  assert.match(weeklyHeading[1], /class="sr-only" id="weeklyWorkspaceTitle"/);

  const reviewIntro = html.match(/<div class="review-intro quiet-intro">([\s\S]*?)<\/div>/);
  assert.ok(reviewIntro);
  assert.doesNotMatch(reviewIntro[1], /review-year|class="kicker"|Monthly Review/);

  assert.match(app, /title: "\{year\}年\{month\}月"/);
  assert.match(app, /title: "\{monthName\} \{year\}"/);
});
