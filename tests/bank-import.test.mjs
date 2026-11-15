import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import { performance } from "node:perf_hooks";

const fixtures = new URL("./fixtures/bank/", import.meta.url);
const readFixture = name => fs.readFileSync(new URL(name, fixtures));
const readTextFixture = name => readFixture(name).toString("latin1");

function loadSandbox() {
  const root = {};
  let n = 0;
  const code = p => fs.readFileSync(new URL(`../public/${p}`, import.meta.url), "utf8");
  vm.runInNewContext(code("ledger-core.js"), { window: root, globalThis: root, crypto: { randomUUID: () => `id-${++n}` } });
  vm.runInNewContext(code("bank-import.js"), { window: root, globalThis: root, module: { exports: {} } });
  const plain = v => {
    // vm context: its Map is a different class, so instanceof fails
    if (Object.prototype.toString.call(v) === "[object Map]") return new Map(v);
    if (v === undefined) return v;
    return JSON.parse(JSON.stringify(v));
  };
  const L = Object.fromEntries(
    Object.entries(root.LifeLedgerLedger).map(([k, f]) => [k, typeof f === "function" ? (...a) => plain(f(...a)) : f]),
  );
  const B = Object.fromEntries(
    Object.entries(root.LifeLedgerBankImport).map(([k, f]) => [k, typeof f === "function" ? (...a) => plain(f(...a)) : f]),
  );
  return { L, B, root };
}

function ledgerWithAccounts() {
  const { L, B, root } = loadSandbox();
  const ledger = L.normalize(undefined, { lang: "de" });
  const addAcc = (name, kind, open) => {
    const id = `acc-${name}`;
    ledger.accounts.push({
      id,
      name,
      currency: "EUR",
      kind,
      icon: "wallet",
      color: "sage",
      archived: false,
      openingBalanceMinor: open,
      openingDate: "2026-09-01",
    });
    return id;
  };
  const acc = {
    sparkasse: addAcc("Sparkasse", "checking", 0),
    ing: addAcc("ING", "checking", 120000),
    dkb: addAcc("DKB", "checking", 300000),
    n26: addAcc("N26", "checking", 0),
    card: addAcc("Visa", "credit", -15000),
  };
  return { L, B, root, ledger, acc };
}

function rowsFromFile(B, filename, accountId) {
  const bytes = readFixture(filename);
  const text = B.decodeBytes(bytes);
  const parsed = B.parseStatement(text);
  return { parsed, rows: B.applyMapping(parsed, parsed.guessedMapping, accountId, { sourceId: filename }), text };
}

function commitBooked(B, ledger, accountId, plan) {
  const indices = [...(plan.new || []).map(x => x.index), ...(plan.possibleDuplicates || []).map(x => x.index)];
  return B.commitImport(ledger, plan, { accountId, includeNew: true, newIndices: (plan.new || []).map(x => x.index) }).ledger;
}

const PRESET_FILES = [
  { file: "sparkasse-2026-10.csv", preset: "sparkasse", booked: 8, sum: 140593 },
  { file: "ing-2026-10.csv", preset: "ing", booked: 6, sum: -55394, closing: 64606 },
  { file: "dkb-2026-10.csv", preset: "dkb", booked: 5, sum: 40882, closing: 340882 },
  { file: "n26-2026-10.csv", preset: "n26", booked: 4, sum: 7139 },
  { file: "kreditkarte-2026-10.csv", preset: "kreditkarte", booked: 5, sum: 3711, closing: -11289 },
];

for (const spec of PRESET_FILES) {
  test(`parse ${spec.preset}: row count + sum + preset`, () => {
    const { B, acc } = ledgerWithAccounts();
    const map = { sparkasse: acc.sparkasse, ing: acc.ing, dkb: acc.dkb, n26: acc.n26, kreditkarte: acc.card };
    const { parsed, rows } = rowsFromFile(B, spec.file, map[spec.preset]);
    assert.equal(parsed.presetId, spec.preset);
    assert.equal(rows.length, spec.booked + (spec.file.includes("sparkasse") ? 1 : spec.file.includes("ing") ? 1 : spec.file.includes("dkb") ? 1 : spec.file.includes("n26") ? 1 : spec.file.includes("kreditkarte") ? 1 : 0));
    assert.equal(B.sumBookedRows(rows), spec.sum);
    if (spec.closing !== undefined) {
      assert.equal(parsed.meta.closingBalanceMinor, spec.closing);
    }
  });
}

test("decodeBytes preserves Windows-1252 umlauts and € from fixtures", () => {
  const { B } = ledgerWithAccounts();
  const raw = readFixture("dkb-2026-10.csv");
  const text = B.decodeBytes(raw);
  assert.match(text, /Grünstraße/);
  assert.match(text, /Späti/);
  const ing = B.decodeBytes(readFixture("ing-2026-10.csv"));
  assert.match(ing, /Größenwahn/);
  const cc = B.decodeBytes(readFixture("kreditkarte-2026-10.csv"));
  assert.match(cc, /Zahlung – Danke/);
});

test("fingerprint occurrence count keeps two identical same-day rows", () => {
  const { B, acc } = ledgerWithAccounts();
  const { rows } = rowsFromFile(B, "sparkasse-2026-10.csv", acc.sparkasse);
  const dupes = rows.filter(r => r.payee.includes("Bäckerei") && r.date === "2026-10-27");
  assert.equal(dupes.length, 2);
  const fp = B.fingerprint({ ...dupes[0], accountId: acc.sparkasse });
  assert.equal(dupes[0].amountMinor, dupes[1].amountMinor);
  assert.equal(B.fingerprint({ ...dupes[1], accountId: acc.sparkasse }), fp);
  const counts = B.fingerprintCounts(dupes, acc.sparkasse);
  assert.equal(counts.get(fp), 2);
});

test("overlapping second-month import is idempotent on re-import", () => {
  const { L, B, ledger, acc } = ledgerWithAccounts();
  let state = ledger;
  const importFile = (name, accountId) => {
    const { rows } = rowsFromFile(B, name, accountId);
    const plan = B.planImport(state, accountId, rows, { skipPending: true });
    const before = state.transactions.length;
    const dupes = (plan.possibleDuplicates || []).length;
    const fresh = (plan.new || []).length;
    state = B.commitImport(state, plan, {
      accountId,
      includeNew: true,
      newIndices: (plan.new || []).map(x => x.index),
    }).ledger;
    return { before, after: state.transactions.length, added: state.transactions.length - before, dupes, fresh };
  };
  const october = rowsFromFile(B, "sparkasse-2026-10.csv", acc.sparkasse).rows;
  const preview = B.planImport(state, acc.sparkasse, october, { skipPending: true });
  assert.equal((preview.transfers || []).some(t => t.kind === "withinFile" || t.kind === "ledger"), false);
  assert.equal((preview.new || []).some(n => /visa kreditkarte/i.test(n.row?.payee || "")), true);
  const a = importFile("sparkasse-2026-10.csv", acc.sparkasse);
  assert.equal(a.added, 8);
  const b = importFile("sparkasse-2026-11.csv", acc.sparkasse);
  assert.equal(b.fresh, 4);
  assert.equal(b.added, 4);
  assert.ok(b.dupes >= 3);
  const c = importFile("sparkasse-2026-11.csv", acc.sparkasse);
  assert.equal(c.fresh, 0);
  assert.equal(c.added, 0);
  assert.ok(c.dupes >= 6);
});

