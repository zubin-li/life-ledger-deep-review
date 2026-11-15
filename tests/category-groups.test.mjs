import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const sandbox = { crypto: { randomUUID: () => `id-${Math.random().toString(16).slice(2)}` } };
sandbox.window = sandbox;
sandbox.globalThis = sandbox;
vm.runInNewContext(fs.readFileSync(new URL("../public/ledger-core.js", import.meta.url), "utf8"), sandbox);
vm.runInNewContext(fs.readFileSync(new URL("../public/money-ui.js", import.meta.url), "utf8"), sandbox);
const L = sandbox.LifeLedgerLedger;
const UI = sandbox.LifeLedgerMoneyUI;

function leaf(slug, extra = {}) {
  const names = {
    groceries: ["Groceries", "日用", "Lebensmittel"],
    dining: ["Dining", "餐饮", "Essen"],
    transport: ["Transport", "交通", "Mobilität"],
    housing: ["Housing", "住房", "Wohnen"],
    health: ["Health", "健康", "Gesundheit"],
    "health-insurance": ["Health insurance", "医疗保险", "Krankenversicherung"],
    insurance: ["Insurance", "保险", "Versicherungen"],
    telecom: ["Phone & internet", "通讯网络", "Telefon & Internet"],
    subscriptions: ["Subscriptions", "订阅", "Abos"],
    travel: ["Travel", "旅行", "Reisen"],
    education: ["Education", "学习", "Bildung"],
    fees: ["Bank fees & taxes", "手续费与税", "Gebühren & Steuern"],
    "credit-card": ["Credit card bill", "信用卡还款", "Kreditkartenabrechnung"],
    shopping: ["Shopping", "购物", "Einkauf"],
    entertainment: ["Entertainment", "娱乐", "Freizeit"],
    other: ["Other", "其他", "Sonstiges"],
    salary: ["Salary", "工资", "Gehalt"],
  }[slug];
  return {
    id: `id-${slug}`, name: names[0], nameZh: names[1], nameDe: names[2],
    kind: slug === "salary" ? "income" : "expense", icon: "more", color: "sage",
    parentId: "", archived: false, defaultSlug: slug, ...extra,
  };
}

function oldLedger() {
  const categories = ["groceries", "dining", "transport", "housing", "health", "health-insurance", "insurance", "telecom", "subscriptions", "travel", "education", "fees", "credit-card", "shopping", "entertainment", "other", "salary"]
    .map(slug => leaf(slug));
  categories.push({ id: "id-custom", name: "Pet", nameZh: "宠物", nameDe: "Haustier", kind: "expense", icon: "more", color: "sage", parentId: "", archived: false, defaultSlug: "" });
  categories.push({ id: "id-archived", name: "Old gym", nameZh: "旧健身", nameDe: "Altes Studio", kind: "expense", icon: "more", color: "sage", parentId: "", archived: true, defaultSlug: "" });
  categories.find(c => c.id === "id-dining").archived = true;
  return {
    version: 1,
    settings: { defaultCurrency: "EUR", fixedCategoryIds: ["id-housing"], monthlyBudgetMinor: 0 },
    accounts: [{ id: "acc", name: "Cash", currency: "EUR", kind: "cash" }],
    categories,
    transactions: [
      { id: "tx-rent", accountId: "acc", categoryId: "id-housing", amountMinor: -90000, currency: "EUR", date: "2026-10-01", note: "rent" },
      { id: "tx-food", accountId: "acc", categoryId: "id-groceries", amountMinor: -2500, currency: "EUR", date: "2026-10-02", note: "rewe" },
      { id: "tx-pet", accountId: "acc", categoryId: "id-custom", amountMinor: -800, currency: "EUR", date: "2026-10-03", note: "vet" },
      { id: "tx-old", accountId: "acc", categoryId: "id-archived", amountMinor: -400, currency: "EUR", date: "2026-10-04", note: "gym" },
      { id: "tx-pay", accountId: "acc", categoryId: "id-salary", amountMinor: 200000, currency: "EUR", date: "2026-10-01", note: "pay" },
      { id: "tx-move", accountId: "acc", categoryId: "id-other", amountMinor: -5000, currency: "EUR", date: "2026-10-05", note: "move", transfer: true },
    ],
    budgets: [{ id: "b1", categoryId: "id-groceries", month: "2026-10", limitMinor: 35000, currency: "EUR" }],
    recurring: [],
    meta: { recentCategoryIds: [], lastEntryAt: 0, noteCategoryHints: { rewe: "id-groceries" } },
  };
}

