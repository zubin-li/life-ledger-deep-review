import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const app = readFileSync(new URL("../public/app.js", import.meta.url), "utf8");
const ledgerCore = readFileSync(new URL("../public/ledger-core.js", import.meta.url), "utf8");

function extractFunctionSource(signature) {
  const start = app.indexOf(signature);
  assert.ok(start >= 0, `missing ${signature}`);
  const bodyStart = app.indexOf("{", start);
  let depth = 0;
  for (let i = bodyStart; i < app.length; i++) {
    if (app[i] === "{") depth++;
    else if (app[i] === "}") {
      depth--;
      if (depth === 0) return app.slice(start, i + 1);
    }
  }
  throw new Error(`unterminated function: ${signature}`);
}

function loadMergeApi() {
  const root = {};
  vm.runInNewContext(ledgerCore, {
    window: root,
    globalThis: root,
    crypto: { randomUUID: () => "11111111-1111-4111-8111-111111111111" },
  });
  const sandbox = { window: root, globalThis: root, console };
  sandbox.window.LifeLedgerLedger = root.LifeLedgerLedger;
  const mergeSrc = extractFunctionSource("function mergeRemoteCloudPayload(");
  const validSrc = extractFunctionSource("function validCloudApplicationPayload(");
  vm.runInNewContext(`${validSrc}\n${mergeSrc}`, sandbox);
  return { ...sandbox, LifeLedgerLedger: root.LifeLedgerLedger };
}

test("mergeRemoteCloudPayload keeps local ledger when remote has none", () => {
  const ctx = loadMergeApi();
  const seed = { habits: [], logs: {}, ledger: undefined };
  const localLedger = ctx.LifeLedgerLedger.normalize(null, { lang: "en" });
  localLedger.transactions.push({
    id: "tx-local",
    accountId: localLedger.accounts[0].id,
    categoryId: localLedger.categories.find(c => c.kind === "expense").id,
    amountMinor: -100,
    currency: "EUR",
    date: "2026-11-02",
    note: "local",
    createdAt: 1,
    updatedAt: 1,
  });
  const remote = { habits: [], logs: {}, revision: 2 };
  const merged = ctx.mergeRemoteCloudPayload(remote, seed, v => JSON.parse(JSON.stringify(v)), localLedger);
  assert.ok(merged.ledger);
  assert.equal(merged.ledger.transactions.length, 1);
  assert.equal(merged.ledger.transactions[0].note, "local");
});

test("mergeRemoteCloudPayload adopts remote ledger when present", () => {
  const ctx = loadMergeApi();
  const seed = { habits: [], logs: {} };
  const remoteLedger = ctx.LifeLedgerLedger.normalize(null, { lang: "en" });
  const remote = { habits: [], logs: {}, ledger: remoteLedger, revision: 3 };
  const merged = ctx.mergeRemoteCloudPayload(remote, seed, v => JSON.parse(JSON.stringify(v)), null);
  assert.ok(merged.ledger);
  assert.equal(merged.ledger.version, 1);
});
