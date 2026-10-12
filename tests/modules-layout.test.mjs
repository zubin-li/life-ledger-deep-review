import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const modulesSrc = readFileSync(new URL("../public/modules.js", import.meta.url), "utf8");

function createMockEnvironment(initialStorage = {}) {
  const store = { ...initialStorage };
  const mockLocalStorage = {
    getItem: key => (key in store ? store[key] : null),
    setItem: (key, value) => { store[key] = String(value); },
    removeItem: key => { delete store[key]; },
    clear: () => { Object.keys(store).forEach(k => delete store[k]); },
    _store: store,
  };

  const mockDocument = {
    createElement: tag => ({
      tagName: tag.toUpperCase(),
      classList: {
        add() {},
        remove() {},
        toggle() {},
        contains() { return false; },
      },
      setAttribute() {},
      style: {},
      addEventListener() {},
      removeEventListener() {},
      prepend() {},
      appendChild() {},
      querySelector() { return null; },
      querySelectorAll() { return []; },
    }),
    getElementById: () => null,
    querySelector: () => null,
    querySelectorAll: () => [],
    documentElement: {
      classList: {
        contains: () => false,
      },
    },
    body: {
      appendChild() {},
    },
  };

  const sandbox = {
    console,
    localStorage: mockLocalStorage,
    document: mockDocument,
    window: {},
    globalThis: {},
  };
  sandbox.window = sandbox;
  sandbox.globalThis = sandbox;

  vm.createContext(sandbox);
  vm.runInContext(modulesSrc, sandbox);
  return { modules: sandbox.LifeLedgerModules, storage: store, mockLocalStorage };
}

const toPlain = obj => JSON.parse(JSON.stringify(obj));

test("modules.js exports expected controller and default boards", () => {
  const { modules } = createMockEnvironment();
  assert.ok(modules);
  assert.equal(modules.STORAGE_KEY, "life-ledger-layout-v1");
  assert.deepEqual(toPlain(modules.DEFAULT_BOARDS.today.order), [
    "summary", "habits", "calendar", "focus", "photos", "reflection", "context",
  ]);
  assert.deepEqual(toPlain(modules.DEFAULT_BOARDS.today.protected), ["habits"]);
  assert.deepEqual(toPlain(modules.DEFAULT_BOARDS.week.order), [
    "completed", "insights", "goals", "review",
  ]);
});

test("getBoardState returns defaults when storage is empty or missing", () => {
  const { modules } = createMockEnvironment();
  const todayState = modules.getBoardState("today");
  assert.deepEqual(toPlain(todayState.order), [
    "summary", "habits", "calendar", "focus", "photos", "reflection", "context",
  ]);
  assert.deepEqual(toPlain(todayState.collapsed), []);
  assert.deepEqual(toPlain(todayState.hidden), []);

  const weekState = modules.getBoardState("week");
  assert.deepEqual(toPlain(weekState.order), [
    "completed", "insights", "goals", "review",
  ]);
  assert.deepEqual(toPlain(weekState.collapsed), []);
  assert.deepEqual(toPlain(weekState.hidden), []);
});

test("corrupt JSON falls back safely to default order", () => {
  const { modules } = createMockEnvironment({
    "life-ledger-layout-v1": "CORRUPT_NOT_JSON{{{",
  });
  const todayState = modules.getBoardState("today");
  assert.deepEqual(toPlain(todayState.order), [
    "summary", "habits", "calendar", "focus", "photos", "reflection", "context",
  ]);
});

test("unknown module ids are filtered out and missing defaults appended", () => {
  const { modules } = createMockEnvironment({
    "life-ledger-layout-v1": JSON.stringify({
      today: {
        order: ["focus", "unknown_module", "summary"],
        collapsed: ["unknown_module"],
        hidden: ["unknown_module"],
      },
    }),
  });
  const todayState = modules.getBoardState("today");
  assert.equal(todayState.order[0], "focus");
  assert.equal(todayState.order[1], "summary");
  assert.ok(!todayState.order.includes("unknown_module"));
  // Missing modules must be appended
  assert.ok(todayState.order.includes("habits"));
  assert.ok(todayState.order.includes("calendar"));
  assert.ok(todayState.order.includes("photos"));
  assert.ok(todayState.order.includes("reflection"));
  assert.ok(todayState.order.includes("context"));
  assert.deepEqual(toPlain(todayState.collapsed), []);
  assert.deepEqual(toPlain(todayState.hidden), []);
});

test("habits module on today is protected and cannot be hidden or collapsed", () => {
  const { modules } = createMockEnvironment({
    "life-ledger-layout-v1": JSON.stringify({
      today: {
        order: ["habits", "summary"],
        collapsed: ["habits", "summary"],
        hidden: ["habits", "summary"],
      },
    }),
  });
  const todayState = modules.getBoardState("today");
  assert.ok(!todayState.collapsed.includes("habits"));
  assert.ok(!todayState.hidden.includes("habits"));
  assert.ok(todayState.collapsed.includes("summary"));
  assert.ok(todayState.hidden.includes("summary"));

  // Also when saving, habits should be stripped from collapsed/hidden
  modules.saveBoardState("today", {
    order: ["habits", "summary"],
    collapsed: ["habits", "summary"],
    hidden: ["habits", "summary"],
  });
  const saved = modules.getBoardState("today");
  assert.ok(!saved.collapsed.includes("habits"));
  assert.ok(!saved.hidden.includes("habits"));
});

test("saveBoardState persists round-trip and resetLayout clears the key", () => {
  const { modules, storage } = createMockEnvironment();
  modules.saveBoardState("week", {
    order: ["goals", "review", "completed", "insights"],
    collapsed: ["completed"],
    hidden: ["insights"],
  });

  const raw = storage["life-ledger-layout-v1"];
  assert.ok(raw);
  const parsed = JSON.parse(raw);
  assert.deepEqual(parsed.week.order, ["goals", "review", "completed", "insights"]);
  assert.deepEqual(parsed.week.collapsed, ["completed"]);
  assert.deepEqual(parsed.week.hidden, ["insights"]);

  // Resetting week removes week
  modules.resetLayout("week");
  assert.equal(storage["life-ledger-layout-v1"], undefined);

  // If both exist, resetting one preserves the other
  modules.saveBoardState("today", { order: ["summary"], collapsed: [], hidden: [] });
  modules.saveBoardState("week", { order: ["goals"], collapsed: [], hidden: [] });
  modules.resetLayout("today");
  const remaining = JSON.parse(storage["life-ledger-layout-v1"]);
  assert.ok(remaining.week);
  assert.equal(remaining.today, undefined);

  // Resetting all clears storage key
  modules.resetLayout();
  assert.equal(storage["life-ledger-layout-v1"], undefined);
});
