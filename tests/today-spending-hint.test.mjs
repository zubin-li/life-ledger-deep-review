import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const widgets = readFileSync(new URL("../public/today-widgets.js", import.meta.url), "utf8");

test("Today spending hint hides once the ledger has any transaction", () => {
  assert.match(widgets, /ledgerHasEntries\s*=\s*Boolean\(ledger\?\.transactions\?\.length\)/);
  assert.match(widgets, /hint\.hidden\s*=\s*Boolean\(todayMinor\)\s*\|\|\s*ledgerHasEntries/);
});

test("Today spending note uses quiet copy when ledger has history but today is zero", () => {
  assert.match(widgets, /spendingEmptyQuiet/);
  assert.match(widgets, /ledgerHasEntries\s*\?\s*t\("spendingEmptyQuiet"\)\s*:\s*t\("spendingEmpty"\)/);
});

test("ledgerHasEntries is declared before spending note reads it", () => {
  const decl = widgets.indexOf("const ledgerHasEntries = Boolean(ledger?.transactions?.length)");
  const note = widgets.indexOf('t("spendingEmptyQuiet")');
  assert.ok(decl > 0 && note > decl, "avoid temporal dead zone in spending()");
});
