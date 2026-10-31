import test from "node:test";
import assert from "node:assert/strict";
import worker, { readStateRow, writeStateRow } from "../src/index.js";

const KEY = "key-hash-1";

const statePayload = (label, updatedAt) => ({
  habits: [{ id: label }],
  logs: {},
  meta: { updatedAt },
});

// Minimal in-memory D1 stand-in. Each statement runs synchronously inside
// first(), so a conditional write is atomic exactly like a single D1 statement.
// Only the statements issued by src/index.js are understood; anything else throws.
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

const storedPayload = (db, keyHash = KEY) => JSON.parse(db.rows.get(keyHash).payload);

test("GET on an empty database returns 404", async () => {
  const db = createFakeD1();
  const result = await readStateRow(db, KEY);
  assert.equal(result.status, 404);
  assert.equal(result.body.error, "No cloud state yet");
});

test("GET exposes revision 0 for a legacy migrated row", async () => {
  const payload = statePayload("legacy", 100);
  const db = createFakeD1([{ key_hash: KEY, payload: JSON.stringify(payload), updated_at: 100, revision: 0 }]);
  const result = await readStateRow(db, KEY);
  assert.equal(result.status, 200);
  assert.deepEqual(result.body, { payload, updatedAt: 100, revision: 0 });
});

test("GET coerces a missing or invalid revision to a non-negative integer", async () => {
  const payload = statePayload("odd", 100);
  const db = createFakeD1([{ key_hash: KEY, payload: JSON.stringify(payload), updated_at: 100, revision: -3 }]);
  assert.equal((await readStateRow(db, KEY)).body.revision, 0);
  db.rows.get(KEY).revision = undefined;
  assert.equal((await readStateRow(db, KEY)).body.revision, 0);
});

test("first PUT with baseRevision 0 creates revision 1", async () => {
  const db = createFakeD1();
  const payload = statePayload("first", 100);
  const result = await writeStateRow(db, KEY, { payload, baseRevision: 0 });
  assert.equal(result.status, 200);
  assert.deepEqual(result.body, { ok: true, updatedAt: 100, revision: 1, applied: true });
  assert.deepEqual(storedPayload(db), payload);
  assert.equal(db.rows.get(KEY).revision, 1);
});

test("PUT with the matching baseRevision increments the revision by one", async () => {
  const db = createFakeD1();
  await writeStateRow(db, KEY, { payload: statePayload("first", 100), baseRevision: 0 });
  const second = statePayload("second", 200);
  const result = await writeStateRow(db, KEY, { payload: second, baseRevision: 1 });
  assert.equal(result.status, 200);
  assert.deepEqual(result.body, { ok: true, updatedAt: 200, revision: 2, applied: true });
  assert.deepEqual(storedPayload(db), second);
});

test("PUT with baseRevision 0 adopts a legacy migrated row", async () => {
  const db = createFakeD1([{ key_hash: KEY, payload: JSON.stringify(statePayload("legacy", 100)), updated_at: 100, revision: 0 }]);
  const result = await writeStateRow(db, KEY, { payload: statePayload("new", 50), baseRevision: 0 });
  assert.equal(result.status, 200);
  assert.equal(result.body.revision, 1);
  assert.equal(result.body.applied, true);
  assert.equal(storedPayload(db).habits[0].id, "new");
});

test("a stale concurrent PUT gets 409 with the winning copy and never overwrites", async () => {
  const db = createFakeD1();
  await writeStateRow(db, KEY, { payload: statePayload("base", 100), baseRevision: 0 });
  const winner = statePayload("winner", 300);
  const loser = statePayload("loser", 400);

  const [first, second] = await Promise.all([
    writeStateRow(db, KEY, { payload: winner, baseRevision: 1 }),
    writeStateRow(db, KEY, { payload: loser, baseRevision: 1 }),
  ]);

  assert.equal(first.status, 200);
  assert.deepEqual(first.body, { ok: true, updatedAt: 300, revision: 2, applied: true });
  assert.equal(second.status, 409);
  assert.equal(second.body.code, "STATE_CONFLICT");
  assert.equal(typeof second.body.error, "string");
  assert.deepEqual(second.body.payload, winner);
  assert.equal(second.body.updatedAt, 300);
  assert.equal(second.body.revision, 2);
  assert.deepEqual(storedPayload(db), winner);
  assert.equal(db.rows.get(KEY).revision, 2);
});

