import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const code = fs.readFileSync(new URL("../public/ledger-core.js", import.meta.url), "utf8");
const root = {};
let n = 0;
vm.runInNewContext(code, { window: root, globalThis: root, crypto: { randomUUID: () => `id-${++n}` } });
const raw = root.LifeLedgerLedger;
// vm realm objects have foreign prototypes; round-trip results for deepEqual.
const plain = v => (v === undefined ? v : JSON.parse(JSON.stringify(v)));
const L = Object.fromEntries(Object.entries(raw).map(([k, f]) => [k, typeof f === "function" ? (...a) => plain(f(...a)) : f]));

function base() {
  const ledger = L.normalize(undefined, { lang: "zh" });
  const cat = slug => ledger.categories.find(c => c.defaultSlug === slug || c.name === { housing: "Housing", groceries: "Groceries", dining: "Dining", transport: "Transport" }[slug]).id;
  return { ledger, cat, acc: ledger.accounts[0].id };
}
function tx(over) {
  return { id: `t${++n}`, accountId: "a", categoryId: "c", amountMinor: -100, currency: "EUR", date: "2026-10-01", note: "", ...over };
}

test("old-format ledger (no money settings, no account kind credit) still loads with additive defaults", () => {
  const old = {
    version: 1,
    settings: { defaultCurrency: "EUR", secondaryCurrency: "CNY" },
    accounts: [{ id: "a1", name: "Cash", currency: "EUR", kind: "cash" }],
    categories: [{ id: "c1", name: "Groceries", kind: "expense" }],
    transactions: [{ id: "t1", accountId: "a1", categoryId: "c1", amountMinor: -1280, currency: "EUR", date: "2026-10-02", note: "Rewe" }],
    budgets: [], recurring: [],
    meta: { recentCategoryIds: [], lastEntryAt: 0, noteCategoryHints: { rewe: "c1" } },
  };
  const out = L.normalize(JSON.parse(JSON.stringify(old)));
  assert.equal(out.transactions.length, 1);
  assert.equal(out.transactions[0].amountMinor, -1280);
  assert.equal(out.meta.noteCategoryHints.rewe, "c1");
  assert.equal(out.settings.perEntryCurrency, true);
  assert.equal(out.settings.autoFx, true);
  assert.equal(out.settings.monthlyBudgetMinor, 0);
  assert.deepEqual(out.settings.fixedCategoryIds, []);
  assert.equal(out.settings.hideTransfers, true);
  assert.equal(out.accounts[0].openingBalanceMinor, 0);
  assert.deepEqual(out.meta.fxCache, {});
});

test("normalize keeps new money settings, credit accounts and fx fields", () => {
  const out = L.normalize({
    settings: { defaultCurrency: "EUR", perEntryCurrency: false, autoFx: false, monthlyBudgetMinor: 180000, fixedCategoryIds: ["c1", 3], hideTransfers: false },
    accounts: [{ id: "k", name: "Card", kind: "credit", openingBalanceMinor: -5000, openingDate: "2026-01-01" }],
    transactions: [tx({ id: "f", accountId: "k", amountMinor: -1170, originalAmountMinor: -9000, originalCurrency: "CNY", fxRate: 0.13, fxSource: "ecb", fxDate: "2026-10-02", source: "manual" })],
    meta: { fxCache: { "CNY:2026-10-02": 0.13, bad: "x" } },
  });
  assert.equal(out.settings.perEntryCurrency, false);
  assert.equal(out.settings.autoFx, false);
  assert.equal(out.settings.monthlyBudgetMinor, 180000);
  assert.deepEqual(out.settings.fixedCategoryIds, ["c1"]);
  assert.equal(out.settings.hideTransfers, false);
  assert.equal(out.accounts[0].kind, "credit");
  assert.equal(out.accounts[0].openingBalanceMinor, -5000);
  assert.equal(out.accounts[0].openingDate, "2026-01-01");
  assert.equal(out.transactions[0].originalCurrency, "CNY");
  assert.equal(out.transactions[0].fxSource, "ecb");
  assert.deepEqual(out.meta.fxCache, { "CNY:2026-10-02": 0.13 });
});

