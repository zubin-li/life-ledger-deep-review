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

test("rangeSummary totals expenses between inclusive ISO dates", () => {
  let ledger = L.normalize(null, { lang: "en" });
  const account = ledger.accounts[0].id;
  const expenseCat = ledger.categories.find(c => c.kind === "expense").id;
  ({ ledger } = L.addTransaction(ledger, { accountId: account, categoryId: expenseCat, amountMinor: -100, currency: "EUR", date: "2026-11-01", note: "a" }));
  ({ ledger } = L.addTransaction(ledger, { accountId: account, categoryId: expenseCat, amountMinor: -200, currency: "EUR", date: "2026-11-03", note: "b" }));
  ({ ledger } = L.addTransaction(ledger, { accountId: account, categoryId: expenseCat, amountMinor: -999, currency: "EUR", date: "2026-11-10", note: "out" }));
  const summary = L.rangeSummary(ledger, "2026-11-02", "2026-11-03");
  assert.equal(summary.expenseMinor, -200);
  assert.equal(summary.count, 1);
});

test("alignedWeekSpendCompare matches same weekday span shifted back 7 days", () => {
  let ledger = L.normalize(null, { lang: "en" });
  const account = ledger.accounts[0].id;
  const expenseCat = ledger.categories.find(c => c.kind === "expense").id;
  ({ ledger } = L.addTransaction(ledger, { accountId: account, categoryId: expenseCat, amountMinor: -100, currency: "EUR", date: "2026-10-27", note: "prev" }));
  ({ ledger } = L.addTransaction(ledger, { accountId: account, categoryId: expenseCat, amountMinor: -300, currency: "EUR", date: "2026-11-03", note: "cur" }));
  const cmp = L.alignedWeekSpendCompare(ledger, "2026-11-03", "2026-11-05");
  assert.equal(cmp.direction, "up");
  assert.equal(cmp.previousExpenseMinor, 100);
  assert.equal(cmp.currentExpenseMinor, 300);
  assert.equal(cmp.deltaPercent, 200);
});

test("alignedMonthSpendCompare matches same calendar days in the previous month", () => {
  let ledger = L.normalize(null, { lang: "en" });
  const account = ledger.accounts[0].id;
  const expenseCat = ledger.categories.find(c => c.kind === "expense").id;
  ({ ledger } = L.addTransaction(ledger, { accountId: account, categoryId: expenseCat, amountMinor: -100, currency: "EUR", date: "2026-10-03", note: "prev" }));
  ({ ledger } = L.addTransaction(ledger, { accountId: account, categoryId: expenseCat, amountMinor: -400, currency: "EUR", date: "2026-11-01", note: "cur" }));
  const cmp = L.alignedMonthSpendCompare(ledger, "2026-11", "2026-11-03");
  assert.equal(cmp.direction, "up");
  assert.equal(cmp.previousExpenseMinor, 100);
  assert.equal(cmp.currentExpenseMinor, 400);
  assert.equal(cmp.deltaPercent, 300);
});

test("alignedDaySpendCompare matches expenses vs the previous calendar day", () => {
  let ledger = L.normalize(null, { lang: "en" });
  const account = ledger.accounts[0].id;
  const expenseCat = ledger.categories.find(c => c.kind === "expense").id;
  ({ ledger } = L.addTransaction(ledger, { accountId: account, categoryId: expenseCat, amountMinor: -500, currency: "EUR", date: "2026-11-02", note: "yesterday" }));
  ({ ledger } = L.addTransaction(ledger, { accountId: account, categoryId: expenseCat, amountMinor: -1500, currency: "EUR", date: "2026-11-03", note: "today" }));
  const cmp = L.alignedDaySpendCompare(ledger, "2026-11-03");
  assert.equal(cmp.direction, "up");
  assert.equal(cmp.previousExpenseMinor, 500);
  assert.equal(cmp.currentExpenseMinor, 1500);
  assert.equal(cmp.deltaPercent, 200);
});

test("alignedDaySpendCompare percent decrease uses previous day as baseline", () => {
  let ledger = L.normalize(null, { lang: "en" });
  const account = ledger.accounts[0].id;
  const expenseCat = ledger.categories.find(c => c.kind === "expense").id;
  ({ ledger } = L.addTransaction(ledger, { accountId: account, categoryId: expenseCat, amountMinor: -10000, currency: "EUR", date: "2026-11-02", note: "yesterday" }));
  ({ ledger } = L.addTransaction(ledger, { accountId: account, categoryId: expenseCat, amountMinor: -1000, currency: "EUR", date: "2026-11-03", note: "today" }));
  const cmp = L.alignedDaySpendCompare(ledger, "2026-11-03");
  assert.equal(cmp.direction, "down");
  assert.equal(cmp.deltaPercent, 90);
});

test("temporalSpendChangePercent divides by baseline not current", () => {
  assert.equal(L.temporalSpendChangePercent(10000, 1000), 90);
  assert.equal(L.temporalSpendChangePercent(100, 300), 200);
  assert.equal(L.temporalSpendChangePercent(0, 100), null);
});

test("displaySpendDeltaPercent caps increases only", () => {
  assert.equal(L.displaySpendDeltaPercent(2113, "up"), 999);
  assert.equal(L.displaySpendDeltaPercent(90, "down"), 90);
  assert.equal(L.displaySpendDeltaPercent(null, "up"), null);
});