function bareTotals(txs, ym) {
  let income = 0;
  let expense = 0;
  for (const tx of txs) {
    if (!String(tx.date).startsWith(ym) || tx.transfer) continue;
    if (tx.amountMinor > 0) income += tx.amountMinor;
    else expense += -tx.amountMinor;
  }
  return { income, expense };
}

test("a fresh ledger gets groups after the leaves", () => {
  const ledger = L.normalize(null);
  const first = ledger.categories.find(c => c.kind === "expense");
  assert.equal(first.defaultSlug, "groceries");
  assert.equal(first.isGroup, false);
  assert.equal(ledger.meta.categoryGroupsV1, true);
  assert.equal(ledger.categories.find(c => c.defaultSlug === "groceries").parentId, ledger.categories.find(c => c.defaultSlug === "grp-food").id);
});

test("category groups migrate once, keep ids, and do not change month totals", () => {
  const raw = oldLedger();
  const before = bareTotals(raw.transactions, "2026-10");
  const beforeIds = raw.categories.map(c => c.id);
  const out = L.normalize(JSON.parse(JSON.stringify(raw)));
  const month = L.moneyMonth(out, "2026-10");
  assert.equal(month.incomeMinor, before.income);
  assert.equal(month.expenseMinor, before.expense);
  assert.deepEqual(month.expenseMinor + month.incomeMinor, before.expense + before.income);
  for (const id of beforeIds) assert.equal(out.categories.filter(c => c.id === id).length, 1);
  for (const tx of raw.transactions) {
    const next = out.transactions.find(t => t.id === tx.id);
    assert.equal(next.categoryId, tx.categoryId);
    assert.equal(next.amountMinor, tx.amountMinor);
  }
  assert.equal(out.budgets[0].categoryId, "id-groceries");
  assert.equal(out.budgets[0].limitMinor, 35000);
  assert.deepEqual({ ...out.meta.noteCategoryHints }, { rewe: "id-groceries" });
  assert.equal(out.meta.categoryGroupsV1, true);
  const parent = slug => out.categories.find(c => c.defaultSlug === slug);
  const food = parent("grp-food");
  const home = parent("grp-home");
  const health = parent("grp-health");
  const leisure = parent("grp-leisure");
  const finance = parent("grp-finance");
  for (const g of [food, home, health, leisure, finance]) {
    assert.equal(g.isGroup, true);
    assert.equal(g.kind, "expense");
    assert.equal(g.parentId, "");
  }
  assert.equal(parent("groceries").parentId, food.id);
  assert.equal(parent("dining").parentId, food.id);
  assert.equal(parent("housing").parentId, home.id);
  assert.equal(parent("telecom").parentId, home.id);
  assert.equal(parent("health").parentId, health.id);
  assert.equal(parent("health-insurance").parentId, health.id);
  assert.equal(parent("insurance").parentId, health.id);
  assert.equal(parent("entertainment").parentId, leisure.id);
  assert.equal(parent("subscriptions").parentId, leisure.id);
  assert.equal(parent("fees").parentId, finance.id);
  assert.equal(parent("credit-card").parentId, finance.id);
  for (const slug of ["transport", "shopping", "travel", "education", "other"]) assert.equal(parent(slug).parentId, "");
  assert.equal(out.categories.find(c => c.id === "id-custom").parentId, "");
  assert.equal(out.categories.find(c => c.id === "id-archived").parentId, "");
  assert.equal(out.categories.find(c => c.id === "id-custom").name, "Pet");
  assert.equal(parent("groceries").nameZh, "超市买菜");
  assert.equal(parent("health").name, "Medical");
  assert.equal(parent("health").nameZh, "医疗");
  assert.equal(parent("health").nameDe, "Arzt & Apotheke");
  assert.equal(parent("insurance").name, "Other insurance");
  assert.equal(parent("insurance").nameZh, "其他保险");
  assert.equal(parent("insurance").nameDe, "Sonstige Versicherungen");
  assert.equal(parent("health-insurance").nameZh, "医疗保险");
  const again = L.normalize(out);
  assert.equal(again.categories.length, out.categories.length);
  for (const c of out.categories) {
    const next = again.categories.find(x => x.id === c.id);
    assert.equal(next.parentId, c.parentId);
    assert.equal(next.isGroup, c.isGroup);
    assert.equal(next.name, c.name);
    assert.equal(next.nameZh, c.nameZh);
  }
  assert.equal(L.moneyMonth(again, "2026-10").expenseMinor, before.expense);
});

