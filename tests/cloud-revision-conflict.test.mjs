import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const app = readFileSync(new URL("../public/app.js", import.meta.url), "utf8");
const indexHtml = readFileSync(new URL("../public/index.html", import.meta.url), "utf8");

function extractBlock(startMarker, endMarker) {
  const start = app.indexOf(startMarker);
  const end = app.indexOf(endMarker);
  assert.ok(start >= 0 && end > start, `${startMarker} block must exist`);
  return app.slice(start + startMarker.length, end);
}

function constLine(pattern) {
  const match = app.match(pattern);
  assert.ok(match, `missing ${pattern}`);
  return match[0];
}

function extractFunctionSource(signature) {
  const start = app.indexOf(signature);
  assert.ok(start >= 0, `missing ${signature}`);
  const bodyStart = app.indexOf("{", start);
  let depth = 0;
  for (let i = bodyStart; i < app.length; i++) {
    if (app[i] === "{") depth++;
    else if (app[i] === "}") {
      depth--;
      if (depth === 0) return app.slice(start, i + 1);
    }
  }
  throw new Error(`unterminated function: ${signature}`);
}

const revisionBlock = extractBlock("/* life-ledger-cloud-revision-start */", "/* life-ledger-cloud-revision-end */");
const prefsBlock = extractBlock("/* life-ledger-backup-preferences-start */", "/* life-ledger-backup-preferences-end */");

function loadRevisionApi() {
  const context = {
    window: { LifeLedgerStorageSuffix: "" },
    localStorage: null,
    seed: { habits: [], logs: {}, focusSettings: {} },
    cloneData: value => JSON.parse(JSON.stringify(value)),
  };
  vm.createContext(context);
  vm.runInContext([
    constLine(/^const BACKUP_FORMAT = .*;$/m),
    constLine(/^const BACKUP_SCHEMA_VERSION = \d+;$/m),
    constLine(/^const NAV_PAGES = \[[^\]]*\];$/m),
    extractFunctionSource("function validAvatar(value)"),
    extractFunctionSource("function profileFrame(f)"),
    prefsBlock,
    revisionBlock,
  ].join("\n"), context);
  return context;
}

const api = loadRevisionApi();
const BACKUP_FORMAT = vm.runInContext("BACKUP_FORMAT", api);
const BACKUP_SCHEMA_VERSION = vm.runInContext("BACKUP_SCHEMA_VERSION", api);
const SYNC_CONFLICT_STORAGE_BLOCK_KEY = vm.runInContext("SYNC_CONFLICT_STORAGE_BLOCK_KEY", api);
const codec = { backupFormat: BACKUP_FORMAT, backupSchemaVersion: BACKUP_SCHEMA_VERSION };

const sampleState = (tag, updatedAt = 100) => ({
  habits: [{ id: "h1", versions: [{ effectiveFrom: "2026-01-01", name: tag }] }],
  logs: { "2026-01-01": {} },
  meta: { updatedAt },
});

function makeStorage(entries = {}) {
  const store = new Map(Object.entries(entries));
  return {
    getItem(key) { return store.has(key) ? store.get(key) : null; },
    setItem(key, value) { store.set(key, value); },
    removeItem(key) { store.delete(key); },
  };
}

test("revision validation defaults invalid values to zero", () => {
  assert.equal(api.cloudStateRevision(3), 3);
  assert.equal(api.cloudStateRevision("bad"), 0);
  assert.equal(api.cloudStateRevision(-1), 0);
  assert.equal(api.cloudStateRevision(1.5), 0);
  assert.equal(api.cloudStateRevision(undefined), 0);
});

test("Cloudflare revision tracker follows GET, 404, and successful PUT", () => {
  const tracker = api.createCloudRevisionTracker();
  assert.equal(tracker.baseRevisionForPut(), 0);
  tracker.noteRemoteBody({ revision: 5 });
  assert.equal(tracker.getRevision(), 5);
  assert.equal(tracker.baseRevisionForPut(), 5);
  tracker.notePutSuccess({ revision: 6 });
  assert.equal(tracker.getRevision(), 6);
  tracker.reset();
  assert.equal(tracker.getRevision(), 0);
});

test("first Cloudflare PUT uses base revision zero then stores returned revision", () => {
  const tracker = api.createCloudRevisionTracker();
  assert.deepEqual({ payload: sampleState("local"), baseRevision: tracker.baseRevisionForPut() }, {
    payload: sampleState("local"),
    baseRevision: 0,
  });
  tracker.notePutSuccess({ revision: 1 });
  assert.equal(tracker.baseRevisionForPut(), 1);
});

