import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

test("rollWeekInsightValues rolls all week KPI value ids", () => {
  const app = fs.readFileSync(new URL("../public/app.js", import.meta.url), "utf8");
  const block = app.match(/function rollWeekInsightValues\(\) \{[\s\S]*?\n\}/)?.[0] || "";
  assert.match(block, /weekCompletionRate/);
  assert.match(block, /weekBestDay/);
  assert.match(block, /weekSpendingValue/);
  assert.match(block, /weekStreak/);
  assert.match(block, /weekFocusMinutes/);
  assert.match(block, /rollText/);
});
