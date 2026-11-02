import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const code = fs.readFileSync(new URL("../public/ledger-core.js", import.meta.url), "utf8");
const root = {};
vm.runInNewContext(code, { window: root, globalThis: root, crypto: { randomUUID: () => "11111111-1111-4111-8111-111111111111" } });
const L = root.LifeLedgerLedger;

test("normalize missing ledger is empty with defaults", () => {
  const ledger = L.normalize(undefined);
  assert.equal(ledger.version, 1);
  assert.ok(ledger.accounts.length >= 1);
  assert.ok(ledger.categories.some(c => c.kind === "expense"));
  assert.equal(ledger.transactions.length, 0);
});

test("parseQuickEntry handles comma decimals and German yesterday", () => {
  const ledger = L.emptyLedger();
  const parsed = L.parseQuickEntry("-45 Miete gestern", ledger, { lang: "de", today: "2026-11-02" });
  assert.equal(parsed.ok, true);
  assert.equal(parsed.draft.amountMinor, -4500);
  assert.equal(parsed.draft.date, "2026-11-01");
});

test("parseQuickEntry coffee amount", () => {
  const ledger = L.normalize(null, { lang: "zh" });
  const parsed = L.parseQuickEntry("12,50 咖啡", ledger, { lang: "zh", today: "2026-11-02" });
  assert.equal(parsed.ok, true);
  assert.equal(parsed.draft.amountMinor, -1250);
});

test("monthSummary totals signed amounts", () => {
  let ledger = L.normalize(null, { lang: "en" });
  const account = ledger.accounts[0].id;
  const expenseCat = ledger.categories.find(c => c.kind === "expense").id;
  const incomeCat = ledger.categories.find(c => c.kind === "income").id;
  ({ ledger } = L.addTransaction(ledger, { accountId: account, categoryId: expenseCat, amountMinor: -500, currency: "EUR", date: "2026-11-01", note: "a" }));
  ({ ledger } = L.addTransaction(ledger, { accountId: account, categoryId: incomeCat, amountMinor: 200000, currency: "EUR", date: "2026-11-02", note: "salary" }));
  const summary = L.monthSummary(ledger, "2026-11");
  assert.equal(summary.expenseMinor, -500);
  assert.equal(summary.incomeMinor, 200000);
  assert.equal(summary.netMinor, 199500);
});

test("importGermanBankCsv parses semicolon rows", () => {
  const csv = `Datum;Verwendungszweck;Betrag
01.11.2026;REWE;-12,50
02.11.2026;Gehalt;2500,00`;
  const { ledger, imported, skipped } = L.importGermanBankCsv(csv, null, { lang: "de" });
  assert.equal(imported, 2);
  assert.equal(skipped, 0);
  assert.equal(ledger.transactions.length, 2);
  assert.equal(ledger.transactions[0].amountMinor, -1250);
  assert.equal(ledger.transactions[1].amountMinor, 250000);
});

test("backup round-trip preserves ledger via JSON clone", () => {
  let ledger = L.normalize(null, { lang: "en" });
  const account = ledger.accounts[0].id;
  const cat = ledger.categories.find(c => c.kind === "expense").id;
  ({ ledger } = L.addTransaction(ledger, { accountId: account, categoryId: cat, amountMinor: -999, currency: "EUR", date: "2026-11-02", note: "test" }));
  const payload = { habits: [], logs: {}, ledger: JSON.parse(JSON.stringify(ledger)) };
  const restored = L.normalize(payload.ledger, { lang: "en" });
  assert.equal(restored.transactions.length, 1);
  assert.equal(restored.transactions[0].amountMinor, -999);
});

test("remove and restore transaction", () => {
  let ledger = L.normalize(null, { lang: "en" });
  const account = ledger.accounts[0].id;
  const cat = ledger.categories.find(c => c.kind === "expense").id;
  const { ledger: withTx, transaction } = L.addTransaction(ledger, { accountId: account, categoryId: cat, amountMinor: -100, currency: "EUR", date: "2026-11-02", note: "x" });
  const snap = L.removeTransaction(withTx, transaction.id);
  assert.equal(snap.ledger.transactions.length, 0);
  const back = L.restoreTransaction(snap.ledger, snap.removed, snap.index);
  assert.equal(back.transactions.length, 1);
});