test("409 with valid remote preserves losing backup, adopts remote, and settles revision", () => {
  const storage = makeStorage({ "life-ledger-language": "en" });
  const losing = sampleState("device", 500);
  const remotePayload = sampleState("cloud", 900);
  const plan = api.planCloudStateConflict({
    losingState: losing,
    storage,
    conflictBody: { code: "STATE_CONFLICT", payload: remotePayload, revision: 4 },
    baseRevision: 3,
    provider: "cloudflare",
    backupFormat: BACKUP_FORMAT,
    backupSchemaVersion: BACKUP_SCHEMA_VERSION,
    encodePreferences: api.encodeBackupPreferences,
    cloneDataFn: api.cloneData,
    seed: api.seed,
  });
  assert.equal(plan.kind, "adopted");
  assert.equal(plan.remoteRevision, 4);
  assert.equal(plan.adoptedState.meta.updatedAt, 900);
  assert.equal(plan.record.backup.data.habits[0].versions[0].name, "device");
  assert.equal(plan.record.baseRevision, 3);
  assert.equal(plan.record.remoteRevision, 4);
  api.writeSyncConflictRecord(storage, plan.record);
  const roundTrip = api.readSyncConflictRecord(storage, codec);
  assert.ok(roundTrip);
  assert.equal(roundTrip.backup.data.habits[0].versions[0].name, "device");
});

test("409 with malformed remote keeps recovery backup without adoption metadata", () => {
  const storage = makeStorage();
  const plan = api.planCloudStateConflict({
    losingState: sampleState("device"),
    storage,
    conflictBody: { code: "STATE_CONFLICT", payload: { broken: true }, revision: 2 },
    baseRevision: 1,
    provider: "cloudflare",
    backupFormat: BACKUP_FORMAT,
    backupSchemaVersion: BACKUP_SCHEMA_VERSION,
    encodePreferences: api.encodeBackupPreferences,
    cloneDataFn: api.cloneData,
    seed: api.seed,
  });
  assert.equal(plan.kind, "malformed");
  assert.equal(plan.record.pendingRemoteResolution, true);
  assert.ok(plan.record?.backup?.data?.habits);
  const commit = api.commitCloudConflictPlan(plan, storage);
  assert.equal(commit.status, "pending_remote");
});

test("storage write failure blocks conflict commit without persisting", () => {
  const storage = makeStorage();
  const plan = api.planCloudStateConflict({
    losingState: sampleState("device"),
    storage,
    conflictBody: { payload: sampleState("cloud"), revision: 2 },
    baseRevision: 1,
    provider: "cloudflare",
    backupFormat: BACKUP_FORMAT,
    backupSchemaVersion: BACKUP_SCHEMA_VERSION,
    encodePreferences: api.encodeBackupPreferences,
    cloneDataFn: api.cloneData,
    seed: api.seed,
  });
  const commit = api.commitCloudConflictPlan(plan, storage, () => false);
  assert.equal(commit.status, "storage_failed");
  assert.equal(storage.getItem(api.SYNC_CONFLICT_STORAGE_KEY), null);
});

test("conflict record excludes forbidden secrets and is not cloud payload", () => {
  const storage = makeStorage({
    "life-ledger-language": "de",
    "life-ledger-cloud-token": "SECRET",
    "life-ledger-auth-session": "SECRET",
  });
  const plan = api.planCloudStateConflict({
    losingState: sampleState("device"),
    storage,
    conflictBody: { payload: sampleState("cloud"), revision: 1 },
    baseRevision: 0,
    provider: "cloudflare",
    backupFormat: BACKUP_FORMAT,
    backupSchemaVersion: BACKUP_SCHEMA_VERSION,
    encodePreferences: api.encodeBackupPreferences,
    cloneDataFn: api.cloneData,
    seed: api.seed,
  });
  const serialized = JSON.stringify(plan.record);
  assert.doesNotMatch(serialized, /SECRET/);
  assert.doesNotMatch(serialized, /life-ledger-cloud-token/);
  assert.ok(plan.record.backup.preferences);
  assert.equal(plan.record.backup.scope, "all");
});

test("invalid conflict records are ignored and can be cleared", () => {
  const storage = makeStorage({
    [api.SYNC_CONFLICT_STORAGE_KEY]: JSON.stringify({ version: 99, backup: {} }),
  });
  assert.equal(api.readSyncConflictRecord(storage, codec), null);
  api.clearSyncConflictRecord(storage);
  assert.equal(storage.getItem(api.SYNC_CONFLICT_STORAGE_KEY), null);
});

test("conflict download filename is deterministic from detected time", () => {
  const name = api.conflictRecoveryDownloadName({ detectedAt: Date.UTC(2026, 9, 30, 12, 0, 0) });
  assert.equal(name, "life-ledger-conflict-backup-2026-10-30.json");
});

test("import panel exposes conflict recovery controls wired in app.js", () => {
  assert.match(indexHtml, /id="conflictRecoveryRow"/);
  assert.match(indexHtml, /id="downloadConflictRecovery"/);
  assert.match(indexHtml, /id="dismissConflictRecovery"/);
  assert.match(app, /refreshConflictRecoveryVisibility\(\)/);
  assert.match(app, /downloadStoredConflictRecovery/);
  assert.match(app, /dismissStoredConflictRecovery/);
  assert.match(app, /cloudRevisionTracker\.baseRevisionForPut\(\)/);
  assert.match(app, /response\.status === 409/);
  assert.doesNotMatch(app, /JSON\.stringify\(\{\s*payload:\s*state\s*\}\)/);
});

