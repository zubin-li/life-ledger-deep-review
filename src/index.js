import { createRemoteJWKSet, jwtVerify } from "jose";
import { VoiceRequestError, handleVoiceReview } from "./voice.js";
import { CalendarRequestError, handleCalendarRequest } from "./calendar.js";
import { PhotoRequestError, handlePhotoRequest } from "./photos.js";
import { handleWallRequest } from "./wall.js";
import { handleVersionRequest, isVersionPath } from "./version-endpoint.js";

const json = (data, status = 200, extraHeaders = {}) => new Response(JSON.stringify(data), {
  status,
  headers: {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
    "x-content-type-options": "nosniff",
    ...extraHeaders,
  },
});

const javascript = source => new Response(source, {
  headers: {
    "content-type": "text/javascript; charset=utf-8",
    "cache-control": "no-store",
    "x-content-type-options": "nosniff",
  },
});

async function hashIdentity(identity) {
  const bytes = new TextEncoder().encode(identity.trim().toLowerCase());
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)]
    .map(byte => byte.toString(16).padStart(2, "0"))
    .join("");
}

class AccessError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

const jwksByDomain = new Map();

function normalizedTeamDomain(value) {
  if (!value) return "";
  const url = new URL(value.startsWith("https://") ? value : `https://${value}`);
  if (url.protocol !== "https:" || !url.hostname.endsWith(".cloudflareaccess.com")) return "";
  return url.origin;
}

async function identify(request, env) {
  const teamDomain = normalizedTeamDomain(env.TEAM_DOMAIN);
  const audience = String(env.POLICY_AUD || "").trim();
  if (!teamDomain || !audience) {
    throw new AccessError("Cloudflare Access JWT validation is not configured", 503);
  }

  const token = request.headers.get("cf-access-jwt-assertion");
  if (!token) throw new AccessError("Cloudflare Access login required", 401);

  try {
    if (!jwksByDomain.has(teamDomain)) {
      jwksByDomain.set(
        teamDomain,
        createRemoteJWKSet(new URL(`${teamDomain}/cdn-cgi/access/certs`)),
      );
    }
    const { payload } = await jwtVerify(token, jwksByDomain.get(teamDomain), {
      issuer: teamDomain,
      audience,
      algorithms: ["RS256"],
    });
    if (typeof payload.email !== "string" || !payload.email.includes("@")) {
      throw new AccessError("Authenticated identity has no email", 403);
    }
    return hashIdentity(payload.email);
  } catch (error) {
    if (error instanceof AccessError) throw error;
    throw new AccessError("Invalid Cloudflare Access token", 401);
  }
}

async function identityOrResponse(request, env) {
  try {
    return { keyHash: await identify(request, env) };
  } catch (error) {
    if (error instanceof AccessError) return { response: json({ error: error.message }, error.status) };
    return { response: json({ error: "Unable to validate identity" }, 500) };
  }
}

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

// Reads the stored state row. Returns an `{ status, body }` result (no JWT involved).
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

// Current remote copy for a rejected compare-and-swap. A missing row yields a
// deterministic empty copy (payload/updatedAt null, revision 0).
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

// New-client write. The conditional INSERT/UPDATE itself decides the winner;
// the statement only affects a row when its revision equals `baseRevision`.
async function compareAndSwapState(db, keyHash, serialized, updatedAt, baseRevision) {
  const row = baseRevision === 0
    // Creates the row, or adopts a legacy-migrated row that is still at revision 0.
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
    // Never inserts: a missing row cannot match a nonzero base revision.
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

// LEGACY: cached old clients send no `baseRevision`. Keep timestamp ordering and
// remove this whole branch once those clients have expired.
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

  // Stale write: nothing was stored. Report the actual current copy's metadata.
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

// Validates a PUT body and writes it. Authentication is the caller's concern.
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

async function getState(request, env) {
  const identity = await identityOrResponse(request, env);
  if (identity.response) return identity.response;

  const result = await readStateRow(env.DB, identity.keyHash);
  return json(result.body, result.status);
}

async function putState(request, env) {
  const identity = await identityOrResponse(request, env);
  if (identity.response) return identity.response;

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  const result = await writeStateRow(env.DB, identity.keyHash, body);
  return json(result.body, result.status);
}

async function handleApi(request, env) {
  if (!env.DB) return json({ error: "D1 binding is not configured" }, 503);
  if (request.method === "GET") return getState(request, env);
  if (request.method === "PUT") return putState(request, env);
  return json({ error: "Method not allowed" }, 405);
}

async function handleVoiceApi(request, env) {
  if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);
  if (!env.DB) return json({ error: "D1 binding is not configured" }, 503);
  const identity = await identityOrResponse(request, env);
  if (identity.response) return identity.response;
  try {
    return json(await handleVoiceReview(request, env, identity.keyHash));
  } catch (error) {
    if (error instanceof VoiceRequestError) {
      return json({ error: error.message, code: error.code }, error.status);
    }
    const requestId = crypto.randomUUID();
    console.error("Voice review failed", { requestId, name: error?.name || "Error" });
    return json({ error: "Voice review could not be completed", code: "VOICE_PROCESSING_FAILED", requestId }, 502);
  }
}

async function handleCalendarApi(request, env) {
  const identity = await identityOrResponse(request, env);
  if (identity.response) return identity.response;
  try {
    return await handleCalendarRequest(request, env, identity.keyHash);
  } catch (error) {
    if (error instanceof CalendarRequestError) {
      return json({ error: error.message, code: error.code }, error.status);
    }
    const requestId = crypto.randomUUID();
    console.error("Calendar request failed", { requestId, name: error?.name || "Error" });
    return json({ error: "Calendar request could not be completed", code: "CALENDAR_FAILED", requestId }, 502);
  }
}

async function handlePhotoApi(request, env, handler = handlePhotoRequest) {
  const identity = await identityOrResponse(request, env);
  if (identity.response) return identity.response;
  try {
    return await handler(request, env, identity.keyHash);
  } catch (error) {
    if (error instanceof PhotoRequestError) {
      return json({ error: error.message, code: error.code }, error.status);
    }
    const requestId = crypto.randomUUID();
    console.error("Photo request failed", { requestId, name: error?.name || "Error" });
    return json({ error: "Photo request could not be completed", code: "PHOTO_FAILED", requestId }, 502);
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/deployment-mode.js") {
      return javascript('window.LIFE_LEDGER_DEPLOYMENT_MODE = "cloudflare";\n');
    }
    if (isVersionPath(url.pathname)) {
      return handleVersionRequest(request, env, { identityOrResponse, json });
    }
    if (url.pathname === "/api/state") return handleApi(request, env);
    if (url.pathname === "/api/voice-review") return handleVoiceApi(request, env);
    if (url.pathname.startsWith("/api/calendar/")) return handleCalendarApi(request, env);
    if (url.pathname.startsWith("/api/photos")) return handlePhotoApi(request, env);
    if (url.pathname.startsWith("/api/wall/")) return handlePhotoApi(request, env, handleWallRequest);
    if (url.pathname.startsWith("/api/")) return json({ error: "Not found" }, 404);
    return env.ASSETS.fetch(request);
  },
};

export { hashIdentity, identify, normalizedTeamDomain, readStateRow, validPayload, writeStateRow };