test("exact amount within ±3 days merges manual entry; keeps user date and category", () => {
  let { L, B, ledger, acc } = ledgerWithAccounts();
  const groceries = ledger.categories.find(c => c.defaultSlug === "groceries" || c.name === "Groceries").id;
  const added = L.addTransaction(ledger, {
    accountId: acc.sparkasse,
    categoryId: groceries,
    amountMinor: -4567,
    currency: "EUR",
    date: "2026-10-03",
    note: "REWE manual",
  });
  ledger = added.ledger;
  const manual = added.transaction;
  const { rows } = rowsFromFile(B, "sparkasse-2026-10.csv", acc.sparkasse);
  const rewe = rows.find(r => r.payee.includes("REWE") && !r.pending);
  assert.ok(rewe);
  rewe.date = "2026-10-05";
  const plan = B.planImport(ledger, acc.sparkasse, rows, { skipPending: true });
  const match = (plan.matched || []).find(m => m.txId === manual.id);
  assert.ok(match, "expected auto match");
  const committed = B.commitImport(ledger, plan, { accountId: acc.sparkasse, merges: { [match.index]: manual.id } }).ledger;
  const tx = committed.transactions.find(t => t.id === manual.id);
  assert.equal(tx.date, "2026-10-03");
  assert.equal(tx.categoryId, groceries);
  assert.equal(tx.note, "REWE manual");
  assert.equal(tx.amountMinor, -4567);
  assert.equal(tx.bookingDate, rewe.bookingDate);
});

test("ambiguous manual match is not auto-merged", () => {
  let { L, B, ledger, acc } = ledgerWithAccounts();
  const cat = ledger.categories.find(c => c.kind === "expense").id;
  const ra = L.addTransaction(ledger, { accountId: acc.ing, categoryId: cat, amountMinor: -380, currency: "EUR", date: "2026-10-25", note: "A" });
  ledger = ra.ledger;
  const a = ra.transaction;
  const rb = L.addTransaction(ledger, { accountId: acc.ing, categoryId: cat, amountMinor: -380, currency: "EUR", date: "2026-10-26", note: "B" });
  ledger = rb.ledger;
  const b = rb.transaction;
  const { rows } = rowsFromFile(B, "ing-2026-10.csv", acc.ing);
  const cafe = rows.filter(r => r.payee.includes("Größenwahn") && !r.pending);
  assert.equal(cafe.length, 2);
  const plan = B.planImport(ledger, acc.ing, rows, { skipPending: true });
  assert.equal((plan.matched || []).length, 0);
  const amb = (plan.suggestions || []).filter(s => s.kind === "ambiguous");
  assert.ok(amb.length >= 1);
  const newCafe = (plan.new || []).filter(n => n.row.payee.includes("Größenwahn"));
  const still = B.commitImport(ledger, plan, {
    accountId: acc.ing,
    includeNew: true,
    newIndices: newCafe.map(n => n.index),
  }).ledger;
  assert.equal(still.transactions.filter(t => t.id === a.id).length, 1);
  assert.equal(still.transactions.filter(t => t.id === b.id).length, 1);
  assert.ok(still.transactions.filter(t => t.source === "import").length >= 2);
});

test("transfer pairing links ledger row after first side imported", () => {
  const { B, ledger, acc } = ledgerWithAccounts();
  const { rows: dkbRows } = rowsFromFile(B, "dkb-2026-10.csv", acc.dkb);
  const dkbXfer = dkbRows.find(r => r.amountMinor === 50000);
  let state = ledger;
  const p0 = B.planImport(state, acc.dkb, [dkbXfer], { skipPending: true });
  state = B.commitImport(state, p0, { accountId: acc.dkb, includeNew: true, newIndices: [0] }).ledger;
  const dkbTx = state.transactions.at(-1);
  const { rows: ingRows } = rowsFromFile(B, "ing-2026-10.csv", acc.ing);
  const ingXfer = ingRows.find(r => r.amountMinor === -50000);
  const p1 = B.planImport(state, acc.ing, [ingXfer], { skipPending: true });
  const xfer = (p1.transfers || []).find(t => t.kind === "ledger");
  assert.ok(xfer);
  const out = B.commitImport(state, p1, { accountId: acc.ing, includeNew: true, newIndices: [0] });
  const ingTx = out.ledger.transactions.at(-1);
  const linked = B.commitImport(out.ledger, { transfers: [], new: [], matched: [], possibleDuplicates: [], skipped: [] }, {
    accountId: acc.ing,
    transfers: [{ txIds: [dkbTx.id, ingTx.id] }],
    linkTransfersOnly: true,
  });
  assert.equal(linked.ledger.transactions.find(t => t.id === dkbTx.id).transfer, true);
  assert.equal(linked.ledger.transactions.find(t => t.id === ingTx.id).transfer, true);
});

test("undoImport restores ledger deep-equal to pre-commit", () => {
  const { L, B, ledger, acc } = ledgerWithAccounts();
  const before = JSON.parse(JSON.stringify(ledger));
  const { rows } = rowsFromFile(B, "n26-2026-10.csv", acc.n26);
  const plan = B.planImport(ledger, acc.n26, rows, { skipPending: true });
  const { ledger: after, batchId } = B.commitImport(ledger, plan, {
    accountId: acc.n26,
    includeNew: true,
    newIndices: (plan.new || []).map(x => x.index),
  });
  assert.notDeepEqual(after.transactions, before.transactions);
  const undone = B.undoImport(after, batchId).ledger;
  assert.deepEqual(undone.transactions, before.transactions);
  assert.deepEqual(undone.meta.importBatches || [], before.meta.importBatches || []);
});

