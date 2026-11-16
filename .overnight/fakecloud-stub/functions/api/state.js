// QA mirror of production /api/state for overnight fakecloud (local Pages dev only).
import { readStateRow, writeStateRow } from "../_state.js";

const json = (data, status = 200) => new Response(JSON.stringify(data), {
  status,
  headers: {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
    "x-content-type-options": "nosniff",
  },
});

async function hashIdentity(identity) {
  const bytes = new TextEncoder().encode(identity.trim().toLowerCase());
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map(b => b.toString(16).padStart(2, "0")).join("");
}

async function identify(request) {
  const email = request.headers.get("CF-Access-Authenticated-User-Email") || "";
  if (!email || !email.includes("@")) return null;
  return hashIdentity(email);
}

export async function onRequestGet({ request, env }) {
  const keyHash = await identify(request);
  if (!keyHash) return json({ error: "Cloudflare Access login required" }, 401);
  const result = await readStateRow(env.DB, keyHash);
  return json(result.body, result.status);
}

export async function onRequestPut({ request, env }) {
  const keyHash = await identify(request);
  if (!keyHash) return json({ error: "Cloudflare Access login required" }, 401);
  let body;
  try { body = await request.json(); } catch { return json({ error: "Invalid JSON" }, 400); }
  const result = await writeStateRow(env.DB, keyHash, body);
  return json(result.body, result.status);
}