test("pending recovery reloads from storage and GET adopts remote while keeping backup", () => {
  const storage = makeStorage();
  const losing = sampleState("device", 500);
  const plan = api.planCloudStateConflict({
    losingState: losing,
    storage,
    conflictBody: { code: "STATE_CONFLICT", payload: { broken: true }, revision: 2 },
    baseRevision: 1,
    provider: "cloudflare",
    backupFormat: BACKUP_FORMAT,
    backupSchemaVersion: BACKUP_SCHEMA_VERSION,
    encodePreferences: api.encodeBackupPreferences,
    cloneDataFn: api.cloneData,
    seed: api.seed,
  });
  assert.equal(api.commitCloudConflictPlan(plan, storage).status, "pending_remote");
  const reloaded = api.readSyncConflictRecord(storage, codec);
  assert.equal(reloaded.pendingRemoteResolution, true);
  const remotePayload = sampleState("cloud", 900);
  const resolved = api.resolvePendingConflictOnRemoteGet(
    { payload: remotePayload, revision: 8 },
    storage,
    api.seed,
    api.cloneData,
    codec,
  );
  assert.equal(resolved.adoptedState.meta.updatedAt, 900);
  assert.equal(resolved.remoteRevision, 8);
  const kept = api.readSyncConflictRecord(storage, codec);
  assert.equal(kept.pendingRemoteResolution, false);
  assert.equal(kept.backup.data.habits[0].versions[0].name, "device");
});

test("malformed 409 handling does not schedule automatic cloud retry", () => {
  const start = app.indexOf("if (response.status === 409)");
  const end = app.indexOf("if (!response.ok) throw new Error(`HTTP ${response.status}`);");
  assert.ok(start >= 0 && end > start);
  const block = app.slice(start, end);
  assert.doesNotMatch(block, /scheduleCloudRetry\(\)/);
});

test("pushCloudState gates adoption on commitCloudConflictPlan storage success", () => {
  assert.match(app, /commitCloudConflictPlan\(plan, localStorage\)/);
  assert.match(app, /commit\.status === "storage_failed"/);
  assert.match(app, /activateSyncConflictStorageBlock\(localStorage, sessionStorage\)/);
  assert.match(app, /commit\.status === "adopted"/);
  assert.match(app, /save\.conflictPendingResolution/);
  assert.match(app, /cloudSyncConflictBlocksAutoPush\(\)/);
  assert.match(app, /resolvePendingConflictOnRemoteGet\(/);
});

test("storage block pauses Cloudflare sync wiring without mutating remote state", () => {
  assert.match(app, /if \(cloudProvider === "cloudflare" && cloudSyncStorageBlockPaused\(\)\)/);
  assert.match(app, /async function pullCloudState\(\)/);
  assert.match(app, /outcome: "storage_blocked"/);
  assert.match(app, /async function runCloudReconnectSync\(\)/);
  assert.match(app, /if \(cloudSyncStorageBlockPaused\(\)\) return;/);
  assert.match(app, /conflictRecoveryStorageFallbackActive\(/);
  assert.match(app, /clearSyncConflictStorageBlock\(localStorage, sessionStorage\)/);
  assert.match(app, /dismiss\.hidden = fallback \|\| !record/);
});

test("sync conflict storage block persists, survives reload, and clears only explicitly", () => {
  api.cloudSyncConflictStorageBlockSession = false;
  const local = makeStorage();
  const session = makeStorage();
  assert.equal(api.cloudSyncStorageBlockPaused("cloudflare", local, session), false);
  api.activateSyncConflictStorageBlock(local, session);
  assert.equal(api.cloudSyncStorageBlockPaused("cloudflare", local, session), true);
  assert.ok(api.decodeSyncConflictStorageBlockMarker(local.getItem(SYNC_CONFLICT_STORAGE_BLOCK_KEY)));
  api.cloudSyncConflictStorageBlockSession = false;
  assert.equal(api.cloudSyncStorageBlockPaused("cloudflare", local, session), true);
  api.clearSyncConflictStorageBlock(local, session);
  assert.equal(api.cloudSyncStorageBlockPaused("cloudflare", local, session), false);
});

test("storage block session flag covers stores when persistence fails", () => {
  api.cloudSyncConflictStorageBlockSession = false;
  const reject = {
    getItem() { throw new Error("denied"); },
    setItem() { throw new Error("denied"); },
    removeItem() { throw new Error("denied"); },
  };
  api.activateSyncConflictStorageBlock(reject, reject);
  assert.equal(api.syncConflictStorageBlockActive(reject, reject), true);
});

test("fallback recovery row is visible without a stored conflict record", () => {
  api.cloudSyncConflictStorageBlockSession = false;
  const local = makeStorage();
  const session = makeStorage();
  api.activateSyncConflictStorageBlock(local, session);
  assert.equal(
    api.conflictRecoveryStorageFallbackActive(null, "cloudflare", local, session),
    true,
  );
  assert.equal(
    api.conflictRecoveryStorageFallbackActive({ backup: {} }, "cloudflare", local, session),
    false,
  );
});