test("checkClosingBalance warns on statement mismatch", () => {
  const { L, B, ledger, acc } = ledgerWithAccounts();
  const { parsed, rows } = rowsFromFile(B, "ing-2026-10.csv", acc.ing);
  let state = ledger;
  const plan = B.planImport(state, acc.ing, rows, { skipPending: true });
  state = B.commitImport(state, plan, { accountId: acc.ing, includeNew: true, newIndices: (plan.new || []).map(x => x.index) }).ledger;
  const ok = B.checkClosingBalance(state, acc.ing, parsed.meta.closingBalanceMinor, "2026-10-31");
  assert.equal(ok.expected, 64606);
  assert.equal(ok.ok, true);
  const bad = B.checkClosingBalance(state, acc.ing, parsed.meta.closingBalanceMinor + 100, "2026-10-31");
  assert.equal(bad.warning, true);
  assert.notEqual(bad.diff, 0);
});

test("10k synthetic rows plan+commit under 2s", () => {
  const { B, ledger, acc } = ledgerWithAccounts();
  const rows = [];
  for (let i = 0; i < 10000; i++) {
    rows.push({
      date: `2024-${String((i % 12) + 1).padStart(2, "0")}-${String((i % 28) + 1).padStart(2, "0")}`,
      bookingDate: `2024-${String((i % 12) + 1).padStart(2, "0")}-${String((i % 28) + 1).padStart(2, "0")}`,
      amountMinor: -100 - (i % 50),
      currency: "EUR",
      payee: `Shop ${i % 200}`,
      text: `Item ${i}`,
      pending: false,
      accountId: acc.sparkasse,
    });
  }
  const t0 = performance.now();
  const plan = B.planImport(ledger, acc.sparkasse, rows, { skipPending: true });
  const { ledger: next } = B.commitImport(ledger, plan, {
    accountId: acc.sparkasse,
    includeNew: true,
    newIndices: (plan.new || []).map(x => x.index),
  });
  const ms = performance.now() - t0;
  assert.equal(next.transactions.length, 10000);
  assert.ok(ms < 2000, `plan+commit took ${ms.toFixed(0)}ms`);
});

test("kreditkarte CSV is not mis-detected as DKB (High #1)", () => {
  const { B, acc } = ledgerWithAccounts();
  const { parsed, rows } = rowsFromFile(B, "kreditkarte-2026-10.csv", acc.card);
  assert.equal(parsed.presetId, "kreditkarte");
  assert.equal(rows.filter(r => !r.pending).length, 5);
});

test("one manual row cannot satisfy two identical bank rows (High #4)", () => {
  let { L, B, ledger, acc } = ledgerWithAccounts();
  const cat = ledger.categories.find(c => c.kind === "expense").id;
  const added = L.addTransaction(ledger, {
    accountId: acc.sparkasse,
    categoryId: cat,
    amountMinor: -320,
    currency: "EUR",
    date: "2026-10-27",
    note: "Bäckerei",
  });
  ledger = added.ledger;
  const rows = [
    {
      date: "2026-10-27",
      bookingDate: "2026-10-27",
      amountMinor: -320,
      currency: "EUR",
      payee: "Bäckerei Müller",
      text: "Kartenzahlung",
      pending: false,
      accountId: acc.sparkasse,
    },
    {
      date: "2026-10-27",
      bookingDate: "2026-10-27",
      amountMinor: -320,
      currency: "EUR",
      payee: "Bäckerei Müller",
      text: "Kartenzahlung",
      pending: false,
      accountId: acc.sparkasse,
    },
  ];
  const plan = B.planImport(ledger, acc.sparkasse, rows, { skipPending: true });
  assert.equal((plan.matched || []).length, 1);
  assert.equal((plan.new || []).length, 1);
  const committed = B.commitImport(ledger, plan, {
    accountId: acc.sparkasse,
    includeNew: true,
    newIndices: (plan.new || []).map(n => n.index),
  }).ledger;
  assert.equal(committed.transactions.length, 2);
});

test("user-confirmed merge on plan.new row updates manual tx (High #5)", () => {
  let { L, B, ledger, acc } = ledgerWithAccounts();
  const cat = ledger.categories.find(c => c.kind === "expense").id;
  const added = L.addTransaction(ledger, {
    accountId: acc.sparkasse,
    categoryId: cat,
    amountMinor: -6200,
    currency: "EUR",
    date: "2026-09-28",
    note: "Stadtwerke guess",
  });
  ledger = added.ledger;
  const manual = added.transaction;
  const row = {
    date: "2026-10-12",
    bookingDate: "2026-10-12",
    amountMinor: -6200,
    currency: "EUR",
    payee: "Stadtwerke München",
    text: "Strom",
    pending: false,
    accountId: acc.sparkasse,
  };
  const plan = B.planImport(ledger, acc.sparkasse, [row], { skipPending: true });
  assert.equal((plan.matched || []).length, 0);
  const neu = (plan.new || [])[0];
  assert.ok(neu);
  const committed = B.commitImport(ledger, plan, {
    accountId: acc.sparkasse,
    merges: { [neu.index]: manual.id },
    includeNew: true,
    newIndices: [],
  }).ledger;
  const tx = committed.transactions.find(t => t.id === manual.id);
  assert.equal(tx.bankFingerprint, B.fingerprint({ ...row, accountId: acc.sparkasse }));
  assert.equal(committed.transactions.filter(t => t.source === "import").length, 0);
});

test("transfer link in one commit via rowIndex + ledgerTxId (High #3)", () => {
  const { B, ledger, acc } = ledgerWithAccounts();
  const { rows: dkbRows } = rowsFromFile(B, "dkb-2026-10.csv", acc.dkb);
  const dkbXfer = dkbRows.find(r => r.amountMinor === 50000);
  let state = ledger;
  const p0 = B.planImport(state, acc.dkb, [dkbXfer], { skipPending: true });
  state = B.commitImport(state, p0, { accountId: acc.dkb, includeNew: true, newIndices: [0] }).ledger;
  const dkbTx = state.transactions.find(t => t.accountId === acc.dkb && t.amountMinor === 50000);
  const { rows: ingRows } = rowsFromFile(B, "ing-2026-10.csv", acc.ing);
  const ingXfer = ingRows.find(r => r.amountMinor === -50000);
  const p1 = B.planImport(state, acc.ing, [ingXfer], { skipPending: true });
  const out = B.commitImport(state, p1, {
    accountId: acc.ing,
    includeNew: true,
    newIndices: [0],
    transfers: [{ rowIndex: 0, ledgerTxId: dkbTx.id }],
  });
  assert.equal(out.ledger.transactions.find(t => t.id === dkbTx.id).transfer, true);
  const ingTx = out.ledger.transactions.find(t => t.accountId === acc.ing && t.amountMinor === -50000);
  assert.equal(ingTx.transfer, true);
});

