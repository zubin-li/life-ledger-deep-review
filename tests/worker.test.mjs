import test from "node:test";
import assert from "node:assert/strict";
import worker, { hashIdentity, normalizedTeamDomain, validPayload, validMediaId } from "../src/index.js";

test("validPayload accepts the minimum application state", () => {
  assert.equal(validPayload({ habits: [], logs: {} }), true);
  assert.equal(validPayload({ habits: {}, logs: {} }), false);
  assert.equal(validPayload({ habits: [], logs: [] }), false);
});

test("hashIdentity normalizes an email before hashing", async () => {
  const first = await hashIdentity(" Person@Example.com ");
  const second = await hashIdentity("person@example.com");

  assert.equal(first, second);
  assert.match(first, /^[a-f0-9]{64}$/);
});

test("normalizedTeamDomain accepts only Cloudflare Access HTTPS domains", () => {
  assert.equal(
    normalizedTeamDomain("example.cloudflareaccess.com"),
    "https://example.cloudflareaccess.com",
  );
  assert.equal(normalizedTeamDomain("https://malicious.example.com"), "");
  assert.equal(normalizedTeamDomain(""), "");
});

test("Cloudflare serves an explicit deployment mode without touching D1", async () => {
  const response = await worker.fetch(new Request("https://ledger.example/deployment-mode.js"), {});
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type"), /text\/javascript/);
  assert.equal(await response.text(), 'window.LIFE_LEDGER_DEPLOYMENT_MODE = "cloudflare";\n');
});

function createFakeBucket() {
  const objects = new Map();
  return {
    objects,
    async put(key, value, options = {}) {
      const bytes = value instanceof ArrayBuffer ? new Uint8Array(value) : new Uint8Array(await new Response(value).arrayBuffer());
      objects.set(key, { bytes, options });
    },
    async get(key) {
      const stored = objects.get(key);
      if (!stored) return null;
      return {
        body: stored.bytes,
        httpEtag: '"local-etag"',
        writeHttpMetadata(headers) {
          headers.set("content-type", stored.options.httpMetadata?.contentType || "application/octet-stream");
        },
      };
    },
    async delete(key) { objects.delete(key); },
  };
}

test("media capabilities stay disabled without an R2 binding", async () => {
  const response = await worker.fetch(new Request("https://ledger.example/api/media/capabilities"), {});
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { enabled: false, maxBytes: 2_500_000 });
});

test("local self-hosted preview stores, reads and deletes a user-scoped photo", async () => {
  const MEDIA = createFakeBucket();
  const env = { MEDIA, LOCAL_DEV_IDENTITY: "preview@example.invalid" };
  const uploaded = await worker.fetch(new Request("http://127.0.0.1/api/media", {
    method: "POST",
    headers: { "content-type": "image/webp", "x-life-ledger-date": "2026-08-18" },
    body: new Uint8Array([1, 2, 3, 4]),
  }), env);
  assert.equal(uploaded.status, 201);
  const result = await uploaded.json();
  assert.equal(validMediaId(result.id), true);
  assert.equal(result.bytes, 4);

  const read = await worker.fetch(new Request(`http://127.0.0.1/api/media/${result.id}`), env);
  assert.equal(read.status, 200);
  assert.equal(read.headers.get("content-type"), "image/webp");
  assert.deepEqual([...new Uint8Array(await read.arrayBuffer())], [1, 2, 3, 4]);

  const removed = await worker.fetch(new Request(`http://127.0.0.1/api/media/${result.id}`, { method: "DELETE" }), env);
  assert.equal(removed.status, 200);
  const missing = await worker.fetch(new Request(`http://127.0.0.1/api/media/${result.id}`), env);
  assert.equal(missing.status, 404);
});

test("media upload rejects unsupported and oversized bodies", async () => {
  const env = { MEDIA: createFakeBucket(), LOCAL_DEV_IDENTITY: "preview@example.invalid" };
  const unsupported = await worker.fetch(new Request("http://localhost/api/media", {
    method: "POST",
    headers: { "content-type": "image/svg+xml" },
    body: "<svg />",
  }), env);
  assert.equal(unsupported.status, 415);

  const oversized = await worker.fetch(new Request("http://localhost/api/media", {
    method: "POST",
    headers: { "content-type": "image/jpeg", "content-length": "2500001" },
    body: new Uint8Array([1]),
  }), env);
  assert.equal(oversized.status, 413);
});
