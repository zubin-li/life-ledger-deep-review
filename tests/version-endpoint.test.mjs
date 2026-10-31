import test from "node:test";
import assert from "node:assert/strict";
import worker from "../src/index.js";
import {
  bindingFlags,
  handleVersionRequest,
  probeD1SchemaReadiness,
  versionPayload,
  versionStatus,
} from "../src/version-endpoint.js";
import {
  APP_NAME,
  APP_VERSION,
  BACKUP_SCHEMA_VERSION,
  D1_SCHEMA_REVISION,
  SYNC_PROTOCOL_VERSION,
} from "../src/release-metadata.js";

const json = (data, status = 200, extraHeaders = {}) => new Response(JSON.stringify(data), {
  status,
  headers: { "content-type": "application/json", ...extraHeaders },
});

function accessEnv(overrides = {}) {
  return {
    TEAM_DOMAIN: "https://team.cloudflareaccess.com",
    POLICY_AUD: "test-audience",
    DB: overrides.db,
    PHOTOS: {},
    AI: {},
    BUILD_SHA: "abc123",
    ...overrides,
  };
}

function createD1({ revisionColumn = true } = {}) {
  return {
    prepare(sql) {
      const text = sql.replace(/\s+/g, " ").trim();
      return {
        bind: () => ({
          first: async () => {
            if (text.includes("pragma_table_info")) {
              return { column_count: revisionColumn ? 1 : 0 };
            }
            throw new Error(`Unexpected SQL: ${text}`);
          },
        }),
      };
    },
  };
}

const identityOk = async () => ({ keyHash: "hash" });
const identity401 = async () => ({ response: json({ error: "Cloudflare Access login required" }, 401) });

test("GET /api/version requires Access before D1 probes", async () => {
  const db = {
    prepare() {
      throw new Error("D1 must not run before auth");
    },
  };
  const response = await worker.fetch(new Request("https://ledger.example/api/version"), accessEnv({ db }));
  assert.equal(response.status, 401);
});

test("non-GET methods return 405", async () => {
  const response = await handleVersionRequest(
    new Request("https://ledger.example/api/version", { method: "POST" }),
    accessEnv({ db: createD1() }),
    { identityOrResponse: identityOk, json },
  );
  assert.equal(response.status, 405);
  assert.equal(response.headers.get("Allow"), "GET");
});

test("authenticated ready response exposes safe fields only", async () => {
  const response = await handleVersionRequest(
    new Request("https://ledger.example/api/version", {
      headers: { "cf-access-jwt-assertion": "unused-in-mock" },
    }),
    accessEnv({ db: createD1() }),
    { identityOrResponse: identityOk, json },
  );
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.app, APP_NAME);
  assert.equal(body.version, APP_VERSION);
  assert.equal(body.buildSha, "abc123");
  assert.equal(body.deploymentMode, "cloudflare");
  assert.deepEqual(body.expected, {
    d1SchemaRevision: D1_SCHEMA_REVISION,
    backupSchemaVersion: BACKUP_SCHEMA_VERSION,
    syncProtocolVersion: SYNC_PROTOCOL_VERSION,
  });
  assert.deepEqual(body.bindings, {
    d1Bound: true,
    r2Bound: true,
    workersAiBound: true,
    accessConfigured: true,
  });
  assert.equal(body.readiness.ready, true);
  assert.equal(body.readiness.d1.revisionColumnReady, true);
  assert.equal(body.email, undefined);
  assert.equal(body.keyHash, undefined);
});

test("missing revision column yields 503 readiness", async () => {
  const payload = versionPayload(accessEnv({ db: createD1({ revisionColumn: false }) }), {
    bindingPresent: true,
    revisionColumnReady: false,
  });
  assert.equal(versionStatus(payload), 503);
  assert.equal(payload.readiness.ready, false);
});

test("probeD1SchemaReadiness handles missing binding", async () => {
  const probe = await probeD1SchemaReadiness(undefined);
  assert.equal(probe.bindingPresent, false);
  assert.equal(probe.revisionColumnReady, false);
});

test("bindingFlags reflects Access configuration", () => {
  assert.equal(bindingFlags({ DB: {}, PHOTOS: {}, AI: {} }).accessConfigured, false);
  assert.equal(bindingFlags(accessEnv()).accessConfigured, true);
});

test("/api/health/version aliases the same handler", async () => {
  const response = await worker.fetch(
    new Request("https://ledger.example/api/health/version"),
    { ...accessEnv({ db: createD1() }), TEAM_DOMAIN: "", POLICY_AUD: "" },
  );
  assert.equal(response.status, 503);
});

test("auth failure short-circuits before readiness", async () => {
  const response = await handleVersionRequest(
    new Request("https://ledger.example/api/version"),
    accessEnv({ db: createD1() }),
    { identityOrResponse: identity401, json },
  );
  assert.equal(response.status, 401);
});
