import { createRemoteJWKSet, jwtVerify } from "jose";

const json = (data, status = 200) => new Response(JSON.stringify(data), {
  status,
  headers: {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
    "x-content-type-options": "nosniff",
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

async function getState(request, env) {
  const identity = await identityOrResponse(request, env);
  if (identity.response) return identity.response;
  const { keyHash } = identity;

  const row = await env.DB.prepare(
    "SELECT payload, updated_at FROM states WHERE key_hash = ?",
  ).bind(keyHash).first();

  if (!row) return json({ error: "No cloud state yet" }, 404);
  return json({ payload: JSON.parse(row.payload), updatedAt: row.updated_at });
}

async function putState(request, env) {
  const identity = await identityOrResponse(request, env);
  if (identity.response) return identity.response;
  const { keyHash } = identity;

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  if (!validPayload(body?.payload)) return json({ error: "Invalid state payload" }, 400);

  const serialized = JSON.stringify(body.payload);
  if (serialized.length > 2_000_000) return json({ error: "State is too large" }, 413);

  const updatedAt = Number(body.payload.meta?.updatedAt) || Date.now();
  const result = await env.DB.prepare(`
    INSERT INTO states (key_hash, payload, updated_at)
    VALUES (?, ?, ?)
    ON CONFLICT(key_hash) DO UPDATE SET
      payload = excluded.payload,
      updated_at = excluded.updated_at
    WHERE excluded.updated_at >= states.updated_at
  `).bind(keyHash, serialized, updatedAt).run();

  if (!result.success) return json({ error: "Unable to save state" }, 500);
  return json({ ok: true, updatedAt });
}

async function handleApi(request, env) {
  if (!env.DB) return json({ error: "D1 binding is not configured" }, 503);
  if (request.method === "GET") return getState(request, env);
  if (request.method === "PUT") return putState(request, env);
  return json({ error: "Method not allowed" }, 405);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/deployment-mode.js") {
      return javascript('window.LIFE_LEDGER_DEPLOYMENT_MODE = "cloudflare";\n');
    }
    if (url.pathname === "/api/state") return handleApi(request, env);
    if (url.pathname.startsWith("/api/")) return json({ error: "Not found" }, 404);
    return env.ASSETS.fetch(request);
  },
};

export { hashIdentity, identify, normalizedTeamDomain, validPayload };
