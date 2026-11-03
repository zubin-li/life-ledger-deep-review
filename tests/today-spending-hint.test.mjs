import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const widgets = readFileSync(new URL("../public/today-widgets.js", import.meta.url), "utf8");
const css = readFileSync(new URL("../public/today-cards.css", import.meta.url), "utf8");

test("Today spending hint hides once the ledger has any transaction", () => {
  assert.match(widgets, /ledgerHasEntries\s*=\s*Boolean\(ledger\?\.transactions\?\.length\)/);
  assert.match(widgets, /hint\.hidden\s*=\s*Boolean\(todayMinor\)\s*\|\|\s*ledgerHasEntries/);
});

test("Today spending card shows category hints up to three lines", () => {
  assert.match(widgets, /tw-spend-cats/);
  assert.match(widgets, /spendingCategoryHints/);
  assert.match(widgets, /\.slice\(0,\s*limit\)/);
});

test("Today spending card has quick entry and body opens Money", () => {
  assert.match(widgets, /tw-spend-quick/);
  assert.match(widgets, /tw-spend-body/);
  assert.match(widgets, /openLedgerForPlanningDay/);
  assert.match(widgets, /openTodayLedgerSheet/);
  assert.match(widgets, /spendingOpenDay/);
  assert.doesNotMatch(widgets, /tw-spend-compare/);
  assert.doesNotMatch(widgets, /tw-spend-mood-pill/);
  assert.doesNotMatch(widgets, /tw-spend-month/);
});

test("Today spending card styles live in today-cards.css", () => {
  assert.match(css, /\.tw-spend-total/);
  assert.match(css, /button\.tw-spend-quick/);
});
