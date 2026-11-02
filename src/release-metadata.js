/** Canonical release constants for Worker, tooling, and drift tests. Keep in sync with package.json and migrations. */
export const APP_NAME = "life-ledger-deep-review";
export const APP_VERSION = "2.0.9";
export const D1_SCHEMA_REVISION = 6;
export const BACKUP_SCHEMA_VERSION = 3;
export const SYNC_PROTOCOL_VERSION = 2;
export const DEPLOYMENT_MODE = "cloudflare";
export const WORKER_TOPOLOGY = Object.freeze({
  workerEntry: "src/index.js",
  assetsDirectory: "public",
  bindings: Object.freeze({
    d1: "DB",
    r2: "PHOTOS",
    workersAi: "AI",
    assets: "ASSETS",
  }),
});

export function defaultBuildSha(env = {}) {
  const value = String(env.BUILD_SHA || "").trim();
  return value || "development";
}
