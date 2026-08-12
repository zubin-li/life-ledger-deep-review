import test from "node:test";
import assert from "node:assert/strict";
import { hashIdentity, normalizedTeamDomain, validPayload } from "../src/index.js";

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
