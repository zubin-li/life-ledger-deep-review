import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import {
  APP_VERSION,
  BACKUP_SCHEMA_VERSION,
  D1_SCHEMA_REVISION,
  SYNC_PROTOCOL_VERSION,
  WORKER_TOPOLOGY,
} from "../src/release-metadata.js";

const root = new URL("../", import.meta.url);

function read(path) {
  return readFileSync(new URL(path, root), "utf8");
}

test("package.json version matches release metadata", () => {
  const pkg = JSON.parse(read("package.json"));
  assert.equal(pkg.version, APP_VERSION);
});

test("latest D1 migration matches expected schema revision", () => {
  const files = readdirSync(new URL("migrations/", root)).filter(name => /^\d+_.+\.sql$/.test(name));
  const numbers = files.map(name => Number(name.split("_")[0]));
  assert.equal(Math.max(...numbers), D1_SCHEMA_REVISION);
  assert.ok(read(`migrations/000${D1_SCHEMA_REVISION}_state_revision.sql`).includes("revision"));
});

test("public cache bust markers match APP_VERSION", () => {
  const index = read("public/index.html");
  const sw = read("public/sw.js");
  const app = read("public/app.js");
  assert.match(index, new RegExp(`\\?v=${APP_VERSION.replace(/\./g, "\\.")}`));
  assert.match(sw, new RegExp(`life-ledger-pwa-${APP_VERSION.replace(/\./g, "\\.")}`));
  assert.match(app, new RegExp(`^const BACKUP_SCHEMA_VERSION = ${BACKUP_SCHEMA_VERSION};`, "m"));
});

test("sync protocol constant documents CAS revision protocol", () => {
  assert.equal(SYNC_PROTOCOL_VERSION, 2);
  const worker = read("src/index.js");
  assert.match(worker, /compareAndSwapState/);
  assert.match(worker, /baseRevision/);
});

test("release tooling uses canonical topology binding names", () => {
  const release = read("scripts/cloudflare-release.mjs");
  assert.match(release, /WORKER_TOPOLOGY\.bindings\.d1/);
  assert.equal(WORKER_TOPOLOGY.bindings.d1, "DB");
  assert.equal(WORKER_TOPOLOGY.bindings.r2, "PHOTOS");
  assert.equal(WORKER_TOPOLOGY.bindings.workersAi, "AI");
});