test("merge assigns account to manual row without accountId (Med #7)", () => {
  let { L, B, ledger, acc } = ledgerWithAccounts();
  const cat = ledger.categories.find(c => c.kind === "expense").id;
  const added = L.addTransaction(ledger, {
    accountId: "",
    categoryId: cat,
    amountMinor: -1235,
    currency: "EUR",
    date: "2026-11-10",
    note: "dm",
  });
  ledger = added.ledger;
  const manual = added.transaction;
  const row = {
    date: "2026-11-10",
    bookingDate: "2026-11-10",
    amountMinor: -1235,
    currency: "EUR",
    payee: "dm-drogerie markt",
    text: "Kartenzahlung",
    pending: false,
    accountId: acc.sparkasse,
  };
  const plan = B.planImport(ledger, acc.sparkasse, [row], { skipPending: true });
  const match = (plan.matched || [])[0];
  assert.ok(match?.auto);
  const committed = B.commitImport(ledger, plan, { accountId: acc.sparkasse, merges: { [match.index]: manual.id } }).ledger;
  assert.equal(committed.transactions.find(t => t.id === manual.id).accountId, acc.sparkasse);
});

test("undoImport restores pre-existing transfer flag (Med #11)", () => {
  let { L, B, ledger, acc } = ledgerWithAccounts();
  const cat = ledger.categories.find(c => c.kind === "expense").id;
  const a = L.addTransaction(ledger, {
    accountId: acc.sparkasse,
    categoryId: cat,
    amountMinor: -10000,
    currency: "EUR",
    date: "2026-10-01",
    note: "xfer A",
    transfer: true,
  });
  ledger = a.ledger;
  const b = L.addTransaction(ledger, {
    accountId: acc.n26,
    categoryId: cat,
    amountMinor: 10000,
    currency: "EUR",
    date: "2026-10-01",
    note: "xfer B",
  });
  ledger = b.ledger;
  const before = JSON.parse(JSON.stringify(ledger));
  const linked = B.commitImport(ledger, { matched: [], new: [], possibleDuplicates: [], skipped: [] }, {
    accountId: acc.sparkasse,
    linkTransfersOnly: true,
    transfers: [{ txIds: [a.transaction.id, b.transaction.id] }],
  });
  assert.equal(linked.ledger.transactions.find(t => t.id === a.transaction.id).transfer, true);
  const undone = B.undoImport(linked.ledger, linked.batchId).ledger;
  assert.equal(undone.transactions.find(t => t.id === a.transaction.id).transfer, true);
  assert.deepEqual(undone.transactions, before.transactions);
});

test("guessCategory does not fall back to first expense category", () => {
  const { B, ledger } = ledgerWithAccounts();
  const row = { payee: "Mystery shop", text: "", amountMinor: -999 };
  const g = B.guessCategory(ledger, row);
  assert.equal(g.categoryId, "");
  assert.equal(ledger.categories.find(c => c.kind === "expense" && !c.archived)?.id === g.categoryId, false);
});

test("German statement merchants map to expected default categories", () => {
  const { L, ledger } = ledgerWithAccounts();
  const samples = [
    ["Techniker Krankenkasse", "health-insurance"],
    ["DKV KRANKENVERS. AG", "health-insurance"],
    ["ALLIANZ PRIVATE KRANKENVERSICHERUNGS AG", "health-insurance"],
    ["ALLIANZ VERSICHERUNGS-AG MUNCHEN", "insurance"],
    ["freenet DLS GmbH", "telecom"],
    ["DB Vertrieb GmbH", "transport"],
  ];
  for (const [payee, slug] of samples) {
    const cat = L.inferCategoryFromNote(payee, ledger, -100, "de");
    assert.ok(cat, payee);
    const match = ledger.categories.find(c => c.id === cat.id);
    assert.equal(match?.defaultSlug, slug, payee);
  }
});

function amexRow(accountId) {
  return {
    date: "2026-10-05",
    bookingDate: "2026-10-05",
    amountMinor: -120000,
    currency: "EUR",
    payee: "AMERICAN EXPRESS EUROPE S.A. (Germany branch)",
    text: "",
    pending: false,
    accountId,
  };
}

test("one-sided card bill stays a credit-card expense", () => {
  const { B, ledger, acc } = ledgerWithAccounts();
  ledger.accounts = ledger.accounts.filter(a => a.kind !== "credit");
  const row = amexRow(acc.sparkasse);
  assert.equal(B.isRepaymentTransferRow(row, ledger), false);
  const plan = B.planImport(ledger, acc.sparkasse, [row], { skipPending: true });
  assert.equal((plan.new || []).length, 1);
  assert.equal((plan.transfers || []).length, 0);
  const guessed = ledger.categories.find(c => c.id === B.guessCategory(ledger, row).categoryId);
  assert.equal(guessed?.defaultSlug, "credit-card");
  ledger.accounts.push({
    id: "acc-amex", name: "AMEX", currency: "EUR", kind: "credit", icon: "wallet", color: "coral",
    archived: false, openingBalanceMinor: 0, openingDate: "2026-09-01",
  });
  const again = B.planImport(ledger, acc.sparkasse, [row], { skipPending: true });
  assert.equal((again.new || []).length, 1);
  assert.equal((again.transfers || []).length, 0);
});

test("ownerNames pre-check a one-sided payee match and ignore account names and IBANs", () => {
  const { L, B, ledger, acc } = ledgerWithAccounts();
  ledger.settings.ownerNames = [" Zubin Li ", "", "Li Zubin"];
  const kept = L.normalize(ledger);
  assert.deepEqual(kept.settings.ownerNames, ["Zubin Li", "Li Zubin"]);
  ledger.settings.ownerNames = ["Zubin Li"];
  const row = (payee, amount = 95000) => ({
    date: "2026-10-02", bookingDate: "2026-10-02", amountMinor: amount, currency: "EUR",
    payee, text: "", pending: false, accountId: acc.n26, sourceId: "n26.csv",
  });
  for (const payee of ["Zubin Li", "Li Zubin", "ZUBIN LI"]) {
    assert.equal(B.isRepaymentTransferRow(row(payee), ledger), true, payee);
    const plan = B.planImport(ledger, acc.n26, [row(payee)], { skipPending: true });
    assert.equal((plan.new || []).length, 0, payee);
    assert.equal((plan.transfers || []).filter(t => t.kind === "possible-own").length, 1, payee);
  }
  const miss = row("Zubin Lin");
  assert.equal(B.isRepaymentTransferRow(miss, ledger), false);
  const missed = B.planImport(ledger, acc.n26, [miss], { skipPending: true });
  assert.equal((missed.new || []).length, 1);
  assert.equal((missed.transfers || []).filter(t => t.kind === "possible-own").length, 0);
  const n26 = ledger.accounts.find(a => a.id === acc.n26);
  n26.iban = "DE89 3704 0044 0532 0130 00";
  n26.name = "Zubin Li";
  const viaIban = { ...row("Someone else", 100), text: "Ref DE89370400440532013000" };
  assert.equal(B.isRepaymentTransferRow(viaIban, ledger), false);
  const ibanPlan = B.planImport(ledger, acc.n26, [viaIban], { skipPending: true });
  assert.equal((ibanPlan.transfers || []).length, 0);
  assert.equal((ibanPlan.new || []).length, 1);
  const unchecked = B.commitImport(ledger, B.planImport(ledger, acc.n26, [row("Zubin Li")], { skipPending: true }), {
    accountId: acc.n26, includeNew: true, newIndices: [], possibleOwnIndices: [],
  }).ledger;
  assert.equal(unchecked.transactions.length, 1);
  assert.notEqual(unchecked.transactions[0].transfer, true);
});

