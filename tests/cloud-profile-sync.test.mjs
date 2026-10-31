import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const app = readFileSync(new URL("../public/app.js", import.meta.url), "utf8");

function loadProfileHarness({ stateProfile, deviceProfile } = {}) {
  const start = app.indexOf('var PROFILE_KEY = "life-ledger-device-profile"');
  const end = app.indexOf("function placeAvatar", start);
  assert.ok(start >= 0 && end > start, "cloud profile block must exist");

  const saved = [];
  const context = {
    cloudMode: true,
    state: stateProfile ? { profile: structuredClone(stateProfile) } : {},
    localStorage: {
      getItem() { return deviceProfile ? JSON.stringify(deviceProfile) : null; },
    },
    cloneData: structuredClone,
    saveState(options) { saved.push(structuredClone(options)); },
  };
  vm.createContext(context);
  vm.runInContext(app.slice(start, end), context);
  return { context, saved };
}

test("cloud profile uses its own timestamp and persists a newer remote profile", () => {
  const { context, saved } = loadProfileHarness({
    stateProfile: { name: "Alice", avatar: "", frame: { x: 50, y: 50, zoom: 1 }, updatedAt: 100 },
  });

  context.adoptCloudProfile({
    profile: { name: "Bob", avatar: "", frame: { x: 40, y: 60, zoom: 1.2 }, updatedAt: 200 },
  }, { preserveUpdatedAt: true });

  assert.equal(context.state.profile.name, "Bob");
  assert.equal(context.state.profile.updatedAt, 200);
  assert.deepEqual(saved, [{ preserveUpdatedAt: true, skipCloud: true }]);
});

test("cloud profile keeps a newer local edit instead of using unrelated state timestamps", () => {
  const { context, saved } = loadProfileHarness({
    stateProfile: { name: "Alice", avatar: "", frame: { x: 50, y: 50, zoom: 1 }, updatedAt: 300 },
    deviceProfile: { name: "Alice", avatar: "", frame: { x: 50, y: 50, zoom: 1 }, updatedAt: 300 },
  });

  context.adoptCloudProfile({
    meta: { updatedAt: 9999 },
    profile: { name: "Bob", avatar: "", frame: { x: 40, y: 60, zoom: 1.2 }, updatedAt: 200 },
  }, { preserveUpdatedAt: true });

  assert.equal(context.state.profile.name, "Alice");
  assert.equal(context.state.profile.updatedAt, 300);
  assert.deepEqual(saved, []);
});

test("legacy profiles without their own timestamp adopt the remote copy once", () => {
  const { context, saved } = loadProfileHarness({
    stateProfile: { name: "Legacy local", avatar: "", frame: { x: 50, y: 50, zoom: 1 } },
  });

  context.adoptCloudProfile({
    profile: { name: "Legacy cloud", avatar: "", frame: { x: 50, y: 50, zoom: 1 } },
  }, { preserveUpdatedAt: true });

  assert.equal(context.state.profile.name, "Legacy cloud");
  assert.equal(context.state.profile.updatedAt, 0);
  assert.equal(saved.length, 1);
});

test("saving a profile assigns a dedicated profile timestamp", () => {
  assert.match(
    app,
    /next = \{ name: next\.name \|\| "", avatar: next\.avatar \|\| "", frame: profileFrame\(next\.frame\), updatedAt: Date\.now\(\) \};/,
  );
});