test("a renamed default label is left alone; an empty parent still joins its group", () => {
  const raw = oldLedger();
  const health = raw.categories.find(c => c.id === "id-health");
  health.name = "Clinic";
  health.nameZh = "诊所";
  health.nameDe = "Praxis";
  const out = L.normalize(raw);
  const next = out.categories.find(c => c.id === "id-health");
  assert.equal(next.name, "Clinic");
  assert.equal(next.nameZh, "诊所");
  assert.equal(next.nameDe, "Praxis");
  assert.equal(next.parentId, out.categories.find(c => c.defaultSlug === "grp-health").id);
});

test("groups are not selectable and a parent must be a group", () => {
  const out = L.normalize(oldLedger());
  const group = out.categories.find(c => c.defaultSlug === "grp-food");
  const transport = out.categories.find(c => c.defaultSlug === "transport");
  const groceries = out.categories.find(c => c.defaultSlug === "groceries");
  assert.throws(() => L.addTransaction(out, {
    accountId: "acc", categoryId: group.id, amountMinor: -100, currency: "EUR", date: "2026-10-08", note: "nope",
  }));
  assert.equal(L.updateTransaction(out, "tx-food", { categoryId: group.id }), null);
  assert.equal(L.upsertCategory(out, { id: transport.id, name: "Transport", parentId: groceries.id }), null);
  const bad = JSON.parse(JSON.stringify(out));
  bad.categories.find(c => c.id === transport.id).parentId = groceries.id;
  bad.categories.find(c => c.id === "id-shopping").parentId = transport.id;
  bad.categories.find(c => c.defaultSlug === "grp-food").parentId = transport.id;
  const fixed = L.normalize(bad);
  assert.equal(fixed.categories.find(c => c.id === transport.id).parentId, "");
  assert.equal(fixed.categories.find(c => c.id === "id-shopping").parentId, "");
  assert.equal(fixed.categories.find(c => c.defaultSlug === "grp-food").parentId, "");
  const moved = L.upsertCategory(out, { id: transport.id, name: "Transport", parentId: group.id });
  assert.equal(moved.category.parentId, group.id);
  assert.equal(moved.category.isGroup, false);
});

test("picker search matches a sub-category once", () => {
  const out = L.normalize(oldLedger());
  const groceries = out.categories.find(c => c.defaultSlug === "groceries");
  const dining = out.categories.find(c => c.defaultSlug === "dining");
  const hit = UI.categoryPickerRows(out.categories, { query: "超市", recentIds: [dining.id, groceries.id] });
  const items = hit.flatMap(s => s.items);
  assert.equal(items.length, 1);
  assert.equal(items[0].id, groceries.id);
  const open = UI.categoryPickerRows(out.categories, { query: "", recentIds: [groceries.id] });
  assert.equal(open[0].id, "recent");
  const ids = open.flatMap(s => s.items.map(c => c.id));
  assert.equal(ids.filter(id => id === groceries.id).length, 1);
  assert.equal(UI.categoryPickerRows(out.categories, { query: "", kind: "expense" }).flatMap(s => s.items).some(c => c.isGroup), false);
});

test("rule checkbox applies the category to other rows of the same merchant", () => {
  const picks = {
    0: { learn: true, learnKey: "rewe markt", categoryId: "groc", merchantKey: "rewe markt", userCat: true },
    1: { merchantKey: "rewe markt", categoryId: "old" },
    2: { merchantKey: "rewe markt", categoryId: "mine", userCat: true },
    3: { learn: true, learnKey: "rewe markt", merchantKey: "rewe markt", categoryId: "kept", userCat: true },
    4: { merchantKey: "lidl", categoryId: "shop" },
  };
  const next = UI.applySameMerchantCategory(picks, 0);
  assert.equal(next[1].categoryId, "groc");
  assert.equal(next[2].categoryId, "mine");
  assert.equal(next[3].categoryId, "kept");
  assert.equal(next[4].categoryId, "shop");
  assert.equal(picks[1].categoryId, "old");
});