test("AI account column pairs two sources onto the selected account", () => {
  const { B, ledger, acc } = ledgerWithAccounts();
  const csv = `date,amount,currency,payee,description,category,type,account
2026-10-02,-950.00,EUR,Zubin Li,to n26,,expense,Sparkasse
2026-10-02,950.00,EUR,Zubin Li,from main,,income,N26`;
  const rows = B.applyMapping(B.parseStatement(csv), {}, acc.ing, { ledger, lang: "en" });
  assert.equal(rows[0].accountId, acc.ing);
  assert.equal(rows[1].accountId, acc.ing);
  assert.equal(rows[0].sourceId, "Sparkasse");
  assert.equal(rows[1].sourceId, "N26");
  const plan = B.planImport(ledger, acc.ing, rows, { skipPending: true });
  assert.equal((plan.new || []).length, 0);
  const pair = (plan.transfers || []).find(t => t.kind === "withinFile");
  assert.ok(pair);
  const out = B.commitImport(ledger, plan, {
    accountId: acc.ing,
    includeNew: true,
    newIndices: [],
    transfers: [{ rowAIndex: pair.rowA._index, rowBIndex: pair.rowB._index }],
  });
  const txs = out.ledger.transactions;
  assert.equal(txs.length, 2);
  assert.ok(txs.every(t => t.transfer === true && t.accountId === acc.ing));
  const batch = out.ledger.meta.importBatches.find(b => b.id === out.batchId);
  assert.equal(batch.transferLinks.length, 1);
  assert.equal(batch.transferLinks[0].txIds.length, 2);
});

test("AI account column is only a source; rows stay on the selected account", () => {
  const { B, ledger, acc } = ledgerWithAccounts();
  const csv = `date,amount,currency,payee,description,category,type,account
2026-10-03,-1.50,EUR,Shop A,left,,expense,Sparkasse
2026-10-03,-2.50,EUR,Shop B,right,,expense,N26`;
  const rows = B.applyMapping(B.parseStatement(csv), {}, acc.ing, { ledger, lang: "en" });
  const plan = B.planImport(ledger, acc.ing, rows, { skipPending: true });
  const committed = B.commitImport(ledger, plan, {
    accountId: acc.ing,
    includeNew: true,
    newIndices: (plan.new || []).map(n => n.index),
  }).ledger;
  const byNote = note => committed.transactions.find(t => t.note.includes(note));
  assert.equal(byNote("Shop A").accountId, acc.ing);
  assert.equal(byNote("Shop B").accountId, acc.ing);
  assert.equal(byNote("Shop A").sourceId, "Sparkasse");
  assert.equal(byNote("Shop B").sourceId, "N26");
  assert.equal(byNote("Shop A").amountMinor, -150);
  const csv7 = `date,amount,currency,payee,description,category,type
2026-10-04,-3.00,EUR,Shop C,plain,,expense`;
  const rows7 = B.applyMapping(B.parseStatement(csv7), {}, acc.dkb, { ledger, lang: "en" });
  assert.equal(rows7.length, 1);
  assert.equal(rows7[0].accountId, acc.dkb);
  assert.equal(rows7[0].sourceId, "ai");
});

test("AI prompt asks for every statement and leaves pairing to the app", () => {
  const { B, ledger } = ledgerWithAccounts();
  ledger.settings.ownerNames = ["Zubin Li"];
  const zh = B.buildAiImportPrompt(ledger, { lang: "zh" });
  assert.match(zh, /这个月的全部账单/);
  assert.match(zh, /不要自行判断转账/);
  assert.match(zh, /信用卡还款/);
  assert.match(zh, /date,amount,currency,payee,description,category,type,account/);
  assert.doesNotMatch(zh, /我的姓名/);
  assert.doesNotMatch(zh, /checking/);
  const en = B.buildAiImportPrompt(ledger, { lang: "en" });
  assert.match(en, /Do not try to detect transfers/);
  assert.match(en, /Credit card bill/);
  assert.doesNotMatch(en, /My name/);
  const de = B.buildAiImportPrompt(ledger, { lang: "de" });
  assert.match(de, /nicht selbst erkennen/);
  assert.match(de, /Kreditkartenabrechnung/);
  assert.match(de, /American Express/);
  assert.doesNotMatch(de, /Mein Name/);
  assert.doesNotMatch(de, /checking/);
});

test("unified AI CSV: fence, categories zh/de, unknown → uncategorised, transfer, ROWS mismatch", () => {
  const { L, B, ledger, acc } = ledgerWithAccounts();
  const deCat = ledger.categories.find(c => c.defaultSlug === "groceries");
  const zhName = deCat.nameZh;
  const csv = `\`\`\`csv
date,amount,currency,payee,description,category,type
2026-10-01,-12.50,EUR,Shop,Tea,${zhName},expense
2026-10-02,-5.00,EUR,Bakery,Pay,${deCat.nameDe},expense
2026-10-03,100.00,EUR,Boss,Salary,Salary,income
2026-10-04,-80.00,EUR,Card,Repay,,transfer
2026-10-05,-1.00,EUR,X,Y,NotARealCategory,expense
\`\`\`
ROWS=99 TOTAL=-98.50`;
  const parsed = B.parseStatement(csv);
  assert.equal(parsed.presetId, "unified");
  assert.ok(parsed.meta.aiReport);
  assert.equal(parsed.meta.aiReport.rows, 99);
  const rows = B.applyMapping(parsed, {}, acc.sparkasse, { ledger, lang: "zh" });
  assert.equal(rows.length, 5);
  assert.equal(rows[0].categoryId, deCat.id);
  const rowsDe = B.applyMapping(parsed, {}, acc.sparkasse, { ledger, lang: "de" });
  assert.equal(rowsDe[1].categoryId, deCat.id);
  assert.notEqual(rows[3].importAsTransfer, true);
  assert.equal(rows[4].categoryId, "");
  const plan = B.planImport(ledger, acc.sparkasse, rows, { skipPending: true });
  assert.equal((plan.new || []).length, 5);
  assert.equal((plan.transfers || []).length, 0);
  assert.notEqual(parsed.meta.aiReport.rows, rows.length);
});

