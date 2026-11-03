import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const app = readFileSync(new URL("../public/app.js", import.meta.url), "utf8");
const html = readFileSync(new URL("../public/index.html", import.meta.url), "utf8");
const ledgerUi = readFileSync(new URL("../public/ledger-ui.js", import.meta.url), "utf8");

test("week insights grid includes spending tile wired to Money", () => {
  assert.match(html, /id="weekSpendingCard"/);
  assert.match(html, /id="weekSpendingValue"/);
  assert.match(html, /id="weekSpendingHint"/);
  assert.match(app, /rangeSummary/);
  assert.match(app, /alignedWeekSpendCompare/);
  assert.match(app, /setViewMonth/);
  assert.match(app, /weekSpendingCard/);
  assert.match(app, /switchToView\("ledger"\)/);
  assert.match(app, /week\.spending/);
  assert.match(app, /week\.spendingMorePeriod/);
  assert.match(ledgerUi, /setViewMonth\(ym\)/);
});

test("week insights empty art treats spending as activity", () => {
  assert.match(app, /weekExpenseTotal\s*>\s*0/);
});