test("buildDemoSample creates transactions and budgets", () => {
  const ledger = L.buildDemoSample({ now: new Date("2026-11-02T12:00:00"), lang: "en", contentSeed: 123 });
  assert.ok(ledger.transactions.length > 10);
  assert.ok(ledger.budgets.length >= 1);
  const progress = L.budgetProgress(ledger, "2026-11");
  assert.ok(Array.isArray(progress));
});

test("buildDemoSample fills current month expenses for early-month demo", () => {
  const ledger = L.buildDemoSample({ now: new Date("2026-11-02T12:00:00"), lang: "en", contentSeed: 42 });
  const summary = L.monthSummary(ledger, "2026-11");
  assert.ok(summary.expenseMinor < 0);
  assert.ok(L.spendingTodayMinor(ledger, "2026-11-02") > 0);
  assert.ok(L.categoryBreakdown(ledger, "2026-11", "expense").length >= 1);
  assert.ok(ledger.recurring.length >= 1);
});

test("updateTransaction patches amount and date", () => {
  let ledger = L.normalize(null, { lang: "en" });
  const account = ledger.accounts[0].id;
  const cat = ledger.categories.find(c => c.kind === "expense").id;
  const { ledger: withTx, transaction } = L.addTransaction(ledger, { accountId: account, categoryId: cat, amountMinor: -100, currency: "EUR", date: "2026-11-02", note: "a" });
  const updated = L.updateTransaction(withTx, transaction.id, { amountMinor: -250, date: "2026-11-01", note: "b" });
  assert.ok(updated);
  assert.equal(updated.transaction.amountMinor, -250);
  assert.equal(updated.transaction.date, "2026-11-01");
  assert.equal(updated.transaction.note, "b");
});

test("upsertRecurringTemplate creates updates and restores", () => {
  let ledger = L.normalize(null, { lang: "en" });
  const account = ledger.accounts[0].id;
  const cat = ledger.categories.find(c => c.kind === "expense").id;
  const created = L.upsertRecurringTemplate(ledger, {
    label: "Rent",
    accountId: account,
    categoryId: cat,
    amountMinor: -95000,
    dayOfMonth: 3,
    cadence: "monthly",
  }, { lang: "en" });
  assert.ok(created);
  assert.equal(created.recurring.dayOfMonth, 3);
  assert.equal(created.ledger.recurring.length, 1);
  const updated = L.upsertRecurringTemplate(created.ledger, {
    ...created.recurring,
    amountMinor: -88000,
    dayOfMonth: 5,
  }, { lang: "en" });
  assert.equal(updated.recurring.amountMinor, -88000);
  assert.equal(updated.ledger.recurring.length, 1);
  const snap = L.removeRecurringTemplate(updated.ledger, updated.recurring.id);
  assert.equal(snap.ledger.recurring.length, 0);
  const back = L.restoreRecurringTemplate(snap.ledger, snap.removed, snap.index);
  assert.equal(back.recurring.length, 1);
});

test("applyRecurringTemplate posts using today date", () => {
  let ledger = L.normalize(null, { lang: "en" });
  const account = ledger.accounts[0].id;
  const cat = ledger.categories.find(c => c.kind === "expense").id;
  ledger.recurring.push({
    id: "rec-1",
    accountId: account,
    categoryId: cat,
    amountMinor: -999,
    currency: "EUR",
    dayOfMonth: 28,
    cadence: "monthly",
    label: "Test",
  });
  const result = L.applyRecurringTemplate(ledger, "rec-1", { lang: "en", today: "2026-11-02" });
  assert.ok(result);
  assert.equal(result.transaction.date, "2026-11-02");
  assert.equal(result.transaction.amountMinor, -999);
});