test("buildAiImportPrompt lists live categories and exact header", () => {
  const { B, ledger } = ledgerWithAccounts();
  const p = B.buildAiImportPrompt(ledger, { lang: "en" });
  assert.match(p, /date,amount,currency,payee,description,category,type,account/);
  assert.match(p, /Groceries/);
  assert.match(p, /Do not try to detect transfers/);
  assert.doesNotMatch(p, /Sparkasse/);
});

test("normalize twice adds new default categories once, no duplicates", () => {
  const { L } = loadSandbox();
  const old = {
    version: 1,
    settings: { defaultCurrency: "EUR", secondaryCurrency: "CNY", perEntryCurrency: true, autoFx: true, monthlyBudgetMinor: 0, fixedCategoryIds: [], hideTransfers: true },
    accounts: [{ id: "a1", name: "Cash", currency: "EUR", kind: "checking", icon: "wallet", color: "sage", archived: false, openingBalanceMinor: 0, openingDate: "" }],
    categories: [
      { id: "c-g", name: "Groceries", nameZh: "日用", nameDe: "Lebensmittel", kind: "expense", icon: "shopping", color: "sage", parentId: "", archived: false, defaultSlug: "groceries" },
      { id: "c-o", name: "Other", nameZh: "其他", nameDe: "Sonstiges", kind: "expense", icon: "more", color: "sage", parentId: "", archived: false, defaultSlug: "other" },
      { id: "c-s", name: "Salary", nameZh: "工资", nameDe: "Gehalt", kind: "income", icon: "wallet", color: "sage", parentId: "", archived: false, defaultSlug: "salary" },
    ],
    transactions: [],
    budgets: [],
    recurring: [],
    meta: { recentCategoryIds: [], lastEntryAt: 0, noteCategoryHints: {}, fxCache: {} },
  };
  const once = L.normalize(old, { lang: "de" });
  const insOnce = once.categories.filter(c => c.defaultSlug === "health-insurance").length;
  assert.equal(insOnce, 1);
  const twice = L.normalize(once, { lang: "de" });
  assert.equal(twice.categories.filter(c => c.defaultSlug === "health-insurance").length, 1);
  assert.ok(twice.categories.filter(c => c.defaultSlug === "telecom").length >= 1);
});

test("amex-de fixture: purchases negative, payment and refund positive, both date styles", () => {
  const { B, acc } = ledgerWithAccounts();
  const { parsed, rows } = rowsFromFile(B, "amex-de-2026-10.csv", acc.card);
  assert.equal(parsed.presetId, "amex-de");
  assert.equal(rows.length, 8);
  const hit = needle => rows.find(r => `${r.payee} ${r.text}`.includes(needle));
  assert.equal(hit("REWE").date, "2026-10-01");
  assert.equal(hit("REWE").amountMinor, -4567);
  assert.equal(hit("LUFTHANSA").date, "2026-10-03");
  assert.equal(hit("LUFTHANSA").amountMinor, -18900);
  assert.equal(hit("Baeckerei Mueller").amountMinor, -320);
  assert.equal(hit("ERSTATTUNG").date, "2026-10-18");
  assert.equal(hit("ERSTATTUNG").amountMinor, 645);
  assert.equal(hit("ZAHLUNG ERHALTEN").date, "2026-10-28");
  assert.equal(hit("ZAHLUNG ERHALTEN").amountMinor, 20183);
  assert.ok(rows.filter(r => !/ZAHLUNG ERHALTEN|ERSTATTUNG/.test(`${r.payee} ${r.text}`)).every(r => r.amountMinor < 0));
  const minimal = `Datum,Beschreibung,Betrag
"04/11/2026","KIOSK","2,50"
"05.11.2026","ZAHLUNG ERHALTEN. VIELEN DANK","-10,00"`;
  const parsedMin = B.parseStatement(minimal);
  assert.equal(parsedMin.presetId, "amex-de");
  const minRows = B.applyMapping(parsedMin, parsedMin.guessedMapping, acc.card);
  assert.deepEqual(minRows.map(r => [r.date, r.amountMinor]), [["2026-11-04", -250], ["2026-11-05", 1000]]);
});

test("unreadable csv rows are listed and counted, not dropped", () => {
  const { B, acc } = ledgerWithAccounts();
  const csv = "Datum;Partner;Betrag;Notiz\n01.10.2026;REWE;-12,50;food\nbogus;SHOP;-5,00;x\n02.10.2026;BAD;nope;x\n03.10.2026;LIDL;-3,00;food\n";
  const parsed = B.parseStatement(csv);
  assert.equal(parsed.presetId, "generic");
  assert.equal(parsed.rows.length, 4);
  const rows = B.applyMapping(parsed, parsed.guessedMapping, acc.sparkasse);
  assert.equal(rows.length, 2);
  assert.equal(rows[0].amountMinor, -1250);
  assert.equal(rows[0].date, "2026-10-01");
  assert.equal(rows[1].date, "2026-10-03");
  assert.equal(rows[1].amountMinor, -300);
  assert.equal(parsed.unreadable.length, 2);
  assert.equal(rows.length + parsed.unreadable.length, parsed.rows.length);
  const raw = parsed.unreadable.map(u => u.raw).join("\n");
  assert.match(raw, /bogus/);
  assert.match(raw, /nope/);
});

