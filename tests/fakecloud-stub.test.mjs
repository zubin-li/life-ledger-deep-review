import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const stub = join(root, ".overnight/fakecloud-stub");
const shell = fs.readFileSync(join(root, ".overnight/fakecloud.sh"), "utf8");

test("fakecloud stub ships QA state API and revision schema", () => {
  const schema = fs.readFileSync(join(stub, "schema-qa.sql"), "utf8");
  assert.match(schema, /revision INTEGER/);
  const stateApi = fs.readFileSync(join(stub, "functions/api/state.js"), "utf8");
  assert.match(stateApi, /onRequestGet/);
  assert.match(stateApi, /onRequestPut/);
  const stateCore = fs.readFileSync(join(stub, "functions/_state.js"), "utf8");
  assert.match(stateCore, /compareAndSwapState/);
  assert.match(stateCore, /baseRevision/);
});

test("fakecloud.sh falls back to overnight stub when repo functions missing", () => {
  assert.match(shell, /fakecloud-stub/);
  assert.match(shell, /schema-qa\.sql/);
});

test("fakecloud.sh runs outside repo so root wrangler.jsonc is not used", () => {
  assert.doesNotMatch(shell, /\.overnight\/scratch\/fakecloud/);
  assert.match(shell, /life-ledger-overnight-fakecloud/);
});
