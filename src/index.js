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
  const requestUrl = new URL(request.url);
  const localIdentity = String(env.LOCAL_DEV_IDENTITY || "").trim();
  if (["127.0.0.1", "localhost"].includes(requestUrl.hostname) && localIdentity) {
    return hashIdentity(localIdentity);
  }

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

const MAX_MEDIA_BYTES = 2_500_000;
const allowedMediaTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const validMediaId = value => /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value || "");

function mediaObjectKey(keyHash, id) {
  return `${keyHash}/${id}`;
}

async function handleMedia(request, env, url) {
  if (url.pathname === "/api/media/capabilities") {
    return json({ enabled: Boolean(env.MEDIA), maxBytes: MAX_MEDIA_BYTES });
  }
  if (!env.MEDIA) return json({ error: "R2 media binding is not configured" }, 503);

  const identity = await identityOrResponse(request, env);
  if (identity.response) return identity.response;
  const { keyHash } = identity;
  const id = url.pathname.split("/").filter(Boolean)[2] || "";

  if (request.method === "POST" && url.pathname === "/api/media") {
    const contentType = (request.headers.get("content-type") || "").split(";")[0].toLowerCase();
    if (!allowedMediaTypes.has(contentType)) return json({ error: "Unsupported image type" }, 415);
    const declaredLength = Number(request.headers.get("content-length")) || 0;
    if (declaredLength > MAX_MEDIA_BYTES) return json({ error: "Image is too large" }, 413);
    const body = await request.arrayBuffer();
    if (!body.byteLength || body.byteLength > MAX_MEDIA_BYTES) return json({ error: "Image is too large" }, 413);

    const mediaId = crypto.randomUUID();
    const date = String(request.headers.get("x-life-ledger-date") || "").slice(0, 10);
    await env.MEDIA.put(mediaObjectKey(keyHash, mediaId), body, {
      httpMetadata: { contentType },
      customMetadata: /^\d{4}-\d{2}-\d{2}$/.test(date) ? { date } : {},
    });
    return json({ id: mediaId, bytes: body.byteLength }, 201);
  }

  if (!validMediaId(id)) return json({ error: "Invalid media id" }, 400);
  const key = mediaObjectKey(keyHash, id);
  if (request.method === "GET") {
    const object = await env.MEDIA.get(key);
    if (!object) return json({ error: "Photo not found" }, 404);
    const headers = new Headers({
      "cache-control": "private, max-age=3600",
      "content-security-policy": "default-src 'none'",
      "x-content-type-options": "nosniff",
    });
    object.writeHttpMetadata(headers);
    headers.set("etag", object.httpEtag);
    return new Response(object.body, { headers });
  }
  if (request.method === "DELETE") {
    await env.MEDIA.delete(key);
    return json({ ok: true });
  }
  return json({ error: "Method not allowed" }, 405);
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
    if (url.pathname === "/api/media" || url.pathname.startsWith("/api/media/")) return handleMedia(request, env, url);
    if (url.pathname.startsWith("/api/")) return json({ error: "Not found" }, 404);
    return env.ASSETS.fetch(request);
  },
};

export { hashIdentity, identify, normalizedTeamDomain, validPayload, validMediaId };
