import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const app = fs.readFileSync(new URL("../public/app.js", import.meta.url), "utf8");
const widgets = fs.readFileSync(new URL("../public/today-widgets.js", import.meta.url), "utf8");

test("scopedState includes ledger for backup export", () => {
  assert.match(app, /scopeLedgerForBackup\(\s*\n?\s*state\.ledger/);
  assert.match(app, /result\.ledger\s*=/);
});

test("mergeBackupData merges ledger via LifeLedgerLedger", () => {
  assert.match(app, /mergeLedgerForBackup\(current\.ledger,\s*incoming\.ledger/);
  assert.match(app, /\.\.\.\(ledger\s*\?\s*\{\s*ledger\s*\}\s*:\s*\{\}\)/);
});

test("Today spending avoids negative zero formatting", () => {
  // Slice 1: total is shown as a positive amount, so no sign flip can produce "-0".
  assert.match(widgets, /L\.formatMoney\(todayMinor, cur, locale\)/);
  assert.doesNotMatch(widgets, /formatMoney\(-todayMinor/);
});