test("n26 keeps the older Date/Payee header and maps Partner Iban", () => {
  const { B, ledger, acc } = ledgerWithAccounts();
  const old = `"Date","Payee","Account number","Transaction type","Payment reference","Amount (EUR)","Amount (Foreign Currency)","Type Foreign Currency","Exchange Rate"
"2026-10-10","Taobao","DE12","Mastercard Payment","Bestellung","-13.61","-100.00","CNY","7.3475"`;
  const parsed = B.parseStatement(old);
  assert.equal(parsed.presetId, "n26");
  const rows = B.applyMapping(parsed, parsed.guessedMapping, acc.n26);
  assert.equal(rows[0].payee, "Taobao");
  assert.equal(rows[0].amountMinor, -1361);
  assert.equal(rows[0].originalAmountMinor, -10000);
  assert.equal(rows[0].originalCurrency, "CNY");
  const cur = `"Booking Date","Value Date","Partner Name","Partner Iban","Type","Payment Reference","Account Name","Amount (EUR)","Original Amount","Original Currency","Exchange Rate"
"2026-10-02","2026-10-02","Landlord","DE89 3704 0044 0532 0130 00","Credit Transfer","rent","Hauptkonto","-10.00","","",""`;
  const parsedCur = B.parseStatement(cur);
  assert.equal(parsedCur.presetId, "n26");
  ledger.accounts.find(a => a.id === acc.sparkasse).iban = "DE89370400440532013000";
  const viaIban = B.applyMapping(parsedCur, parsedCur.guessedMapping, acc.n26);
  assert.equal(viaIban[0].counterpartyIban, "DE89370400440532013000");
  assert.equal(B.isRepaymentTransferRow(viaIban[0], ledger), false);
});

test("bank-import assets wired in index.html and sw.js", () => {
  const html = fs.readFileSync(new URL("../public/index.html", import.meta.url), "utf8");
  const sw = fs.readFileSync(new URL("../public/sw.js", import.meta.url), "utf8");
  assert.ok(html.includes("./bank-import.js"));
  assert.ok(sw.includes("./bank-import.js"));
  assert.ok(sw.includes("/bank-import.js"));
});

function bookkeepingLedger() {
  const { L, B } = loadSandbox();
  const ledger = L.normalize(undefined, { lang: "de" });
  assert.equal((ledger.settings.ownerNames || []).length, 0);
  assert.equal(ledger.accounts.filter(a => !a.archived).length, 1);
  return { L, B, ledger, accountId: ledger.accounts[0].id };
}

function mappedText(B, text, accountId, sourceId, ledger) {
  const parsed = B.parseStatement(text);
  return { parsed, rows: B.applyMapping(parsed, parsed.guessedMapping, accountId, { sourceId, ledger }) };
}

const MAIN_CSV = `"Auftragskonto";"Buchungstag";"Valutadatum";"Buchungstext";"Verwendungszweck";"Beguenstigter/Zahlungspflichtiger";"Betrag";"Waehrung";"Info"
"DE00";"02.10.26";"02.10.26";"UEBERWEISUNG";"to n26";"Own transfer";"-950,00";"EUR";"Umsatz gebucht"
"DE00";"06.10.26";"06.10.26";"LASTSCHRIFT";"rent";"Landlord";"-980,00";"EUR";"Umsatz gebucht"`;

const N26_CSV = `"Booking Date","Value Date","Partner Name","Partner Iban","Type","Payment Reference","Account Name","Amount (EUR)","Original Amount","Original Currency","Exchange Rate"
"2026-10-02","2026-10-02","Main account","","Credit Transfer","from main","Hauptkonto","950.00","","",""
"2026-10-28","2026-10-28","AMERICAN EXPRESS","","Direct Debit","card bill","Hauptkonto","-201.83","","",""
"2026-10-21","2026-10-21","Doener Koenig","","Mastercard","food","Hauptkonto","-7.50","","",""`;

function sourceRow(accountId, sourceId, date, amount, payee = "X") {
  return {
    date, bookingDate: date, amountMinor: amount, currency: "EUR",
    payee, text: "", pending: false, sourceId, accountId,
  };
}

test("three statements pair internal offsets with no account setup", () => {
  const { B, ledger, accountId } = bookkeepingLedger();
  const main = mappedText(B, MAIN_CSV, accountId, "main.csv", ledger);
  const n26 = mappedText(B, N26_CSV, accountId, "n26.csv", ledger);
  const amex = rowsFromFile(B, "amex-de-2026-10.csv", accountId);
  amex.rows.forEach(r => { r.sourceId = "amex-de-2026-10.csv"; r.accountId = accountId; });
  assert.equal(main.parsed.presetId, "sparkasse");
  assert.equal(n26.parsed.presetId, "n26");
  assert.equal(amex.parsed.presetId, "amex-de");
  const rows = [...main.rows, ...n26.rows, ...amex.rows];
  assert.ok(rows.every(r => r.accountId === accountId));
  const plan = B.planImport(ledger, accountId, rows, { skipPending: true });
  const pairs = (plan.transfers || []).filter(t => t.kind === "withinFile");
  assert.equal(pairs.length, 2);
  assert.equal((plan.transfers || []).filter(t => t.kind !== "withinFile").length, 0);
  const byAmount = Object.fromEntries(pairs.map(p => [p.amountMinor, [p.rowA.sourceId, p.rowB.sourceId].sort()]));
  assert.deepEqual(byAmount[95000], ["main.csv", "n26.csv"]);
  assert.deepEqual(byAmount[20183], ["amex-de-2026-10.csv", "n26.csv"]);
  const purchases = (plan.new || []).filter(n => n.row.sourceId === "amex-de-2026-10.csv" && n.row.amountMinor < 0);
  assert.equal(purchases.length, 6);
  assert.ok((plan.new || []).some(n => n.row.amountMinor === 645));
  assert.ok(!(plan.new || []).some(n => /ZAHLUNG ERHALTEN/.test(`${n.row.payee} ${n.row.text}`)));
});

test("opposite rows in one file are not an internal offset", () => {
  const { B, ledger, accountId } = bookkeepingLedger();
  const rows = [
    sourceRow(accountId, "card.csv", "2026-10-12", -2000, "Shop"),
    sourceRow(accountId, "card.csv", "2026-10-18", 2000, "Refund"),
  ];
  const plan = B.planImport(ledger, accountId, rows, { skipPending: true });
  assert.equal((plan.transfers || []).length, 0);
  assert.equal((plan.new || []).length, 2);
});

test("a single N26 statement keeps the card bill and the incoming transfer", () => {
  const { B, ledger, accountId } = bookkeepingLedger();
  const { rows } = mappedText(B, N26_CSV, accountId, "n26.csv", ledger);
  const plan = B.planImport(ledger, accountId, rows, { skipPending: true });
  assert.equal((plan.transfers || []).length, 0);
  const out = B.commitImport(ledger, plan, {
    accountId, includeNew: true, newIndices: (plan.new || []).map(n => n.index),
  }).ledger;
  const bill = out.transactions.find(t => /AMERICAN EXPRESS/i.test(t.note));
  const income = out.transactions.find(t => t.amountMinor === 95000);
  assert.equal(out.categories.find(c => c.id === bill.categoryId)?.defaultSlug, "credit-card");
  assert.notEqual(bill.transfer, true);
  assert.equal(bill.amountMinor, -20183);
  assert.ok(income);
  assert.notEqual(income.transfer, true);
  assert.equal(income.amountMinor, 95000);
});

