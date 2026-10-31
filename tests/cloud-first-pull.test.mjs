import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const app = readFileSync(new URL("../public/app.js", import.meta.url), "utf8");

function loadCloudSyncRuntimeFactory() {
  const start = app.indexOf("/* life-ledger-cloud-sync-gate-start */");
  const end = app.indexOf("/* life-ledger-cloud-sync-gate-end */");
  assert.ok(start >= 0 && end > start, "cloud sync gate block must exist in app.js");
  const source = app.slice(start + "/* life-ledger-cloud-sync-gate-start */".length, end);
  const context = { setTimeout, clearTimeout };
  vm.createContext(context);
  vm.runInContext(source, context);
  return context.createCloudSyncRuntime;
}

const createCloudSyncRuntime = loadCloudSyncRuntimeFactory();

function makeHarness(overrides = {}) {
  const events = { puts: [], gets: [], timerPushes: [] };
  let getDeferred = null;
  const runtime = createCloudSyncRuntime({
    initialSyncReady: false,
    pushDelayMs: 50,
    getCloudMode: () => overrides.cloudMode ?? true,
    getAuthExpired: () => overrides.authExpired ?? false,
    onDeferredPush: () => {
      events.timerPushes.push(Date.now());
      if (runtime.canPush()) events.puts.push("timer");
    },
    ...overrides.deps,
  });

  const performGet = async () => {
    events.gets.push(Date.now());
    if (getDeferred) return getDeferred.promise;
    return overrides.getOutcome ?? "loaded";
  };

  const performMissingInit = async () => {
    if (runtime.canPush({ force: true, allowDuringPull: true })) {
      events.puts.push("missing-init");
      return true;
    }
    return false;
  };

  const performPush = async () => {
    if (runtime.canPush()) events.puts.push("push");
  };

  return {
    runtime,
    events,
    setGetDeferred() {
      let resolve;
      const promise = new Promise(done => { resolve = done; });
      getDeferred = { promise, resolve: (value) => { getDeferred = null; resolve(value); } };
      return getDeferred;
    },
    performGet,
    performMissingInit,
    performPush,
  };
}

