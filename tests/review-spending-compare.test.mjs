import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const app = readFileSync(new URL("../public/app.js", import.meta.url), "utf8");

test("review ledger summary compares month spending to previous month", () => {
  assert.match(app, /alignedMonthSpendCompare/);
  assert.match(app, /reviewLedgerSpendHint/);
  assert.match(app, /review\.spendingMoreMonth/);
  assert.match(app, /review\.spendingSameMonth/);
});