test("baseRevision 0 against an existing revisioned row conflicts without overwriting", async () => {
  const db = createFakeD1();
  const existing = statePayload("existing", 100);
  await writeStateRow(db, KEY, { payload: existing, baseRevision: 0 });
  const result = await writeStateRow(db, KEY, { payload: statePayload("blind", 900), baseRevision: 0 });
  assert.equal(result.status, 409);
  assert.equal(result.body.code, "STATE_CONFLICT");
  assert.deepEqual(result.body.payload, existing);
  assert.equal(result.body.revision, 1);
  assert.deepEqual(storedPayload(db), existing);
});

test("nonzero baseRevision against a missing row conflicts without inserting", async () => {
  const db = createFakeD1();
  const result = await writeStateRow(db, KEY, { payload: statePayload("ghost", 100), baseRevision: 3 });
  assert.equal(result.status, 409);
  assert.deepEqual(result.body, {
    error: result.body.error,
    code: "STATE_CONFLICT",
    payload: null,
    updatedAt: null,
    revision: 0,
  });
  assert.equal(db.rows.size, 0);
  assert.equal(db.writes.length, 0);
});

test("legacy PUT without baseRevision applies by timestamp and increments the revision", async () => {
  const db = createFakeD1();
  const created = await writeStateRow(db, KEY, { payload: statePayload("one", 100) });
  assert.equal(created.status, 200);
  assert.deepEqual(created.body, { ok: true, legacy: true, applied: true, updatedAt: 100, revision: 1 });

  const updated = await writeStateRow(db, KEY, { payload: statePayload("two", 100) });
  assert.deepEqual(updated.body, { ok: true, legacy: true, applied: true, updatedAt: 100, revision: 2 });
  assert.equal(storedPayload(db).habits[0].id, "two");
});

test("legacy PUT onto a migrated revision 0 row moves it to revision 1", async () => {
  const db = createFakeD1([{ key_hash: KEY, payload: JSON.stringify(statePayload("legacy", 100)), updated_at: 100, revision: 0 }]);
  const result = await writeStateRow(db, KEY, { payload: statePayload("newer", 200) });
  assert.deepEqual(result.body, { ok: true, legacy: true, applied: true, updatedAt: 200, revision: 1 });
});

test("legacy stale PUT returns applied:false and leaves stored state unchanged", async () => {
  const db = createFakeD1();
  const current = statePayload("current", 500);
  await writeStateRow(db, KEY, { payload: current, baseRevision: 0 });

  const result = await writeStateRow(db, KEY, { payload: statePayload("stale", 400) });
  assert.equal(result.status, 200);
  assert.deepEqual(result.body, { ok: true, legacy: true, applied: false, updatedAt: 500, revision: 1 });
  assert.deepEqual(storedPayload(db), current);
  assert.equal(db.rows.get(KEY).revision, 1);
});

test("invalid baseRevision values are rejected with 400 before any write", async () => {
  const db = createFakeD1();
  const payload = statePayload("x", 100);
  for (const baseRevision of [-1, 1.5, "1", null, true, Number.NaN, Number.MAX_SAFE_INTEGER + 2, {}, []]) {
    const result = await writeStateRow(db, KEY, { payload, baseRevision });
    assert.equal(result.status, 400, `baseRevision ${JSON.stringify(baseRevision)}`);
  }
  assert.equal(db.rows.size, 0);
  assert.equal(db.writes.length, 0);
});

test("invalid payloads are rejected with 400 on both protocols", async () => {
  const db = createFakeD1();
  for (const body of [null, {}, { payload: { habits: {}, logs: {} } }, { payload: { habits: [], logs: [] }, baseRevision: 0 }]) {
    const result = await writeStateRow(db, KEY, body);
    assert.equal(result.status, 400);
    assert.equal(result.body.error, "Invalid state payload");
  }
  assert.equal(db.writes.length, 0);
});

test("oversized state is rejected with 413", async () => {
  const db = createFakeD1();
  const payload = { habits: [{ note: "x".repeat(2_000_001) }], logs: {} };
  const result = await writeStateRow(db, KEY, { payload, baseRevision: 0 });
  assert.equal(result.status, 413);
  assert.equal(db.writes.length, 0);
});

test("the production state route still requires Cloudflare Access before touching D1", async () => {
  const db = {
    prepare() {
      throw new Error("D1 must not be used before authentication");
    },
  };
  const get = await worker.fetch(new Request("https://ledger.example/api/state"), { DB: db });
  assert.equal(get.status, 503);
  const put = await worker.fetch(new Request("https://ledger.example/api/state", {
    method: "PUT",
    body: JSON.stringify({ payload: statePayload("x", 1), baseRevision: 0 }),
  }), { DB: db });
  assert.equal(put.status, 503);
});
