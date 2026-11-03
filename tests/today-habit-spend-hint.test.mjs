import { readFileSync } from "node:fs";
import test from "node:test";
import assert from "node:assert/strict";

test("Today foundations shows rolling habit × spend insight", () => {
  const app = readFileSync(new URL("../public/app.js", import.meta.url), "utf8");
  assert.match(app, /function renderTodayHabitSpendHint\(/);
  assert.match(app, /function spendInsightDailyRows\(/);
  assert.match(app, /renderTodayHabitSpendHint\(viewingToday, future\)/);
  assert.match(app, /habitCompletionSpendInsight/);
});

test("Today habit spend hint markup and i18n", () => {
  const html = readFileSync(new URL("../public/index.html", import.meta.url), "utf8");
  assert.match(html, /id="todayHabitSpendHint"/);
  const app = readFileSync(new URL("../public/app.js", import.meta.url), "utf8");
  assert.match(app, /foundations\.habitSpendReview/);
  assert.match(app, /habitSpendReview: "复盘里看支出关联 →"/);
  assert.match(app, /habitSpendReview: "See spending links in Review →"/);
  assert.match(app, /habitSpendReview: "Ausgaben-Zusammenhänge im Rückblick →"/);
});

test("journal stale feed clears veil when ready", () => {
  const app = readFileSync(new URL("../public/app.js", import.meta.url), "utf8");
  const block = app.slice(app.indexOf("async function renderJournalFeed"), app.indexOf("function journalTextMarkup"));
  assert.match(block, /ll-stale-veil/);
  assert.match(block, /classList\.remove\('ll-paint-host--stale'\)/);
});