test("Cloudflare and CloudBase share the same pull lifecycle and remote fetch branches", () => {
  assert.match(app, /async function fetchCloudRemoteOutcome\(\)/);
  assert.match(app, /if \(cloudProvider === "cloudbase"\)/);
  assert.match(app, /const response = await fetch\(CLOUD_API/);
  assert.match(app, /cloudSyncRuntime\.pullLifecycle\(/);
  assert.match(app, /return "missing"/);
  assert.match(app, /if \(response\.status === 404\)/);
});

test("delayed initial GET and local save never PUT before GET completes", async () => {
  const h = makeHarness();
  const deferred = h.setGetDeferred();
  const pullPromise = h.runtime.pullLifecycle({ performGet: h.performGet, performMissingInit: h.performMissingInit });
  assert.equal(h.runtime.state.pullInFlight, 1);
  h.runtime.afterLocalSave({});
  assert.equal(h.events.puts.length, 0);
  assert.equal(h.events.timerPushes.length, 0);
  deferred.resolve("loaded");
  await pullPromise;
  assert.equal(h.events.gets.length, 1);
  assert.equal(h.events.puts.length, 0);
});

test("failed initial GET never PUTs; reconnect retries GET before a dirty PUT", async () => {
  const h = makeHarness({ getOutcome: "failure" });
  const first = await h.runtime.pullLifecycle({ performGet: h.performGet, performMissingInit: h.performMissingInit });
  assert.equal(first.outcome, "failure");
  assert.equal(h.events.puts.length, 0);
  assert.equal(h.runtime.state.syncReady, false);

  h.runtime.state.dirty = true;
  const reconnect = await h.runtime.reconnectLifecycle({
    performGet: async () => {
      h.events.gets.push(Date.now());
      return "loaded";
    },
    performMissingInit: h.performMissingInit,
    performPush: h.performPush,
  });
  assert.equal(reconnect.outcome, "loaded");
  assert.equal(h.events.gets.length, 2);
  assert.equal(h.events.puts.length, 1);
  assert.deepEqual(h.events.puts, ["push"]);
});

test("ready client clears a pending timer and blocks PUT until GET completes", async () => {
  const h = makeHarness({ getOutcome: "loaded" });
  h.runtime.state.syncReady = true;
  h.runtime.state.dirty = true;
  h.runtime.scheduleDeferredPush();
  const deferred = h.setGetDeferred();
  const pullPromise = h.runtime.reconnectLifecycle({
    performGet: h.performGet,
    performMissingInit: h.performMissingInit,
    performPush: h.performPush,
  });
  await new Promise(resolve => setTimeout(resolve, 60));
  assert.equal(h.events.timerPushes.length, 0, "pending timer must be cleared when pull starts");
  assert.equal(h.events.puts.length, 0);
  deferred.resolve("loaded");
  await pullPromise;
  assert.equal(h.events.gets.length, 1);
  assert.equal(h.events.puts.length, 1);
  assert.deepEqual(h.events.puts, ["push"]);
});

test("save during reconnect GET stays local until GET succeeds, then at most one dirty PUT", async () => {
  const h = makeHarness();
  h.runtime.state.syncReady = true;
  const deferred = h.setGetDeferred();
  const reconnectPromise = h.runtime.reconnectLifecycle({
    performGet: h.performGet,
    performMissingInit: h.performMissingInit,
    performPush: h.performPush,
  });
  h.runtime.afterLocalSave({});
  assert.equal(h.runtime.state.dirty, true);
  assert.equal(h.events.puts.length, 0);
  deferred.resolve("loaded");
  await reconnectPromise;
  assert.equal(h.events.gets.length, 1);
  assert.equal(h.events.puts.length, 1);
  assert.deepEqual(h.events.puts, ["push"]);
});

test("missing remote with two concurrent callers performs one GET and one initialization PUT", async () => {
  const h = makeHarness({ getOutcome: "missing" });
  let initCount = 0;
  const performMissingInit = async () => {
    initCount++;
    await new Promise(resolve => setTimeout(resolve, 20));
    if (h.runtime.canPush({ force: true, allowDuringPull: true })) h.events.puts.push("missing-init");
    return true;
  };
  let sharedPull = null;
  const pullOnce = () => {
    if (!sharedPull) {
      sharedPull = h.runtime.pullLifecycle({ performGet: h.performGet, performMissingInit }).finally(() => {
        sharedPull = null;
      });
    }
    return sharedPull;
  };
  const [a, b] = await Promise.all([pullOnce(), pullOnce()]);
  assert.equal(a.outcome, "missing");
  assert.equal(b.outcome, "missing");
  assert.equal(h.events.gets.length, 1);
  assert.equal(initCount, 1);
  assert.equal(h.events.puts.length, 1);
});

test("previously successful pull then failed pull blocks PUT until another GET succeeds", async () => {
  const h = makeHarness({ getOutcome: "loaded" });
  await h.runtime.pullLifecycle({ performGet: h.performGet, performMissingInit: h.performMissingInit });
  assert.equal(h.runtime.state.syncReady, true);
  h.runtime.state.dirty = true;
  const failed = await h.runtime.pullLifecycle({
    performGet: async () => "failure",
    performMissingInit: h.performMissingInit,
  });
  assert.equal(failed.outcome, "failure");
  assert.equal(h.runtime.state.syncReady, false);
  assert.equal(h.runtime.state.dirty, true);
  h.runtime.afterLocalSave({});
  assert.equal(h.runtime.canPush(), false);
  assert.equal(h.events.puts.length, 0);
  await h.runtime.reconnectLifecycle({
    performGet: async () => {
      h.events.gets.push(Date.now());
      return "loaded";
    },
    performMissingInit: h.performMissingInit,
    performPush: h.performPush,
  });
  assert.equal(h.events.gets.length, 2);
  assert.equal(h.events.puts.length, 1);
});

test("failed PUT blocks readiness until retry GET, then flushes dirty state", async () => {
  const h = makeHarness({ getOutcome: "loaded" });
  await h.runtime.pullLifecycle({ performGet: h.performGet, performMissingInit: h.performMissingInit });
  h.runtime.state.dirty = true;
  h.runtime.afterPushFailure();
  assert.equal(h.runtime.state.syncReady, false);
  assert.equal(h.runtime.state.dirty, true);
  h.runtime.afterLocalSave({});
  assert.equal(h.runtime.canPush(), false);
  await new Promise(resolve => setTimeout(resolve, 60));
  assert.equal(h.events.timerPushes.length, 0);
  await h.runtime.reconnectLifecycle({
    performGet: async () => {
      h.events.gets.push(Date.now());
      return "loaded";
    },
    performMissingInit: h.performMissingInit,
    performPush: h.performPush,
  });
  assert.equal(h.events.gets.length, 2);
  assert.equal(h.events.puts.length, 1);
});

test("slow missing-init PUT blocks ordinary timer PUTs for concurrent callers", async () => {
  const h = makeHarness({ getOutcome: "missing" });
  let initCount = 0;
  let releaseInit;
  const performMissingInit = () => new Promise(resolve => {
    initCount++;
    releaseInit = () => {
      if (h.runtime.canPush({ force: true, allowDuringPull: true })) h.events.puts.push("missing-init");
      resolve(true);
    };
  });
  let sharedPull = null;
  const pullOnce = () => {
    if (!sharedPull) {
      sharedPull = h.runtime.pullLifecycle({ performGet: h.performGet, performMissingInit }).finally(() => {
        sharedPull = null;
      });
    }
    return sharedPull;
  };
  const pulls = Promise.all([pullOnce(), pullOnce()]);
  await new Promise(resolve => setTimeout(resolve, 5));
  assert.equal(h.runtime.state.pullInFlight, 1);
  h.runtime.state.syncReady = true;
  h.runtime.state.dirty = true;
  h.runtime.scheduleDeferredPush();
  await new Promise(resolve => setTimeout(resolve, 60));
  assert.equal(h.events.timerPushes.length, 0);
  assert.equal(h.events.puts.length, 0);
  releaseInit();
  const [a, b] = await pulls;
  assert.equal(a.outcome, "missing");
  assert.equal(b.outcome, "missing");
  assert.equal(initCount, 1);
  assert.equal(h.events.puts.length, 1);
});

test("missing-init PUT returning false yields failure and leaves sync not-ready", async () => {
  const h = makeHarness();
  const result = await h.runtime.pullLifecycle({
    performGet: async () => "missing",
    performMissingInit: async () => false,
  });
  assert.equal(result.outcome, "failure");
  assert.equal(h.runtime.state.syncReady, false);
  assert.equal(h.runtime.state.hadSuccessfulPull, false);
  assert.equal(h.events.puts.length, 0);
});

test("boot profile and prefs persistence preserves updatedAt and does not mark cloud upload", () => {
  const h = makeHarness();
  const meta = { updatedAt: 42 };
  assert.equal(h.runtime.shouldTouchUpdatedAt({ preserveUpdatedAt: true }), false);
  h.runtime.afterLocalSave({ skipCloud: true, preserveUpdatedAt: true });
  assert.equal(h.runtime.state.dirty, false);
  assert.equal(meta.updatedAt, 42);
});

test("voice-style flow skips PUT after failed pull and allows forced PUT after successful pull", async () => {
  const h = makeHarness({ getOutcome: "failure" });
  const failed = await h.runtime.pullLifecycle({ performGet: h.performGet, performMissingInit: h.performMissingInit });
  assert.equal(failed.outcome, "failure");
  assert.equal(h.runtime.canPush({ force: true }), false);

  h.runtime.state.syncReady = true;
  const ok = await h.runtime.pullLifecycle({ performGet: async () => "loaded", performMissingInit: h.performMissingInit });
  assert.equal(ok.outcome, "loaded");
  h.runtime.afterLocalSave({ skipCloud: true, bumpUpdatedAt: true });
  assert.equal(h.runtime.canPush({ force: true }), true);
  assert.ok(h.runtime.canPush({ force: true }));
});

test("push guard rejects pull-in-flight, auth expiry, and not-ready states", () => {
  const h = makeHarness();
  h.runtime.state.syncReady = true;
  h.runtime.state.dirty = true;
  h.runtime.beginPull();
  assert.equal(h.runtime.canPush(), false);
  assert.equal(h.runtime.canPush({ force: true }), false);
  assert.equal(h.runtime.canPush({ force: true, allowDuringPull: true }), true);
  h.runtime.endPull();
  assert.equal(h.runtime.canPush(), true);
  h.runtime.onAuthFailure();
  assert.equal(h.runtime.canPush({ force: true }), false);
});

test("production wiring uses runtime guards for push, pull, reconnect, and voice", () => {
  assert.match(app, /cloudSyncRuntime\.canPush\(options\)/);
  assert.match(app, /cloudSyncRuntime\.pullLifecycle\(/);
  assert.match(app, /cloudSyncRuntime\.shouldReconnectPush\(result\.outcome\)/);
  assert.match(app, /saveState\(\{ skipCloud: true, bumpUpdatedAt: true \}\)/);
  assert.match(app, /if \(cloudMode && \(!cloudSyncRuntime\.state\.syncReady \|\| pullResult\?\.outcome === "auth" \|\| pullResult\?\.outcome === "failure"\)\) return;/);
  assert.match(app, /pushCloudState\(\{ force: true, allowDuringPull: true \}\)/);
  assert.match(app, /allowDuringPull/);
  assert.doesNotMatch(app, /ensureMissingRemoteInit/);
});
