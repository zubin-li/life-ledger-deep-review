// QA mirror of production functions/_state.js for overnight fakecloud (read-only reference copy).

function validPayload(payload) {
  return payload
    && Array.isArray(payload.habits)
    && payload.logs
    && typeof payload.logs === "object"
    && !Array.isArray(payload.logs);
}

function stateRevision(value) {
  const revision = Number(value);
  return Number.isSafeInteger(revision) && revision >= 0 ? revision : 0;
}

function validBaseRevision(value) {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0;
}

async function readStateRow(db, keyHash) {
  const row = await db.prepare(
    "SELECT payload, updated_at, revision FROM states WHERE key_hash = ?",
  ).bind(keyHash).first();

  if (!row) return { status: 404, body: { error: "No cloud state yet" } };
  return {
    status: 200,
    body: {
      payload: JSON.parse(row.payload),
      updatedAt: row.updated_at,
      revision: stateRevision(row.revision),
    },
  };
}

async function stateConflict(db, keyHash) {
  const current = await readStateRow(db, keyHash);
  const remote = current.status === 200
    ? current.body
    : { payload: null, updatedAt: null, revision: 0 };
  return {
    status: 409,
    body: {
      error: "Cloud state changed since your last sync",
      code: "STATE_CONFLICT",
      payload: remote.payload,
      updatedAt: remote.updatedAt,
      revision: remote.revision,
    },
  };
}

async function compareAndSwapState(db, keyHash, serialized, updatedAt, baseRevision) {
  const row = baseRevision === 0
    ? await db.prepare(`
      INSERT INTO states (key_hash, payload, updated_at, revision)
      VALUES (?, ?, ?, 1)
      ON CONFLICT(key_hash) DO UPDATE SET
        payload = excluded.payload,
        updated_at = excluded.updated_at,
        revision = states.revision + 1
      WHERE states.revision = ?
      RETURNING updated_at, revision
    `).bind(keyHash, serialized, updatedAt, baseRevision).first()
    : await db.prepare(`
      UPDATE states
      SET payload = ?, updated_at = ?, revision = revision + 1
      WHERE key_hash = ? AND revision = ?
      RETURNING updated_at, revision
    `).bind(serialized, updatedAt, keyHash, baseRevision).first();

  if (!row) return stateConflict(db, keyHash);
  return {
    status: 200,
    body: { ok: true, updatedAt: row.updated_at, revision: stateRevision(row.revision), applied: true },
  };
}

async function legacyTimestampWriteState(db, keyHash, serialized, updatedAt) {
  const row = await db.prepare(`
    INSERT INTO states (key_hash, payload, updated_at, revision)
    VALUES (?, ?, ?, 1)
    ON CONFLICT(key_hash) DO UPDATE SET
      payload = excluded.payload,
      updated_at = excluded.updated_at,
      revision = states.revision + 1
    WHERE excluded.updated_at >= states.updated_at
    RETURNING updated_at, revision
  `).bind(keyHash, serialized, updatedAt).first();

  if (row) {
    return {
      status: 200,
      body: { ok: true, legacy: true, applied: true, updatedAt: row.updated_at, revision: stateRevision(row.revision) },
    };
  }

  const current = await readStateRow(db, keyHash);
  return {
    status: 200,
    body: {
      ok: true,
      legacy: true,
      applied: false,
      updatedAt: current.status === 200 ? current.body.updatedAt : null,
      revision: current.status === 200 ? current.body.revision : 0,
    },
  };
}

async function writeStateRow(db, keyHash, body) {
  if (!validPayload(body?.payload)) return { status: 400, body: { error: "Invalid state payload" } };

  const legacy = !("baseRevision" in body);
  if (!legacy && !validBaseRevision(body.baseRevision)) {
    return { status: 400, body: { error: "Invalid baseRevision" } };
  }

  const serialized = JSON.stringify(body.payload);
  if (serialized.length > 2_000_000) return { status: 413, body: { error: "State is too large" } };

  const updatedAt = Number(body.payload.meta?.updatedAt) || Date.now();
  if (legacy) return legacyTimestampWriteState(db, keyHash, serialized, updatedAt);
  return compareAndSwapState(db, keyHash, serialized, updatedAt, body.baseRevision);
}

export { readStateRow, writeStateRow, validPayload };
