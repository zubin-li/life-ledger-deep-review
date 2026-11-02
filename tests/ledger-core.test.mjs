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
  const svg = L.renderMoodSpendScatterSvg(scatter);
  assert.match(svg, /review-mood-scatter-dot/);
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