test("merchantKey strips numbers, card refs and dates", () => {
  assert.equal(L.merchantKey("REWE Markt 4711 Berlin 02.10.2026"), "rewe markt berlin");
  assert.equal(L.merchantKey("Kartenzahlung VISA *1234 Lidl"), "kartenzahlung visa lidl");
  assert.equal(L.merchantKey("  "), "");
});

test("guessCategory: learned rule beats keyword, keyword beats none", () => {
  const { ledger, cat } = base();
  assert.equal(L.guessCategory(ledger, "Rewe 0815").source, "keyword");
  assert.equal(L.guessCategory(ledger, "Rewe 0815").categoryId, cat("groceries"));
  const learned = L.learnCategoryRule(ledger, "REWE 22", cat("dining"));
  const g = L.guessCategory(learned, "rewe 0815 02.11.2026");
  assert.equal(g.source, "rule");
  assert.equal(g.categoryId, cat("dining"));
  assert.deepEqual(L.guessCategory(ledger, "xyz"), { categoryId: "", source: "none" });
});

test("fxRequestDate uses previous business day on weekends", () => {
  assert.equal(L.fxRequestDate("2026-11-07"), "2026-11-06"); // Sat
  assert.equal(L.fxRequestDate("2026-11-08"), "2026-11-06"); // Sun
  assert.equal(L.fxRequestDate("2026-11-09"), "2026-11-09"); // Mon
});

test("foreignEntryDraft stores original + converted amount, rate, source, date", () => {
  const d = L.foreignEntryDraft({ amountMinor: -9000, currency: "CNY", date: "2026-11-07" }, { rate: 0.13, source: "ecb", rateDate: "2026-11-06" }, "EUR");
  assert.equal(d.amountMinor, -1170);
  assert.equal(d.currency, "EUR");
  assert.equal(d.originalAmountMinor, -9000);
  assert.equal(d.originalCurrency, "CNY");
  assert.equal(d.fxRate, 0.13);
  assert.equal(d.fxSource, "ecb");
  assert.equal(d.fxDate, "2026-11-06");
});

test("cachedFxRate falls back to latest earlier cached rate as estimate", () => {
  const cache = { "CNY:2026-10-01": 0.12, "CNY:2026-10-20": 0.13, "USD:2026-10-25": 0.9 };
  assert.deepEqual(L.cachedFxRate(cache, "CNY", "2026-10-20"), { rate: 0.13, rateDate: "2026-10-20", source: "ecb" });
  assert.deepEqual(L.cachedFxRate(cache, "CNY", "2026-11-02"), { rate: 0.13, rateDate: "2026-10-20", source: "estimate" });
  assert.equal(L.cachedFxRate(cache, "JPY", "2026-11-02"), null);
});

test("moneyMonth splits variable vs fixed (flagged category or recurring) and skips transfers", () => {
  const { ledger, cat, acc } = base();
  ledger.settings.fixedCategoryIds = [cat("housing")];
  ledger.transactions = [
    tx({ accountId: acc, categoryId: cat("housing"), amountMinor: -90000, date: "2026-10-01" }),
    tx({ accountId: acc, categoryId: cat("entertainment"), amountMinor: -1299, date: "2026-10-03", recurringId: "r1" }),
    tx({ accountId: acc, categoryId: cat("groceries"), amountMinor: -2000, date: "2026-10-03" }),
    tx({ accountId: acc, categoryId: cat("dining"), amountMinor: -500, date: "2026-10-05" }),
    tx({ accountId: acc, categoryId: cat("other"), amountMinor: -30000, date: "2026-10-05", transfer: true }),
    tx({ accountId: acc, categoryId: cat("salary"), amountMinor: 300000, date: "2026-10-01" }),
  ];
  const m = L.moneyMonth(ledger, "2026-10");
  assert.equal(m.expenseMinor, 93799);
  assert.equal(m.fixedMinor, 91299);
  assert.equal(m.variableMinor, 2500);
  assert.equal(m.incomeMinor, 300000);
  assert.equal(m.days.length, 31);
  assert.equal(m.days[2].variableMinor, 2000);
  assert.equal(m.days[2].fixedMinor, 1299);
  assert.equal(m.categories[0].categoryId, cat("housing"));
});

