import test from "node:test";
import assert from "node:assert/strict";
import { SignJWT, exportJWK, generateKeyPair } from "jose";
import worker, { hashIdentity, identify } from "../src/index.js";

const TEAM = "https://team.cloudflareaccess.com", AUD = "aud-1";
const { publicKey, privateKey } = await generateKeyPair("RS256");
const jwk = { ...(await exportJWK(publicKey)), kid: "k1", alg: "RS256" };
const realFetch = globalThis.fetch;
globalThis.fetch = async (url, ...rest) => String(url).startsWith(TEAM) ? new Response(JSON.stringify({ keys: [jwk] }), { headers: { "content-type": "application/json" } }) : realFetch(url, ...rest);
const sign = claims => new SignJWT(claims).setProtectedHeader({ alg: "RS256", kid: "k1" }).setIssuer(TEAM).setAudience(AUD).setIssuedAt().setExpirationTime("5m").sign(privateKey);
const env = { TEAM_DOMAIN: TEAM, POLICY_AUD: AUD, INSIGHTS_CLIENT_ID: "svc.access", OWNER_EMAIL: "Owner@Example.com" };
const req = (token, path = "/api/state", init = {}) => new Request(`https://ll.example${path}`, { ...init, headers: { "cf-access-jwt-assertion": token, ...(init.headers || {}) } });

test("the publisher service token acts as the owner, only where allowed", async () => {
  const svc = await sign({ common_name: "svc.access" });
  assert.equal(await identify(req(svc), env, true), await hashIdentity("owner@example.com"));
  await assert.rejects(identify(req(svc), env, false), /not allowed/);
  await assert.rejects(identify(req(await sign({ common_name: "other" })), env, true), /not allowed/);
  await assert.rejects(identify(req(svc), { ...env, OWNER_EMAIL: "" }, true), /not allowed/);
  assert.equal(await identify(req(await sign({ email: "owner@example.com" })), env), await hashIdentity("owner@example.com"));
});

test("the service token cannot read state or read media, only upload media and import insights", async () => {
  const svc = await sign({ common_name: "svc.access" });
  const db = { prepare() { throw new Error("must not reach D1"); } };
  const photos = { get() { throw new Error("must not read R2"); } };
  assert.equal((await worker.fetch(req(svc), { ...env, DB: db })).status, 403);
  assert.equal((await worker.fetch(req(svc, "/api/wall/0123abcd-0123-4abc-a123-0123456789ab"), { ...env, PHOTOS: photos })).status, 403);
  assert.equal((await worker.fetch(req(svc, "/api/photos"), { ...env, PHOTOS: photos })).status, 403);
  const imp = await worker.fetch(req(svc, "/api/insights/import", { method: "POST", body: "{bad" }), { ...env, DB: db });
  assert.equal(imp.status, 400);
});
