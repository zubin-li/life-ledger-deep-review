import test from "node:test";
import assert from "node:assert/strict";

await import("../public/cloudbase-sync.js");

const { deploymentConfig, createAdapter } = globalThis.LifeLedgerCloudBase;

test("CloudBase deployment requires an environment ID and publishable key", () => {
  assert.equal(deploymentConfig({ _tcbEnv: { LIFE_LEDGER_SYNC_PROVIDER: "cloudbase" } }).configured, false);
  assert.deepEqual(
    deploymentConfig({
      _tcbEnv: {
        LIFE_LEDGER_SYNC_PROVIDER: "cloudbase",
        TCB_ENV_ID: "example-env",
        TCB_ACCESS_KEY: "public-key",
      },
    }),
    {
      configured: true,
      envId: "example-env",
      accessKey: "public-key",
      region: "ap-shanghai",
    },
  );
});

test("CloudBase adapter signs in and stores one private state per account", async () => {
  const session = { user: { id: "user-123" }, session: { access_token: "token" } };
  let storedDocument = null;
  let queriedOwner = "";
  let verifiedToken = "";

  const collection = {
    where(query) {
      queriedOwner = query.ownerId;
      return {
        limit() {
          return { get: async () => ({ data: storedDocument ? [storedDocument] : [] }) };
        },
      };
    },
    doc() {
      return {
        update: async update => {
          storedDocument = { ...storedDocument, ...update };
          return { updated: 1 };
        },
      };
    },
    async add(document) {
      storedDocument = { _id: "state-1", ...document };
      return { id: "state-1" };
    },
  };
  const auth = {
    getSession: async () => ({ data: session, error: null }),
    signInWithOtp: async () => ({
      data: {
        verifyOtp: async ({ token }) => {
          verifiedToken = token;
          return { data: session, error: null };
        },
      },
      error: null,
    }),
    signOut: async () => ({ data: {}, error: null }),
  };
  const cloudbase = {
    init: () => ({ auth, database: () => ({ collection: () => collection }) }),
  };
  const adapter = createAdapter({
    config: { configured: true, envId: "example-env", accessKey: "public-key", region: "ap-shanghai" },
    sdkLoader: async () => cloudbase,
  });

  await adapter.sendEmailCode("person@example.com");
  await adapter.signInWithEmailCode("person@example.com", "123456");
  await adapter.putState({ meta: { updatedAt: 42 }, habits: [], logs: {} });
  const saved = await adapter.getState();

  assert.equal(verifiedToken, "123456");
  assert.equal(queriedOwner, "user-123");
  assert.equal(storedDocument.ownerId, "user-123");
  assert.equal(saved.updatedAt, 42);
});
