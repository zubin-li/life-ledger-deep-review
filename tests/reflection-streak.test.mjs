import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const code = fs.readFileSync(new URL("../public/habit-analytics.js", import.meta.url), "utf8");
const root = {};
vm.runInNewContext(code, { window: root, globalThis: root });
const { reflectionStreak } = root.LifeLedgerAnalytics;

test("reflectionStreak counts consecutive days with note or mood reason", () => {
  const logs = {
    "2026-11-02": { note: "today" },
    "2026-11-01": { moodReason: " calm " },
    "2026-10-31": { note: "older" },
    "2026-10-30": {},
  };
  assert.equal(reflectionStreak(logs, "2026-11-02"), 3);
  assert.equal(reflectionStreak(logs, "2026-10-31"), 1);
  assert.equal(reflectionStreak(logs, "2026-10-29"), 0);
});

test("reflectionStreak stops at first gap", () => {
  const logs = {
    "2026-11-02": {},
    "2026-11-01": { note: "yesterday" },
  };
  assert.equal(reflectionStreak(logs, "2026-11-02"), 0);
});