test("offset window is ±4 days, closest date wins, each row once", () => {
  const { B, ledger, accountId } = bookkeepingLedger();
  const near = B.planImport(ledger, accountId, [
    sourceRow(accountId, "a", "2026-10-01", -1000),
    sourceRow(accountId, "b", "2026-10-05", 1000),
  ]);
  assert.equal((near.transfers || []).filter(t => t.kind === "withinFile").length, 1);
  const far = B.planImport(ledger, accountId, [
    sourceRow(accountId, "a", "2026-10-01", -1000),
    sourceRow(accountId, "b", "2026-10-06", 1000),
  ]);
  assert.equal((far.transfers || []).length, 0);
  const otherCurrency = B.planImport(ledger, accountId, [
    sourceRow(accountId, "a", "2026-10-01", -1000),
    { ...sourceRow(accountId, "b", "2026-10-01", 1000), currency: "USD" },
  ]);
  assert.equal((otherCurrency.transfers || []).length, 0);
  const plan = B.planImport(ledger, accountId, [
    sourceRow(accountId, "a", "2026-10-10", -5000),
    sourceRow(accountId, "b", "2026-10-12", 5000),
    sourceRow(accountId, "c", "2026-10-14", 5000),
  ]);
  const pairs = (plan.transfers || []).filter(t => t.kind === "withinFile");
  assert.equal(pairs.length, 1);
  assert.deepEqual([pairs[0].rowA.sourceId, pairs[0].rowB.sourceId].sort(), ["a", "b"]);
  assert.equal(plan.new.length, 1);
  assert.equal(plan.new[0].row.sourceId, "c");
});

test("unchecking an offset imports both rows as income and expense", () => {
  const { B, ledger, accountId } = bookkeepingLedger();
  const rows = [
    sourceRow(accountId, "main.csv", "2026-10-02", -95000, "N26"),
    sourceRow(accountId, "n26.csv", "2026-10-02", 95000, "Main"),
  ];
  const plan = B.planImport(ledger, accountId, rows);
  assert.equal((plan.transfers || []).length, 1);
  const out = B.commitImport(ledger, plan, { accountId, includeNew: true, newIndices: [], transfers: [] });
  assert.equal(out.ledger.transactions.length, 2);
  assert.ok(out.ledger.transactions.every(t => t.transfer !== true));
  assert.deepEqual(out.ledger.transactions.map(t => t.amountMinor).sort((a, b) => a - b), [-95000, 95000]);
});

test("AI paste pairs on the account column and not without it", () => {
  const { B, ledger, accountId } = bookkeepingLedger();
  const withAccount = `date,amount,currency,payee,description,category,type,account
2026-10-02,-950.00,EUR,N26,out,,expense,Main
2026-10-03,950.00,EUR,Main,in,,income,N26`;
  const rows = B.applyMapping(B.parseStatement(withAccount), {}, accountId, { ledger, lang: "en" });
  assert.deepEqual(rows.map(r => r.sourceId), ["Main", "N26"]);
  assert.ok(rows.every(r => r.accountId === accountId));
  const plan = B.planImport(ledger, accountId, rows);
  assert.equal((plan.transfers || []).filter(t => t.kind === "withinFile").length, 1);
  const without = `date,amount,currency,payee,description,category,type
2026-10-02,-950.00,EUR,N26,out,,expense
2026-10-03,950.00,EUR,Main,in,,income`;
  const rows2 = B.applyMapping(B.parseStatement(without), {}, accountId, { ledger, lang: "en" });
  assert.equal(rows2[0].sourceId, rows2[1].sourceId);
  const plan2 = B.planImport(ledger, accountId, rows2);
  assert.equal((plan2.transfers || []).length, 0);
  assert.equal((plan2.new || []).length, 2);
});

test("undo removes the batch including paired rows", () => {
  const { B, ledger, accountId } = bookkeepingLedger();
  const rows = [
    sourceRow(accountId, "main.csv", "2026-10-02", -95000, "N26"),
    sourceRow(accountId, "n26.csv", "2026-10-02", 95000, "Main"),
    sourceRow(accountId, "main.csv", "2026-10-08", -500, "Bakery"),
  ];
  const plan = B.planImport(ledger, accountId, rows);
  const pair = plan.transfers.find(t => t.kind === "withinFile");
  const out = B.commitImport(ledger, plan, {
    accountId,
    includeNew: true,
    newIndices: (plan.new || []).map(n => n.index),
    transfers: [{ rowAIndex: pair.rowA._index, rowBIndex: pair.rowB._index }],
  });
  assert.equal(out.ledger.transactions.length, 3);
  assert.equal(out.ledger.transactions.filter(t => t.transfer === true).length, 2);
  const undone = B.undoImport(out.ledger, out.batchId);
  assert.equal(undone.undone, true);
  assert.equal(undone.ledger.transactions.length, 0);
});

test("an already imported row pairs with a later statement from another source", () => {
  const { B, ledger, accountId } = bookkeepingLedger();
  const firstPlan = B.planImport(ledger, accountId, [sourceRow(accountId, "main.csv", "2026-10-01", -95000)]);
  let state = B.commitImport(ledger, firstPlan, { accountId, includeNew: true, newIndices: [0] }).ledger;
  assert.equal(state.transactions[0].sourceId, "main.csv");
  const second = B.planImport(state, accountId, [sourceRow(accountId, "n26.csv", "2026-10-04", 95000)]);
  assert.equal((second.transfers || []).filter(t => t.kind === "ledger").length, 1);
  const same = B.planImport(state, accountId, [sourceRow(accountId, "main.csv", "2026-10-03", 95000)]);
  assert.equal((same.transfers || []).length, 0);
  const late = B.planImport(state, accountId, [sourceRow(accountId, "n26.csv", "2026-10-06", 95000)]);
  assert.equal((late.transfers || []).length, 0);
});

test("transfers never count as spending today", () => {
  const { L } = loadSandbox();
  let led = L.normalize(undefined, { lang: "de" });
  const acc = led.accounts[0].id;
  const cat = led.categories.find(c => c.kind === "expense").id;
  led.transactions.push({ id: "t1", accountId: acc, categoryId: cat, amountMinor: -95000, currency: led.settings.defaultCurrency, date: "2026-10-14", note: "x", transfer: true });
  const d = L.spendingTodayDetail(L.normalize(led), "2026-10-14");
  assert.equal(d.totalMinor ?? d.total ?? 0, 0);
});
