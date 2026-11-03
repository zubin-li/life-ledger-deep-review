import { readFileSync } from "node:fs";
import test from "node:test";
import assert from "node:assert/strict";

// Owner feedback 2026-11-03: "近30天…平均支出" text hints on Today / Week / journal feed are noise. Keep them gone;
// the mood/habit × spending relationship lives only in Review's scatter charts.
test("no 30-day average-spend text hints outside Review", () => {
  const html = readFileSync(new URL("../public/index.html", import.meta.url), "utf8");
  const app = readFileSync(new URL("../public/app.js", import.meta.url), "utf8");
  for (const id of ["todayMoodSpendHint", "todayHabitSpendHint", "weekHabitSpendHint"]) assert.doesNotMatch(html + app, new RegExp(id));
  assert.doesNotMatch(app, /近 30 天：(心情较好|习惯完成较高)日平均支出/);
  assert.match(app, /review-scatter-habit/);
});