test("preferSpendCompareAmountCaption when baseline under €15", () => {
  assert.equal(
    L.preferSpendCompareAmountCaption({
      direction: "up",
      previousExpenseMinor: 350,
      deltaMinor: -94700,
      deltaPercent: 27000,
    }),
    true,
  );
  assert.equal(
    L.preferSpendCompareAmountCaption({
      direction: "up",
      previousExpenseMinor: 20000,
      deltaMinor: -5000,
      deltaPercent: 25,
    }),
    false,
  );
  assert.equal(
    L.preferSpendCompareAmountCaption({
      direction: "up",
      previousExpenseMinor: 80000,
      deltaMinor: 12000,
      deltaPercent: 15,
    }),
    true,
  );
  assert.equal(
    L.preferSpendCompareAmountCaption({
      direction: "up",
      previousExpenseMinor: 2000,
      deltaMinor: -48000,
      deltaPercent: 2400,
    }),
    true,
  );
  assert.equal(
    L.preferSpendCompareAmountCaption({ direction: "down", previousExpenseMinor: 100, deltaMinor: 50 }),
    false,
  );
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

test("importGermanBankCsv keeps column index when cells are empty (;;)", () => {
  const csv = `Buchungstag;Wertstellung;Buchungstext;Verwendungszweck;Glaeubiger ID;Mandatsreferenz;Kundenreferenz;Betrag;Waehrung
01.11.2026;;Umsatz;REWE;;;;-12,50;EUR`;
  const { imported, skipped, ledger } = L.importGermanBankCsv(csv, null, { lang: "de" });
  assert.equal(skipped, 0);
  assert.equal(imported, 1);
  assert.equal(ledger.transactions[0].amountMinor, -1250);
  assert.match(ledger.transactions[0].note, /REWE/);
});

test("previewGermanBankCsv counts rows without mutating ledger", () => {
  const csv = `Datum;Verwendungszweck;Betrag
01.11.2026;Kaffee;3,20
02.11.2026;;`;
  const empty = L.emptyLedger();
  const preview = L.previewGermanBankCsv(csv, empty, { lang: "de" });
  assert.equal(preview.importable, 1);
  assert.equal(preview.skipped, 1);
  assert.equal(empty.transactions.length, 0);
});

test("previewGermanBankCsv returns sample rows for confirm UI", () => {
  const csv = `Datum;Verwendungszweck;Betrag
01.11.2026;REWE;-12,50
02.11.2026;Gehalt;2500,00
03.11.2026;Bäcker;-4,20`;
  const empty = L.emptyLedger();
  const preview = L.previewGermanBankCsv(csv, empty, { lang: "de", maxPreviewRows: 2 });
  assert.equal(preview.importable, 3);
  assert.equal(preview.samples.length, 2);
  assert.equal(preview.samples[0].note, "REWE");
  assert.equal(preview.samples[0].amountMinor, -1250);
  assert.match(preview.samples[0].date, /^2026-11-01$/);
});

test("exportTransactionsCsv includes amount and currency per row", () => {
  let ledger = L.normalize(null, { lang: "en" });
  const account = ledger.accounts[0].id;
  const expenseCat = ledger.categories.find(c => c.kind === "expense").id;
  ({ ledger } = L.addTransaction(ledger, {
    accountId: account,
    categoryId: expenseCat,
    amountMinor: -1250,
    currency: "EUR",
    date: "2026-11-01",
    note: "coffee",
  }));
  ({ ledger } = L.addTransaction(ledger, {
    accountId: account,
    categoryId: expenseCat,
    amountMinor: -8800,
    currency: "CNY",
    date: "2026-11-02",
    note: "gift",
  }));
  const csv = L.exportTransactionsCsv(ledger, "2026-11");
  assert.match(csv, /^date;note;category;amount;currency/);
  assert.match(csv, /02\.11\.2026;"gift";.*;-88,00;CNY/);
  assert.match(csv, /01\.11\.2026;"coffee";.*;-12,50;EUR/);
});

test("exportTransactionsCsv uses localized category names", () => {
  let ledger = L.normalize(null, { lang: "de" });
  const account = ledger.accounts[0].id;
  const expenseCat = ledger.categories.find(c => c.kind === "expense");
  ({ ledger } = L.addTransaction(ledger, {
    accountId: account,
    categoryId: expenseCat.id,
    amountMinor: -500,
    currency: "EUR",
    date: "2026-11-03",
    note: "test",
  }));
  const csvDe = L.exportTransactionsCsv(ledger, "2026-11", { lang: "de" });
  assert.match(csvDe, new RegExp(`"${expenseCat.nameDe.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"`));
  const csvEn = L.exportTransactionsCsv(ledger, "2026-11", { lang: "en" });
  assert.match(csvEn, new RegExp(`"${expenseCat.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"`));
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
  const ledger = L.buildDemoSample({ now: new Date("2026-11-18T12:00:00"), lang: "en", contentSeed: 123 });
  assert.ok(ledger.transactions.length > 10);
  assert.ok(ledger.budgets.length >= 1);
  const progress = L.budgetProgress(ledger, "2026-11");
  assert.ok(Array.isArray(progress));
  const overs = L.budgetOverspendList(ledger, "2026-11");
  assert.ok(overs.length >= 1, "demo month should include over-budget categories for review");
});

test("upsertCategoryBudget and budgetProgress", () => {
  let ledger = L.normalize(null, { lang: "en" });
  const cat = ledger.categories.find(c => c.kind === "expense").id;
  const result = L.upsertCategoryBudget(ledger, { categoryId: cat, month: "2026-11", amountText: "350,00" });
  assert.ok(result);
  assert.equal(result.budget.limitMinor, 35000);
  ledger = result.ledger;
  const account = ledger.accounts[0].id;
  ({ ledger } = L.addTransaction(ledger, { accountId: account, categoryId: cat, amountMinor: -5000, currency: "EUR", date: "2026-11-05", note: "shop" }));
  const progress = L.budgetProgress(ledger, "2026-11");
  assert.equal(progress.length, 1);
  assert.equal(progress[0].spentMinor, 5000);
  assert.equal(progress[0].ratio, 5000 / 35000);
});

test("remove and restore category budget", () => {
  let ledger = L.normalize(null, { lang: "en" });
  const cat = ledger.categories.find(c => c.kind === "expense").id;
  ({ ledger } = L.upsertCategoryBudget(ledger, { categoryId: cat, month: "2026-11", limitMinor: 10000 }));
  const id = ledger.budgets[0].id;
  const snap = L.removeCategoryBudget(ledger, id);
  assert.equal(snap.ledger.budgets.length, 0);
  const back = L.restoreCategoryBudget(snap.ledger, snap.removed, snap.index);
  assert.equal(back.budgets.length, 1);
  assert.equal(back.budgets[0].limitMinor, 10000);
});

test("backup round-trip preserves budgets", () => {
  let ledger = L.normalize(null, { lang: "de" });
  const cat = ledger.categories.find(c => c.kind === "expense").id;
  ({ ledger } = L.upsertCategoryBudget(ledger, { categoryId: cat, month: "2026-11", limitMinor: 4200 }));
  const restored = L.normalize(JSON.parse(JSON.stringify(ledger)), { lang: "de" });
  assert.equal(restored.budgets.length, 1);
  assert.equal(restored.budgets[0].limitMinor, 4200);
});

test("buildDemoSample fills current month expenses for early-month demo", () => {
  const ledger = L.buildDemoSample({ now: new Date("2026-11-02T12:00:00"), lang: "en", contentSeed: 42 });
  const summary = L.monthSummary(ledger, "2026-11");
  assert.ok(summary.expenseMinor < 0);
  assert.ok(L.spendingTodayMinor(ledger, "2026-11-02") > 0);
  assert.ok(L.categoryBreakdown(ledger, "2026-11", "expense").length >= 1);
  assert.ok(ledger.recurring.length >= 1);
});

test("breakdownDonutSlices covers full circle and annularSectorPath is valid SVG", () => {
  const breakdown = [
    { categoryId: "a", amountMinor: 2500 },
    { categoryId: "b", amountMinor: 7500 },
  ];
  const slices = L.breakdownDonutSlices(breakdown);
  assert.equal(slices.length, 2);
  assert.equal(Math.round(slices.at(-1).endAngle), 360);
  const path = L.annularSectorPath(50, 50, 30, 48, 0, 90);
  assert.match(path, /^M [\d.]+ [\d.]+ A /);
  assert.ok(path.endsWith("Z"));
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
  assert.equal(result.transaction.recurringId, "rec-1");
});

test("recurringPendingForMonth skips posted templates", () => {
  let ledger = L.normalize(null, { lang: "en" });
  const account = ledger.accounts[0].id;
  const cat = ledger.categories.find(c => c.kind === "expense").id;
  ledger.recurring.push({
    id: "rec-a",
    accountId: account,
    categoryId: cat,
    amountMinor: -1200,
    currency: "EUR",
    dayOfMonth: 5,
    cadence: "monthly",
    label: "Gym",
  });
  ledger.recurring.push({
    id: "rec-b",
    accountId: account,
    categoryId: cat,
    amountMinor: -800,
    currency: "EUR",
    dayOfMonth: 10,
    cadence: "monthly",
    label: "Cloud",
  });
  let pending = L.recurringPendingForMonth(ledger, "2026-11");
  assert.equal(pending.length, 2);
  const posted = L.applyRecurringTemplate(ledger, "rec-a", { lang: "en", today: "2026-11-05" });
  assert.ok(posted);
  pending = L.recurringPendingForMonth(posted.ledger, "2026-11");
  assert.equal(pending.length, 1);
  assert.equal(pending[0].id, "rec-b");
  const bulk = L.applyAllRecurringPending(posted.ledger, "2026-11", { lang: "en", today: "2026-11-10" });
  assert.ok(bulk);
  assert.equal(bulk.transactions.length, 1);
  pending = L.recurringPendingForMonth(bulk.ledger, "2026-11");
  assert.equal(pending.length, 0);
});

test("recurring pending matches legacy rows without recurringId", () => {
  let ledger = L.normalize(null, { lang: "en" });
  const account = ledger.accounts[0].id;
  const cat = ledger.categories.find(c => c.kind === "expense").id;
  ledger.recurring.push({
    id: "rec-legacy",
    accountId: account,
    categoryId: cat,
    amountMinor: -500,
    currency: "EUR",
    dayOfMonth: 1,
    cadence: "monthly",
  });
  ({ ledger } = L.addTransaction(ledger, {
    accountId: account,
    categoryId: cat,
    amountMinor: -500,
    currency: "EUR",
    date: "2026-11-01",
    note: "manual",
  }, { lang: "en" }));
  const pending = L.recurringPendingForMonth(ledger, "2026-11");
  assert.equal(pending.length, 0);
});

test("upsertRecurringTemplate accepts income categories", () => {
  let ledger = L.normalize(null, { lang: "en" });
  const account = ledger.accounts[0].id;
  const inc = ledger.categories.find(c => c.kind === "income").id;
  const created = L.upsertRecurringTemplate(ledger, {
    label: "Salary",
    accountId: account,
    categoryId: inc,
    amountMinor: 320000,
    dayOfMonth: 1,
    cadence: "monthly",
  }, { lang: "en" });
  assert.ok(created);
  assert.equal(created.recurring.amountMinor, 320000);
});

test("weekly recurring applies on nearest weekday", () => {
  let ledger = L.normalize(null, { lang: "en" });
  const account = ledger.accounts[0].id;
  const cat = ledger.categories.find(c => c.kind === "expense").id;
  ledger.recurring.push({
    id: "rec-w",
    accountId: account,
    categoryId: cat,
    amountMinor: -500,
    currency: "EUR",
    cadence: "weekly",
    weekday: 0,
    label: "Weekly",
  });
  const result = L.applyRecurringTemplate(ledger, "rec-w", { lang: "en", today: "2026-11-02" });
  assert.ok(result);
  assert.equal(result.transaction.date, "2026-11-02");
  assert.equal(L.nearestWeekdayIso(0, "2026-11-05"), "2026-11-01");
});

test("weekly recurring stays pending until each ISO week in month is posted", () => {
  let ledger = L.normalize(null, { lang: "en" });
  const account = ledger.accounts[0].id;
  const cat = ledger.categories.find(c => c.kind === "expense").id;
  ledger.recurring.push({
    id: "rec-weekly-gym",
    accountId: account,
    categoryId: cat,
    amountMinor: -1200,
    currency: "EUR",
    cadence: "weekly",
    weekday: 1,
    label: "Gym",
  });
  const ym = "2026-11";
  assert.equal(L.recurringPendingForMonth(ledger, ym).length, 1);
  const first = L.applyRecurringTemplate(ledger, "rec-weekly-gym", { lang: "en", today: "2026-11-03" });
  assert.ok(first);
  assert.equal(first.transaction.date, "2026-11-03");
  let pending = L.recurringPendingForMonth(first.ledger, ym);
  assert.equal(pending.length, 1, "one Monday posted; other Mondays in November still open");
  const bulk = L.applyAllRecurringPending(first.ledger, ym, { lang: "en", today: "2026-11-30" });
  assert.ok(bulk);
  assert.ok(bulk.transactions.length >= 3);
  pending = L.recurringPendingForMonth(bulk.ledger, ym);
  assert.equal(pending.length, 0);
});

test("recurringPendingOccurrenceCount counts remaining weekly dates in month", () => {
  let ledger = L.normalize(null, { lang: "en" });
  const account = ledger.accounts[0].id;
  const cat = ledger.categories.find(c => c.kind === "expense").id;
  ledger.recurring.push({
    id: "rec-weekly-count",
    accountId: account,
    categoryId: cat,
    amountMinor: -800,
    currency: "EUR",
    cadence: "weekly",
    weekday: 1,
    label: "Class",
  });
  const ym = "2026-11";
  const novMondays = L.recurringUnpostedOccurrenceCount(ledger, ledger.recurring[0], ym);
  assert.ok(novMondays >= 4, "November 2026 has at least four Mondays");
  assert.equal(L.recurringPendingOccurrenceCount(ledger, ym), novMondays);
  const first = L.applyRecurringTemplate(ledger, "rec-weekly-count", { lang: "en", today: "2026-11-03" });
  assert.equal(L.recurringPendingOccurrenceCount(first.ledger, ym), novMondays - 1);
  assert.equal(L.recurringPendingForMonth(first.ledger, ym).length, 1);
});

test("weekly legacy manual row only clears matching ISO week", () => {
  let ledger = L.normalize(null, { lang: "en" });
  const account = ledger.accounts[0].id;
  const cat = ledger.categories.find(c => c.kind === "expense").id;
  ledger.recurring.push({
    id: "rec-w-legacy",
    accountId: account,
    categoryId: cat,
    amountMinor: -500,
    currency: "EUR",
    cadence: "weekly",
    weekday: 0,
    label: "Weekly",
  });
  ({ ledger } = L.addTransaction(ledger, {
    accountId: account,
    categoryId: cat,
    amountMinor: -500,
    currency: "EUR",
    date: "2026-11-01",
    note: "manual",
  }, { lang: "en" }));
  const pending = L.recurringPendingForMonth(ledger, "2026-11");
  assert.equal(pending.length, 1);
});

test("focusSpendInsight compares high vs low focus spend", () => {
  const rows = [
    { focusMinutes: 120, spendMinor: 1000 },
    { focusMinutes: 90, spendMinor: 1500 },
    { focusMinutes: 80, spendMinor: 1200 },
    { focusMinutes: 10, spendMinor: 8000 },
    { focusMinutes: 5, spendMinor: 7000 },
    { focusMinutes: 0, spendMinor: 6500 },
  ];
  const insight = L.focusSpendInsight(rows);
  assert.ok(insight);
  assert.ok(insight.lowFocusAvg > insight.highFocusAvg);
});

test("truncateTreemapLabel respects max chars and ellipsis", () => {
  assert.equal(L.truncateTreemapLabel("Lebensmittel", 9), "Lebensmi…");
  assert.equal(L.truncateTreemapLabel("咖啡", 6), "咖啡");
  assert.equal(L.treemapLabelMaxChars(10, 10, "de"), 0);
  assert.ok(L.treemapLabelMaxChars(20, 14, "de") >= 5);
});

test("habitCompletionSpendInsight compares high vs low completion spend", () => {
  const rows = [
    { completionPercent: 100, spendMinor: 500 },
    { completionPercent: 90, spendMinor: 600 },
    { completionPercent: 85, spendMinor: 550 },
    { completionPercent: 20, spendMinor: 4000 },
    { completionPercent: 10, spendMinor: 3500 },
    { completionPercent: 0, spendMinor: 3200 },
  ];
  const insight = L.habitCompletionSpendInsight(rows);
  assert.ok(insight);
  assert.ok(insight.lowCompletionAvg > insight.highCompletionAvg);
});

test("isLightAccentColor detects pale fills for treemap labels", () => {
  assert.equal(L.isLightAccentColor("#ffffff"), true);
  assert.equal(L.isLightAccentColor("#111111"), false);
  assert.equal(L.isLightAccentColor("rgb(240, 240, 200)"), true);
});

test("alignDemoHabitCompletionWithSpend yields review insight rows", () => {
  const now = new Date(2026, 10, 18, 12, 0, 0);
  let ledger = L.buildDemoSample({ now, lang: "en" });
  const logs = {};
  for (let d = 1; d <= 18; d += 1) {
    const iso = `2026-11-${String(d).padStart(2, "0")}`;
    logs[iso] = { completed: ["a"], mood: "平静", note: "", moodReason: "" };
  }
  const habitIds = ["a", "b", "c", "d", "e", "f", "g"];
  L.alignDemoHabitCompletionWithSpend(logs, ledger, habitIds, now);
  const ym = "2026-11";
  const dates = Array.from({ length: 18 }, (_, i) => `2026-11-${String(i + 1).padStart(2, "0")}`);
  const dailyRows = dates.map(date => {
    const done = logs[date]?.completed?.length || 0;
    return {
      date,
      spendMinor: L.spendingTodayMinor(ledger, date),
      completionPercent: Math.round((done / habitIds.length) * 100),
    };
  });
  const insight = L.habitCompletionSpendInsight(dailyRows);
  assert.ok(insight);
  assert.ok(insight.lowCompletionAvg > insight.highCompletionAvg);
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

test("filterTransactions can scope to a single day", () => {
  let ledger = L.normalize(null, { lang: "en" });
  const account = ledger.accounts[0].id;
  const cat = ledger.categories.find(c => c.kind === "expense").id;
  ({ ledger } = L.addTransaction(ledger, { accountId: account, categoryId: cat, amountMinor: -500, currency: "EUR", date: "2026-11-02", note: "a" }));
  ({ ledger } = L.addTransaction(ledger, { accountId: account, categoryId: cat, amountMinor: -700, currency: "EUR", date: "2026-11-03", note: "b" }));
  const day2 = L.filterTransactions(ledger, "2026-11", "", "2026-11-02");
  assert.equal(day2.length, 1);
  assert.equal(day2[0].note, "a");
});

test("filterTransactions can scope to a category", () => {
  let ledger = L.normalize(null, { lang: "en" });
  const account = ledger.accounts[0].id;
  const cats = ledger.categories.filter(c => c.kind === "expense");
  const food = cats[0].id;
  const transport = cats[1]?.id || cats[0].id;
  ({ ledger } = L.addTransaction(ledger, { accountId: account, categoryId: food, amountMinor: -500, currency: "EUR", date: "2026-11-02", note: "food" }));
  ({ ledger } = L.addTransaction(ledger, { accountId: account, categoryId: transport, amountMinor: -900, currency: "EUR", date: "2026-11-02", note: "ride" }));
  const foodOnly = L.filterTransactions(ledger, "2026-11", "", "", food);
  assert.equal(foodOnly.length, 1);
  assert.equal(foodOnly[0].note, "food");
});

test("summarizeTransactions totals filtered rows in reporting currency", () => {
  let ledger = L.normalize(null, { lang: "en" });
  const account = ledger.accounts[0].id;
  const food = ledger.categories.filter(c => c.kind === "expense")[0].id;
  const inc = ledger.categories.find(c => c.kind === "income").id;
  ({ ledger } = L.addTransaction(ledger, { accountId: account, categoryId: food, amountMinor: -500, currency: "EUR", date: "2026-11-02", note: "food" }));
  ({ ledger } = L.addTransaction(ledger, { accountId: account, categoryId: food, amountMinor: -300, currency: "EUR", date: "2026-11-02", note: "more" }));
  ({ ledger } = L.addTransaction(ledger, { accountId: account, categoryId: inc, amountMinor: 2000, currency: "EUR", date: "2026-11-02", note: "tip" }));
  const rows = L.filterTransactions(ledger, "2026-11", "", "2026-11-02", food);
  const sum = L.summarizeTransactions(ledger, rows);
  assert.equal(sum.count, 2);
  assert.equal(sum.expenseMinor, -800);
  assert.equal(sum.incomeMinor, 0);
  assert.equal(sum.netMinor, -800);
});

test("summarizeTransactions day scope can mix income and expense", () => {
  let ledger = L.normalize(null, { lang: "en" });
  const account = ledger.accounts[0].id;
  const food = ledger.categories.filter(c => c.kind === "expense")[0].id;
  const inc = ledger.categories.find(c => c.kind === "income").id;
  ({ ledger } = L.addTransaction(ledger, { accountId: account, categoryId: food, amountMinor: -500, currency: "EUR", date: "2026-11-02", note: "food" }));
  ({ ledger } = L.addTransaction(ledger, { accountId: account, categoryId: inc, amountMinor: 2000, currency: "EUR", date: "2026-11-02", note: "tip" }));
  const rows = L.filterTransactions(ledger, "2026-11", "", "2026-11-02", "");
  const sum = L.summarizeTransactions(ledger, rows);
  assert.equal(sum.count, 2);
  assert.equal(sum.incomeMinor, 2000);
  assert.equal(sum.expenseMinor, -500);
  assert.equal(sum.netMinor, 1500);
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

test("spendingTodayDetail picks top category and counts expenses", () => {
  let ledger = L.normalize(null, { lang: "zh" });
  const account = ledger.accounts[0].id;
  const dining = ledger.categories.find(c => c.defaultSlug === "dining").id;
  const groceries = ledger.categories.find(c => c.defaultSlug === "groceries").id;
  ({ ledger } = L.addTransaction(ledger, { accountId: account, categoryId: dining, amountMinor: -450, currency: "EUR", date: "2026-11-02", note: "coffee" }));
  ({ ledger } = L.addTransaction(ledger, { accountId: account, categoryId: groceries, amountMinor: -1200, currency: "EUR", date: "2026-11-02", note: "market" }));
  const detail = L.spendingTodayDetail(ledger, "2026-11-02", { lang: "zh" });
  assert.equal(detail.totalMinor, 1650);
  assert.equal(detail.expenseCount, 2);
  assert.equal(detail.topCategory?.name, "日用");
  assert.equal(detail.topCategory?.amountMinor, 1200);
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

test("moodSpendScatter needs enough points and renders svg", () => {
  const sparse = L.moodSpendScatter([{ mood: "很好", spendMinor: 100 }]);
  assert.equal(sparse, null);
  const rows = [
    { date: "2026-11-01", mood: "很好", spendMinor: 1000 },
    { date: "2026-11-02", mood: "很好", spendMinor: 2000 },
    { date: "2026-11-03", mood: "低落", spendMinor: 5000 },
  ];
  const scatter = L.moodSpendScatter(rows);
  assert.ok(scatter);
  assert.equal(scatter.points.length, 3);
  const tip = L.moodScatterTipLines(scatter.points[0], { lang: "en", locale: "en-GB", currency: "EUR" });
  assert.match(tip.line2, /Good/);
  const svg = L.renderMoodSpendScatterSvg(scatter, { lang: "en", locale: "en-GB", currency: "EUR" });
  assert.match(svg, /review-mood-scatter-dot/);
  assert.match(svg, /data-tip-line1=/);
  assert.match(svg, /tabindex="0"/);
  assert.match(svg, /tabindex="-1"/);
  assert.match(svg, /role="button"/);
  assert.match(svg, /#34c759/);
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

test("spendInsightDeltaPercent rounds percent lift between averages", () => {
  assert.equal(L.spendInsightDeltaPercent(6000, 1500), 300);
  assert.equal(L.spendInsightDeltaPercent(1500, 1500), null);
  assert.equal(L.spendInsightDeltaPercent(100, 0), null);
});

test("budgetOverspendList lists categories above limit", () => {
  let ledger = L.buildDemoSample({ now: new Date("2026-11-18T12:00:00"), lang: "en", contentSeed: 42 });
  const ym = "2026-11";
  const cat = ledger.categories.find(c => c.kind === "expense" && !c.archived);
  ledger = L.upsertCategoryBudget(ledger, { month: ym, categoryId: cat.id, limitMinor: 500 }).ledger;
  ledger = L.addTransaction(ledger, {
    accountId: ledger.accounts[0].id,
    categoryId: cat.id,
    amountMinor: -2500,
    currency: "EUR",
    date: "2026-11-10",
    note: "test",
  }).ledger;
  const overs = L.budgetOverspendList(ledger, ym);
  assert.ok(overs.length >= 1);
  assert.ok(overs[0].overMinor >= 2000);
});

test("moodOverspendCategoryInsight compares low mood on hot spend days", () => {
  let ledger = L.buildDemoSample({ now: new Date("2026-11-18T12:00:00"), lang: "en", contentSeed: 7 });
  const ym = "2026-11";
  const cat = ledger.categories.find(c => c.kind === "expense" && !c.archived);
  ledger = L.upsertCategoryBudget(ledger, { month: ym, categoryId: cat.id, limitMinor: 100 }).ledger;
  const hotDates = ["2026-11-05", "2026-11-06", "2026-11-07", "2026-11-08"];
  hotDates.forEach((date, i) => {
    ledger = L.addTransaction(ledger, {
      accountId: ledger.accounts[0].id,
      categoryId: cat.id,
      amountMinor: -5000,
      currency: "EUR",
      date,
      note: "hot",
    }).ledger;
  });
  const otherDates = ["2026-11-12", "2026-11-13", "2026-11-14", "2026-11-15"];
  const otherCat = ledger.categories.find(c => c.kind === "expense" && c.id !== cat.id);
  otherDates.forEach(date => {
    ledger = L.addTransaction(ledger, {
      accountId: ledger.accounts[0].id,
      categoryId: otherCat.id,
      amountMinor: -800,
      currency: "EUR",
      date,
      note: "other",
    }).ledger;
  });
  const dailyRows = [
    ...hotDates.map(date => ({ date, mood: "低落", spendMinor: 5000 })),
    ...otherDates.map(date => ({ date, mood: "很好", spendMinor: 800 })),
  ];
  const insight = L.moodOverspendCategoryInsight(ledger, ym, dailyRows);
  assert.ok(insight);
  assert.ok(insight.hotRate > insight.otherRate);
});

test("moodOverspendCategoryInsight surfaces positive mood on hot spend days", () => {
  let ledger = L.buildDemoSample({ now: new Date("2026-11-18T12:00:00"), lang: "en", contentSeed: 11 });
  const ym = "2026-11";
  const cat = ledger.categories.find(c => c.kind === "expense" && !c.archived);
  ledger = L.upsertCategoryBudget(ledger, { month: ym, categoryId: cat.id, limitMinor: 100 }).ledger;
  const hotDates = ["2026-11-05", "2026-11-06", "2026-11-07", "2026-11-08"];
  hotDates.forEach(date => {
    ledger = L.addTransaction(ledger, {
      accountId: ledger.accounts[0].id,
      categoryId: cat.id,
      amountMinor: -5000,
      currency: "EUR",
      date,
      note: "hot",
    }).ledger;
  });
  const otherDates = ["2026-11-12", "2026-11-13", "2026-11-14", "2026-11-15"];
  const otherCat = ledger.categories.find(c => c.kind === "expense" && c.id !== cat.id);
  otherDates.forEach(date => {
    ledger = L.addTransaction(ledger, {
      accountId: ledger.accounts[0].id,
      categoryId: otherCat.id,
      amountMinor: -800,
      currency: "EUR",
      date,
      note: "other",
    }).ledger;
  });
  const dailyRows = [
    ...hotDates.map(date => ({ date, mood: "很好", spendMinor: 5000 })),
    ...otherDates.map(date => ({ date, mood: "低落", spendMinor: 800 })),
  ];
  const insight = L.moodOverspendCategoryInsight(ledger, ym, dailyRows);
  assert.ok(insight);
  assert.ok(insight.positiveHotRate > insight.positiveOtherRate);
});

test("habitCompletionSpendScatter needs enough points and renders svg", () => {
  const sparse = L.habitCompletionSpendScatter([{ completionPercent: 50, spendMinor: 100 }]);
  assert.equal(sparse, null);
  const rows = [
    { date: "2026-11-01", completionPercent: 90, spendMinor: 1000 },
    { date: "2026-11-02", completionPercent: 85, spendMinor: 1200 },
    { date: "2026-11-03", completionPercent: 20, spendMinor: 5000 },
    { date: "2026-11-04", completionPercent: 15, spendMinor: 4500 },
  ];
  const scatter = L.habitCompletionSpendScatter(rows);
  assert.ok(scatter);
  assert.equal(scatter.points.length, 4);
  const svg = L.renderHabitCompletionSpendScatterSvg(scatter);
  assert.match(svg, /review-habit-scatter-dot/);
  assert.match(svg, /#6f8f7d/);
});

test("focusSpendScatter needs enough points and renders svg", () => {
  const sparse = L.focusSpendScatter([{ focusMinutes: 30, spendMinor: 100 }]);
  assert.equal(sparse, null);
  const rows = [
    { date: "2026-11-01", focusMinutes: 90, spendMinor: 1000 },
    { date: "2026-11-02", focusMinutes: 85, spendMinor: 1200 },
    { date: "2026-11-03", focusMinutes: 10, spendMinor: 5000 },
    { date: "2026-11-04", focusMinutes: 15, spendMinor: 4500 },
  ];
  const scatter = L.focusSpendScatter(rows);
  assert.ok(scatter);
  assert.equal(scatter.points.length, 4);
  const svg = L.renderFocusSpendScatterSvg(scatter);
  assert.match(svg, /review-focus-scatter-dot/);
  assert.match(svg, /#7c6fd6/);
});

test("alignDemoFocusWithSpend adds sessions on spend days", () => {
  const ledger = L.buildDemoSample({ now: new Date("2026-11-18T12:00:00"), lang: "en", contentSeed: 42 });
  const sessions = L.alignDemoFocusWithSpend([], ledger, new Date("2026-11-18T12:00:00"));
  assert.ok(sessions.length >= 4);
  const highFocus = sessions.filter(s => s.durationMs >= 85 * 60000);
  const lowFocus = sessions.filter(s => s.durationMs <= 20 * 60000);
  assert.ok(highFocus.length >= 1);
  assert.ok(lowFocus.length >= 1);
});

test("ledgerConflictCompare surfaces transaction count mismatch", () => {
  let ledgerA = L.normalize(null, { lang: "en" });
  const acct = ledgerA.accounts[0].id;
  const cat = ledgerA.categories.find(c => c.kind === "expense").id;
  ledgerA = L.addTransaction(ledgerA, {
    accountId: acct,
    categoryId: cat,
    amountMinor: -100,
    currency: "EUR",
    date: "2026-11-01",
    note: "a",
  }).ledger;
  const ledgerB = L.normalize(null, { lang: "en" });
  const cmp = L.ledgerConflictCompare(ledgerA, ledgerB, { lang: "en" });
  assert.ok(cmp);
  assert.equal(cmp.preserved.transactions, 1);
  assert.equal(cmp.current.transactions, 0);
  assert.equal(cmp.differs, true);
});

test("alignDemoMoodWithSpend tags high and low spend days for review insights", () => {
  const now = new Date("2026-11-02T12:00:00");
  const ledger = L.buildDemoSample({ now, lang: "en", contentSeed: 42 });
  const logs = {};
  ledger.transactions.forEach(tx => {
    if (tx.amountMinor >= 0 || tx.date > "2026-11-02") return;
    if (!logs[tx.date]) logs[tx.date] = { completed: [], mood: "平静", moodReason: "", note: "" };
  });
  L.alignDemoMoodWithSpend(logs, ledger, now);
  const rows = Object.keys(logs).sort().map(date => ({
    date,
    mood: logs[date].mood,
    spendMinor: L.spendingTodayMinor(ledger, date),
  })).filter(row => row.spendMinor > 0);
  const cmp = L.moodSpendComparison(rows);
  assert.ok(cmp);
  assert.ok(cmp.lowAvg > cmp.greatAvg);
});

test("alignDemoMoodWithBudgetOverspend surfaces positive mood on over-budget category days", () => {
  const now = new Date("2026-11-18T12:00:00");
  const today = "2026-11-18";
  const ledger = L.buildDemoSample({ now, lang: "en", contentSeed: 42 });
  const ym = "2026-11";
  const logs = {};
  ledger.transactions.forEach(tx => {
    if (!tx.date.startsWith(ym) || tx.date > today || tx.amountMinor >= 0) return;
    if (!logs[tx.date]) logs[tx.date] = { completed: [], mood: "平静", moodReason: "", note: "" };
  });
  L.alignDemoMoodWithSpend(logs, ledger, now);
  L.alignDemoMoodWithBudgetOverspend(logs, ledger, now);
  const dailyRows = Object.keys(logs).sort().map(date => ({
    date,
    mood: logs[date].mood,
    spendMinor: L.spendingTodayMinor(ledger, date),
  }));
  const insight = L.moodOverspendCategoryInsight(ledger, ym, dailyRows);
  assert.ok(insight);
  assert.ok(insight.positiveHotRate > insight.positiveOtherRate + 0.08);
});

test("parseQuickEntry treats salary category as income without plus sign", () => {
  const ledger = L.normalize(null, { lang: "zh" });
  const parsed = L.parseQuickEntry("2000 工资", ledger, { lang: "zh", today: "2026-11-02" });
  assert.equal(parsed.ok, true);
  assert.equal(parsed.draft.amountMinor, 200000);
  const cat = ledger.categories.find(c => c.id === parsed.draft.categoryId);
  assert.equal(cat?.kind, "income");
});

test("importGermanBankCsv parses quoted semicolon amounts", () => {
  const csv = `Datum;Verwendungszweck;Betrag
01.11.2026;REWE;"-12,50"`;
  const { imported, skipped, ledger } = L.importGermanBankCsv(csv, null, { lang: "de" });
  assert.equal(imported, 1);
  assert.equal(skipped, 0);
  assert.equal(ledger.transactions[0].amountMinor, -1250);
});

test("monthSummary and spendingToday ignore non-default currency", () => {
  let ledger = L.normalize(null, { lang: "en" });
  const account = ledger.accounts[0].id;
  const exp = ledger.categories.find(c => c.kind === "expense").id;
  ({ ledger } = L.addTransaction(ledger, { accountId: account, categoryId: exp, amountMinor: -10000, currency: "EUR", date: "2026-11-02", note: "eur" }));
  ({ ledger } = L.addTransaction(ledger, { accountId: account, categoryId: exp, amountMinor: -50000, currency: "CNY", date: "2026-11-02", note: "cny" }));
  const summary = L.monthSummary(ledger, "2026-11");
  assert.equal(summary.expenseMinor, -10000);
  assert.equal(L.spendingTodayMinor(ledger, "2026-11-02"), 10000);
});

test("categoryBreakdown ignores non-default currency", () => {
  let ledger = L.normalize(null, { lang: "en" });
  const account = ledger.accounts[0].id;
  const exp = ledger.categories.find(c => c.kind === "expense").id;
  ({ ledger } = L.addTransaction(ledger, { accountId: account, categoryId: exp, amountMinor: -10000, currency: "EUR", date: "2026-11-02", note: "eur" }));
  ({ ledger } = L.addTransaction(ledger, { accountId: account, categoryId: exp, amountMinor: -50000, currency: "CNY", date: "2026-11-02", note: "cny" }));
  const rows = L.categoryBreakdown(ledger, "2026-11", "expense");
  assert.equal(rows.length, 1);
  assert.equal(rows[0].amountMinor, 10000);
});

test("mergeLedgerForBackup deduplicates budgets by month and category", () => {
  let ledger = L.normalize(null, { lang: "en" });
  const cat = ledger.categories.find(c => c.kind === "expense").id;
  ledger = L.upsertCategoryBudget(ledger, { categoryId: cat, month: "2026-11", amountText: "100", currency: "EUR" }, { lang: "en" }).ledger;
  const baseBudget = ledger.budgets[0];
  const incoming = L.normalize(null, { lang: "en" });
  incoming.budgets.push({
    id: "other-budget-id",
    categoryId: cat,
    month: "2026-11",
    limitMinor: 20000,
    currency: "EUR",
    createdAt: 1,
    updatedAt: 2,
  });
  const merged = L.mergeLedgerForBackup(ledger, incoming, { lang: "en" });
  assert.equal(merged.budgets.length, 1);
  assert.equal(merged.budgets[0].limitMinor, 20000);
  assert.equal(merged.budgets[0].id, "other-budget-id");
});

test("budgetProgress ignores non-default currency spend", () => {
  let ledger = L.normalize(null, { lang: "en" });
  const account = ledger.accounts[0].id;
  const exp = ledger.categories.find(c => c.kind === "expense").id;
  ledger = L.upsertCategoryBudget(ledger, {
    categoryId: exp,
    month: "2026-11",
    amountText: "500",
    currency: "EUR",
  }, { lang: "en" }).ledger;
  ({ ledger } = L.addTransaction(ledger, { accountId: account, categoryId: exp, amountMinor: -10000, currency: "EUR", date: "2026-11-02", note: "eur" }));
  ({ ledger } = L.addTransaction(ledger, { accountId: account, categoryId: exp, amountMinor: -50000, currency: "CNY", date: "2026-11-02", note: "cny" }));
  const rows = L.budgetProgress(ledger, "2026-11");
  assert.equal(rows.length, 1);
  assert.equal(rows[0].spentMinor, 10000);
});

test("mergeLedgerForBackup deduplicates transactions by id", () => {
  let ledger = L.normalize(null, { lang: "en" });
  const account = ledger.accounts[0].id;
  const cat = ledger.categories.find(c => c.kind === "expense").id;
  ({ ledger } = L.addTransaction(ledger, { accountId: account, categoryId: cat, amountMinor: -100, currency: "EUR", date: "2026-11-01", note: "a" }));
  const tx = ledger.transactions[0];
  const incoming = L.normalize(null, { lang: "en" });
  incoming.transactions.push({ ...tx, note: "merged" });
  incoming.transactions.push({
    id: "extra-tx",
    accountId: account,
    categoryId: cat,
    amountMinor: -200,
    currency: "EUR",
    date: "2026-11-02",
    note: "b",
    createdAt: 1,
    updatedAt: 1,
  });
  const merged = L.mergeLedgerForBackup(ledger, incoming, { lang: "en" });
  assert.equal(merged.transactions.length, 2);
  assert.equal(merged.transactions.find(t => t.id === tx.id)?.note, "merged");
});

test("scopeLedgerForBackup filters transactions to export range", () => {
  let ledger = L.normalize(null, { lang: "en" });
  const account = ledger.accounts[0].id;
  const cat = ledger.categories.find(c => c.kind === "expense").id;
  ({ ledger } = L.addTransaction(ledger, { accountId: account, categoryId: cat, amountMinor: -100, currency: "EUR", date: "2026-10-15", note: "old" }));
  ({ ledger } = L.addTransaction(ledger, { accountId: account, categoryId: cat, amountMinor: -200, currency: "EUR", date: "2026-11-02", note: "new" }));
  const scoped = L.scopeLedgerForBackup(ledger, date => date >= "2026-11-01" && date <= "2026-11-30", { lang: "en" });
  assert.equal(scoped.transactions.length, 1);
  assert.equal(scoped.transactions[0].note, "new");
});

test("localizedCategoryName keeps English after zh seed", () => {
  const ledger = L.normalize(null, { lang: "zh" });
  const cat = ledger.categories.find(c => c.kind === "expense" && c.nameZh === "日用");
  assert.ok(cat);
  assert.equal(cat.name, "Groceries");
  assert.equal(L.localizedCategoryName(cat, "zh"), "日用");
  assert.equal(L.localizedCategoryName(cat, "en"), "Groceries");
});

test("repairDefaultCategoryNames restores English when name was overwritten with zh", () => {
  const raw = {
    version: 1,
    settings: { defaultCurrency: "EUR", secondaryCurrency: "CNY" },
    accounts: [{
      id: "a1", name: "Cash", currency: "EUR", kind: "checking", icon: "wallet", color: "sage", archived: false,
    }],
    categories: [{
      id: "c1",
      name: "日用",
      nameZh: "日用",
      nameDe: "Lebensmittel",
      kind: "expense",
      icon: "shopping",
      color: "sage",
      parentId: "",
      archived: false,
    }],
    transactions: [],
    budgets: [],
    recurring: [],
    meta: { recentCategoryIds: [], lastEntryAt: 0 },
  };
  const ledger = L.normalize(raw, { lang: "en" });
  const cat = ledger.categories.find(c => c.id === "c1");
  assert.equal(cat.name, "Groceries");
  assert.equal(L.localizedCategoryName(cat, "en"), "Groceries");
  assert.equal(L.localizedCategoryName(cat, "zh"), "日用");
});

test("dailyExpenseSeries covers seven days ending on selected date", () => {
  let ledger = L.normalize(null, { lang: "en" });
  const account = ledger.accounts[0].id;
  const exp = ledger.categories.find(c => c.kind === "expense").id;
  ({ ledger } = L.addTransaction(ledger, { accountId: account, categoryId: exp, amountMinor: -500, currency: "EUR", date: "2026-11-02", note: "a" }));
  ({ ledger } = L.addTransaction(ledger, { accountId: account, categoryId: exp, amountMinor: -200, currency: "EUR", date: "2026-10-31", note: "b" }));
  const series = L.dailyExpenseSeries(ledger, "2026-11-02", 7);
  assert.equal(series.length, 7);
  assert.equal(series[series.length - 1].date, "2026-11-02");
  assert.equal(series[series.length - 1].spendMinor, 500);
  assert.equal(series.find(r => r.date === "2026-10-31")?.spendMinor, 200);
});

test("renderMiniSpendSparklineSvg returns polyline when data exists", () => {
  const svg = L.renderMiniSpendSparklineSvg([
    { date: "2026-11-01", spendMinor: 100 },
    { date: "2026-11-02", spendMinor: 300 },
  ]);
  assert.match(svg, /<polyline/);
  assert.equal(L.renderMiniSpendSparklineSvg([{ date: "x", spendMinor: 1 }]), "");
});

test("importGermanBankCsv respects semicolons inside quoted purpose", () => {
  const csv = `Datum;Verwendungszweck;Betrag
01.11.2026;"Miete; Nebenkosten";850,00-`;
  const { imported, skipped, ledger } = L.importGermanBankCsv(csv, null, { lang: "de" });
  assert.equal(skipped, 0);
  assert.equal(imported, 1);
  assert.equal(ledger.transactions[0].amountMinor, -85000);
  assert.match(ledger.transactions[0].note, /Nebenkosten/);
});

test("importGermanBankCsv parses trailing-minus amounts in short rows", () => {
  const csv = `Datum;Verwendungszweck;Betrag
02.11.2026;REWE;12,50-`;
  const { imported, ledger } = L.importGermanBankCsv(csv, null, { lang: "de" });
  assert.equal(imported, 1);
  assert.equal(ledger.transactions[0].amountMinor, -1250);
});

test("importGermanBankCsv parses dot-decimal amounts without comma", () => {
  const csv = `Datum;Verwendungszweck;Betrag
02.11.2026;PayPal;12.50-`;
  const { imported, ledger } = L.importGermanBankCsv(csv, null, { lang: "de" });
  assert.equal(imported, 1);
  assert.equal(ledger.transactions[0].amountMinor, -1250);
});

test("formatMoney does not show negative zero", () => {
  const formatted = L.formatMoney(-0, "EUR", "de-DE");
  assert.doesNotMatch(formatted, /^-/);
  assert.match(formatted, /0,00/);
});

test("custom category is not treated as default when only nameZh collides", () => {
  const raw = {
    version: 1,
    settings: { defaultCurrency: "EUR", secondaryCurrency: "CNY" },
    accounts: [{
      id: "a1", name: "Cash", currency: "EUR", kind: "checking", icon: "wallet", color: "sage", archived: false,
    }],
    categories: [{
      id: "custom-coffee",
      name: "Coffee fund",
      nameZh: "日用",
      nameDe: "Kaffee",
      kind: "expense",
      icon: "coffee",
      color: "amber",
      parentId: "",
      archived: false,
    }],
    transactions: [],
    budgets: [],
    recurring: [],
    meta: { recentCategoryIds: [], lastEntryAt: 0 },
  };
  const ledger = L.normalize(raw, { lang: "en" });
  const cat = ledger.categories.find(c => c.id === "custom-coffee");
  assert.equal(cat.name, "Coffee fund");
  assert.equal(L.localizedCategoryName(cat, "zh"), "日用");
  assert.equal(L.localizedCategoryName(cat, "en"), "Coffee fund");
});

test("monthSummary reports otherCurrencyCount", () => {
  let ledger = L.normalize(null, { lang: "en" });
  const account = ledger.accounts[0].id;
  const exp = ledger.categories.find(c => c.kind === "expense").id;
  ({ ledger } = L.addTransaction(ledger, { accountId: account, categoryId: exp, amountMinor: -100, currency: "CNY", date: "2026-11-02", note: "cny" }));
  const summary = L.monthSummary(ledger, "2026-11");
  assert.equal(summary.otherCurrencyCount, 1);
  assert.equal(summary.expenseMinor, 0);
});

test("inferCategoryFromNote maps coffee keywords to dining", () => {
  const ledger = L.normalize(null, { lang: "zh" });
  const cat = L.inferCategoryFromNote("rewe einkauf", ledger, -500, "de");
  const groceries = ledger.categories.find(c => c.defaultSlug === "groceries" || L.localizedCategoryName(c, "de") === "Lebensmittel");
  assert.equal(cat?.id, groceries?.id);
  const dining = L.inferCategoryFromNote("12,50 kaffee", ledger, -1250, "de");
  const diningCat = ledger.categories.find(c => c.defaultSlug === "dining" || L.localizedCategoryName(c, "zh") === "餐饮");
  assert.equal(dining?.id, diningCat?.id);
});

test("rememberCategoryHint overrides keyword inference", () => {
  let ledger = L.normalize(null, { lang: "en" });
  const transport = ledger.categories.find(c => c.defaultSlug === "transport");
  ledger = L.rememberCategoryHint(ledger, "rewe", transport.id);
  const cat = L.inferCategoryFromNote("rewe", ledger, -100, "en");
  assert.equal(cat?.id, transport.id);
});

test("weekRangeMondayLocal uses Monday start in local calendar", () => {
  const range = L.weekRangeMondayLocal("2026-11-05", "2026-11-05");
  assert.equal(range.start, "2026-11-02");
  assert.equal(range.end, "2026-11-05");
});

test("categoryBreakdownRange limits to ISO date span", () => {
  let ledger = L.normalize(null, { lang: "en" });
  const account = ledger.accounts[0].id;
  const food = ledger.categories.find(c => c.defaultSlug === "dining");
  const home = ledger.categories.find(c => c.defaultSlug === "housing");
  ({ ledger } = L.addTransaction(ledger, { accountId: account, categoryId: food.id, amountMinor: -500, date: "2026-11-03", note: "a" }));
  ({ ledger } = L.addTransaction(ledger, { accountId: account, categoryId: home.id, amountMinor: -4500, date: "2026-11-01", note: "b" }));
  const week = L.categoryBreakdownRange(ledger, "2026-11-02", "2026-11-05", "expense");
  assert.equal(week.length, 1);
  assert.equal(week[0].categoryId, food.id);
  assert.equal(week[0].amountMinor, 500);
});

test("autoPostDueMonthlyRecurring is idempotent within a month", () => {
  let ledger = L.normalize(null, { lang: "en" });
  const account = ledger.accounts[0].id;
  const cat = ledger.categories.find(c => c.kind === "expense");
  ledger.recurring = [{
    id: "sub1",
    label: "Streaming",
    accountId: account,
    categoryId: cat.id,
    amountMinor: -1299,
    currency: "EUR",
    cadence: "monthly",
    dayOfMonth: 1,
    note: "Sub",
  }];
  ledger = L.normalize(ledger);
  const first = L.autoPostDueMonthlyRecurring(ledger, { today: "2026-11-03" });
  assert.ok(first);
  assert.equal(first.transactions.length, 1);
  const second = L.autoPostDueMonthlyRecurring(first.ledger, { today: "2026-11-03" });
  assert.equal(second, null);
});

test("parseQuickEntry: unsigned amount before the note still infers the spending category", () => {
  const ledger = L.normalize(undefined, { lang: "zh" });
  const cat = s => ledger.categories.find(c => c.id === L.parseQuickEntry(s, ledger, { lang: "zh", today: "2026-11-03" }).draft.categoryId);
  for (const s of ["4,20 Kaffee", "Kaffee 4,20", "12 咖啡"]) assert.equal(cat(s)?.defaultSlug, "dining", s);
  const d = L.parseQuickEntry("4,20 Kaffee", ledger, { lang: "zh", today: "2026-11-03" }).draft;
  assert.equal(d.amountMinor, -420);
  assert.equal(ledger.categories.find(c => c.id === L.parseQuickEntry("+2000 工资", ledger, { lang: "zh", today: "2026-11-03" }).draft.categoryId).kind, "income");
});

test("Today quick sheet saves even before the ledger page was rendered", () => {
  const ui = fs.readFileSync(new URL("../public/ledger-ui.js", import.meta.url), "utf8");
  assert.match(ui, /quickAdd\(text, anchorDay, options\) \{\s*\/\/[^\n]*\n\s*if \(!ctx\) root\.renderLedger\?\.\(\);/);
});