test("monthlyTrendSeries returns six months", () => {
  let ledger = L.normalize(null, { lang: "en" });
  const account = ledger.accounts[0].id;
  const cat = ledger.categories.find(c => c.kind === "expense").id;
  ({ ledger } = L.addTransaction(ledger, { accountId: account, categoryId: cat, amountMinor: -100, currency: "EUR", date: "2026-11-02", note: "x" }));
  const series = L.monthlyTrendSeries(ledger, "2026-11", 6);
  assert.equal(series.length, 6);
  assert.equal(series.at(-1).ym, "2026-11");
});

test("filterTransactions matches note", () => {
  let ledger = L.normalize(null, { lang: "en" });
  const account = ledger.accounts[0].id;
  const cat = ledger.categories.find(c => c.kind === "expense").id;
  ({ ledger } = L.addTransaction(ledger, { accountId: account, categoryId: cat, amountMinor: -500, currency: "EUR", date: "2026-11-02", note: "coffee shop" }));
  const rows = L.filterTransactions(ledger, "2026-11", "coffee");
  assert.equal(rows.length, 1);
});

test("spendingTodayMinor sums expenses only", () => {
  let ledger = L.normalize(null, { lang: "en" });
  const account = ledger.accounts[0].id;
  const exp = ledger.categories.find(c => c.kind === "expense").id;
  const inc = ledger.categories.find(c => c.kind === "income").id;
  ({ ledger } = L.addTransaction(ledger, { accountId: account, categoryId: exp, amountMinor: -300, currency: "EUR", date: "2026-11-02", note: "" }));
  ({ ledger } = L.addTransaction(ledger, { accountId: account, categoryId: inc, amountMinor: 5000, currency: "EUR", date: "2026-11-02", note: "" }));
  assert.equal(L.spendingTodayMinor(ledger, "2026-11-02"), 300);
});

test("duplicateTransaction clones amount and category for today", () => {
  let ledger = L.normalize(null, { lang: "en" });
  const account = ledger.accounts[0].id;
  const cat = ledger.categories.find(c => c.kind === "expense").id;
  const { ledger: withTx, transaction } = L.addTransaction(ledger, { accountId: account, categoryId: cat, amountMinor: -420, currency: "EUR", date: "2026-10-01", note: "lunch" });
  const dup = L.duplicateTransaction(withTx, transaction.id, { lang: "en", today: "2026-11-02" });
  assert.ok(dup);
  assert.equal(dup.ledger.transactions.length, 2);
  const copy = dup.ledger.transactions.find(t => t.id !== transaction.id);
  assert.equal(copy.amountMinor, -420);
  assert.equal(copy.date, "2026-11-02");
});

test("moodSpendComparison averages great vs low mood days", () => {
  const rows = [
    { mood: "很好", spendMinor: 1000 },
    { mood: "很好", spendMinor: 2000 },
    { mood: "低落", spendMinor: 5000 },
    { mood: "低落", spendMinor: 7000 },
    { mood: "平静", spendMinor: 9999 },
  ];
  const cmp = L.moodSpendComparison(rows);
  assert.ok(cmp);
  assert.equal(cmp.greatAvg, 1500);
  assert.equal(cmp.lowAvg, 6000);
});

test("alignDemoMoodWithSpend tags high and low spend days for review insights", () => {
  const ledger = L.buildDemoSample({ now: new Date("2026-11-02T12:00:00"), lang: "en", contentSeed: 42 });
  const logs = {
    "2026-11-01": { completed: [], mood: "平静", moodReason: "", note: "" },
    "2026-11-02": { completed: [], mood: "平静", moodReason: "", note: "" },
  };
  L.alignDemoMoodWithSpend(logs, ledger, new Date("2026-11-02T12:00:00"));
  const rows = ["2026-11-01", "2026-11-02"].map(date => ({
    date,
    mood: logs[date].mood,
    spendMinor: L.spendingTodayMinor(ledger, date),
  }));
  const cmp = L.moodSpendComparison(rows);
  assert.ok(cmp);
  assert.ok(cmp.lowAvg > cmp.greatAvg);
});