test("budgetHint = median variable spend of last 3 full months, needs >= 2", () => {
  const { ledger, cat, acc } = base();
  const g = cat("groceries");
  ledger.transactions = [tx({ accountId: acc, categoryId: g, amountMinor: -10000, date: "2026-09-10" })];
  assert.equal(L.budgetHint(ledger, "2026-11"), 0);
  ledger.transactions.push(
    tx({ accountId: acc, categoryId: g, amountMinor: -30000, date: "2026-08-10" }),
    tx({ accountId: acc, categoryId: g, amountMinor: -20000, date: "2026-10-10" }),
    tx({ accountId: acc, categoryId: g, amountMinor: -99999, date: "2026-11-02" }),
  );
  assert.equal(L.budgetHint(ledger, "2026-11"), 20000);
});

test("filterMoneyRows: category/currency/account/source/search/hideTransfers, grouped newest day first", () => {
  const { ledger, cat, acc } = base();
  ledger.transactions = [
    tx({ id: "a", accountId: acc, categoryId: cat("groceries"), amountMinor: -1000, date: "2026-10-02", note: "Rewe" }),
    tx({ id: "b", accountId: acc, categoryId: cat("dining"), amountMinor: -500, date: "2026-10-03", note: "Kaffee", originalCurrency: "CNY", originalAmountMinor: -4000 }),
    tx({ id: "c", accountId: acc, categoryId: cat("other"), amountMinor: -9000, date: "2026-10-03", transfer: true }),
    tx({ id: "d", accountId: "x", categoryId: cat("groceries"), amountMinor: -700, date: "2026-10-03", source: "import" }),
  ];
  const all = L.filterMoneyRows(ledger, "2026-10", { hideTransfers: true });
  assert.deepEqual(all.map(g => g.date), ["2026-10-03", "2026-10-02"]);
  assert.equal(all[0].expenseMinor, 1200);
  assert.deepEqual(all.flatMap(g => g.rows.map(r => r.id)).sort(), ["a", "b", "d"]);
  assert.equal(L.filterMoneyRows(ledger, "2026-10", {}).flatMap(g => g.rows).length, 4);
  const ids = f => L.filterMoneyRows(ledger, "2026-10", f).flatMap(g => g.rows.map(r => r.id));
  assert.deepEqual(ids({ currency: "CNY" }), ["b"]);
  assert.deepEqual(ids({ accountId: "x" }), ["d"]);
  assert.deepEqual(ids({ source: "import" }), ["d"]);
  assert.deepEqual(ids({ source: "manual", hideTransfers: true }).sort(), ["a", "b"]);
  assert.deepEqual(ids({ categoryId: cat("groceries") }).sort(), ["a", "d"]);
  assert.deepEqual(ids({ search: "kaff" }), ["b"]);
});

test("parseMoneyInput handles de/en decimal styles and rejects junk", () => {
  assert.equal(L.parseMoneyInput("12,80"), 1280);
  assert.equal(L.parseMoneyInput("12.8"), 1280);
  assert.equal(L.parseMoneyInput("1.234,56"), 123456);
  assert.equal(L.parseMoneyInput("1,234.56"), 123456);
  assert.equal(L.parseMoneyInput(" 7 "), 700);
  assert.equal(L.parseMoneyInput("abc"), null);
  assert.equal(L.parseMoneyInput(""), null);
});

test("housing is flagged fixed by default until the owner edits the list", () => {
  const { ledger, cat } = base();
  assert.deepEqual(ledger.settings.fixedCategoryIds, [cat("housing")]);
  const old = L.normalize({ ...ledger, settings: { defaultCurrency: "EUR" } }, { lang: "zh" });
  assert.deepEqual(old.settings.fixedCategoryIds, [cat("housing")]);
  const cleared = L.normalize({ ...ledger, settings: { ...ledger.settings, fixedCategoryIds: [] } }, { lang: "zh" });
  assert.deepEqual(cleared.settings.fixedCategoryIds, []);
});
