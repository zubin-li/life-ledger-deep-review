import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const app = readFileSync(new URL("../public/app.js", import.meta.url), "utf8");
const html = readFileSync(new URL("../public/index.html", import.meta.url), "utf8");

test("week insights focus tile shows journal days vs last week", () => {
  assert.match(html, /id="weekJournalHint"/);
  assert.match(app, /journalEntryDaysInRange/);
  assert.match(app, /alignedWeekJournalCompare/);
  assert.match(app, /week\.journalDaysMany/);
  assert.match(app, /week\.journalMorePeriod/);
  assert.match(app, /weekJournalHint/);
});

test("week insights empty art treats journal days as activity", () => {
  assert.match(app, /journalDays\s*>\s*0/);
});
