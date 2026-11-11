import test from "node:test";
import assert from "node:assert/strict";
import "../public/ledger-core.js";

const L = globalThis.LifeLedgerLedger;

test("demo ledger notes follow UI language and month has enough rows", () => {
  const zh = L.buildDemoSample({ now: new Date("2026-11-09T12:00:00"), lang: "zh", contentSeed: 42 });
  const notes = zh.transactions.filter(t => t.date.startsWith("2026-11")).map(t => t.note);
  assert.ok(notes.length >= 8);
  assert.ok(!notes.some(n => /^(Rent monthly|Groceries|Coffee|Transit|Streaming)$/.test(n)));
  const de = L.relocalizeDemoLedger(zh, "de");
  assert.ok(de.transactions.some(t => t.note === "Kaffee & Kuchen" || t.note === "U-Bahn"));
});
