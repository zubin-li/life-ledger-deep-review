import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const widgets = readFileSync(new URL("../public/today-widgets.js", import.meta.url), "utf8");

test("Slice 1 — Today spending card is total + top 3 categories; the card opens the sheet", () => {
  assert.match(widgets, /class="tw-spend-amount"/);
  assert.match(widgets, /categoryBreakdownRange\(ledger, today, today\)\.slice\(0, 3\)/);
  assert.match(widgets, /class="tw-spend-cats"/);
  assert.match(widgets, /wireHit\(cards\.spending, openTodayLedgerSheet\)/);
  assert.doesNotMatch(widgets, /tw-spend-add|tw-spend-mood-pill|tw-spend-recurring-pill|tw-spend-compare|tw-spend-sparkline/);
});

test("Today spending empty state is quiet once the ledger has any transaction", () => {
  const decl = widgets.indexOf("const ledgerHasEntries = Boolean(ledger?.transactions?.length)");
  assert.ok(decl > 0, "ledgerHasEntries declared in spending()");
  assert.match(widgets, /showSpendEmptyEnter = !todayMinor && !ledgerHasEntries/);
});

test("Today spending header link opens Money filtered to the planning day", () => {
  assert.match(widgets, /\.tw-spend-open", cards\.spending\)\.addEventListener\("click", openLedgerForPlanningDay\)/);
  assert.match(widgets, /openToDay\?\.\(selectedPlanningDate\)/);
});
