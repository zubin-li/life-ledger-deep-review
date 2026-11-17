import test from "node:test";
import assert from "node:assert/strict";
import { readStateRow, compareAndSwapState } from "../src/index.js";
import { importInsightsWeek } from "../src/insights-import.js";

const KEY = "owner-hash";
function createFakeD1(seedRows = []) {
  const rows = new Map(seedRows.map(row => [row.key_hash, { ...row }]));
  const writes = [];

  function execute(sql, args) {
    if (sql.startsWith("SELECT payload, updated_at, revision FROM states")) {
      const row = rows.get(args[0]);
      return row ? { ...row } : null;
    }

    if (sql.startsWith("INSERT INTO states")) {
      const [keyHash, payload, updatedAt] = args;
      const existing = rows.get(keyHash);
      let allowed;
      if (!existing) allowed = true;
      else if (sql.includes("WHERE states.revision = ?")) allowed = existing.revision === args[3];
      else if (sql.includes("WHERE excluded.updated_at >= states.updated_at")) allowed = updatedAt >= existing.updated_at;
      else throw new Error(`Unexpected upsert guard: ${sql}`);
      if (!allowed) return null;
      const next = { key_hash: keyHash, payload, updated_at: updatedAt, revision: existing ? existing.revision + 1 : 1 };
      rows.set(keyHash, next);
      writes.push(sql);
      return { updated_at: next.updated_at, revision: next.revision };
    }

    if (sql.startsWith("UPDATE states")) {
      const [payload, updatedAt, keyHash, baseRevision] = args;
      const existing = rows.get(keyHash);
      if (!existing || existing.revision !== baseRevision) return null;
      const next = { ...existing, payload, updated_at: updatedAt, revision: existing.revision + 1 };
      rows.set(keyHash, next);
      writes.push(sql);
      return { updated_at: next.updated_at, revision: next.revision };
    }

    throw new Error(`Unexpected SQL: ${sql}`);
  }

  return {
    rows,
    writes,
    prepare(sql) {
      const text = sql.replace(/\s+/g, " ").trim();
      return {
        bind: (...args) => ({
          first: async () => execute(text, args),
          run: async () => ({ success: true, meta: { changes: execute(text, args) ? 1 : 0 } }),
        }),
      };
    },
  };
}


const week = (items, w = "2026-W46") => ({ format: "life-ledger-insights", version: 1, week: w, items });
const ID = "0123abcd-0123-4abc-a123-0123456789ab";
const deps = { read: readStateRow, swap: compareAndSwapState, now: 100 };

test("publisher import merges a week, keeps marks and tombstones, and never touches other data", async () => {
  const insights = { weeks: {}, marks: { "2026-W46:a": { mark: "agree", updatedAt: 5 } }, deleted: { "2026-W46:b": 6 } };
  const db = createFakeD1([{ key_hash: KEY, payload: JSON.stringify({ habits: [{ id: "h" }], logs: { x: 1 }, insights }), updated_at: 1, revision: 3 }]);
  const r = await importInsightsWeek(db, KEY, week([
    { id: "a", title: "A", images: [{ id: ID, type: "image/webp", size: 9, w: 1179, h: 2556 }] },
    { id: "b", title: "B" },
  ]), deps);
  assert.equal(r.status, 200);
  assert.equal(r.body.revision, 4);
  const saved = JSON.parse(db.rows.get(KEY).payload);
  assert.deepEqual(saved.habits, [{ id: "h" }]);
  assert.deepEqual(saved.logs, { x: 1 });
  assert.equal(saved.insights.weeks["2026-W46"].items[0].images[0].id, ID);
  assert.equal(saved.insights.marks["2026-W46:a"].mark, "agree");
  assert.equal(saved.insights.deleted["2026-W46:b"], 6);
});

test("publisher import retries when a device saves in between, and rejects bad input", async () => {
  const db = createFakeD1([{ key_hash: KEY, payload: JSON.stringify({ habits: [], logs: {} }), updated_at: 1, revision: 1 }]);
  let raced = false;
  const read = async (d, k) => {
    const row = await readStateRow(d, k);
    if (!raced) { raced = true; const cur = db.rows.get(KEY); db.rows.set(KEY, { ...cur, payload: JSON.stringify({ habits: [{ id: "phone" }], logs: {} }), revision: 2 }); }
    return row;
  };
  const r = await importInsightsWeek(db, KEY, week([{ id: "a", title: "A" }]), { ...deps, read });
  assert.equal(r.status, 200);
  const saved = JSON.parse(db.rows.get(KEY).payload);
  assert.deepEqual(saved.habits, [{ id: "phone" }]);
  assert.equal(saved.insights.weeks["2026-W46"].items.length, 1);
  assert.equal((await importInsightsWeek(db, KEY, { week: "x" }, deps)).status, 400);
  assert.equal((await importInsightsWeek(createFakeD1(), KEY, week([{ id: "a", title: "A" }]), deps)).body.code, "NO_STATE");
});
