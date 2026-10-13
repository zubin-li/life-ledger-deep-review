import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const layoutEngineSrc = readFileSync(new URL("../public/layout-engine.js", import.meta.url), "utf8");

function toPlain(obj) {
  return JSON.parse(JSON.stringify(obj));
}

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
      style: {
        setProperty() {},
        getPropertyValue() { return ""; },
      },
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
      lang: "en",
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
  vm.runInContext(layoutEngineSrc, sandbox);
  return {
    engine: sandbox.LifeLedgerLayoutEngine,
    TodayLayoutEngine: sandbox.TodayLayoutEngine || sandbox.LifeLedgerLayoutEngine.constructor,
    storage: store,
    mockLocalStorage,
  };
}

test("TodayLayoutEngine schema v2 validation accepts valid layout and appends missing defaults", () => {
  const { engine } = createMockEnvironment();
  const validAll7 = {
    schemaVersion: 2,
    view: "today",
    widgets: [
      { id: "today-summary", type: "summary", size: "large", x: 0, y: 0, hidden: false, settings: {} },
      { id: "today-focus", type: "focus", size: "small", x: 8, y: 0, hidden: false, settings: {} },
      { id: "today-context", type: "context", size: "small", x: 8, y: 1, hidden: false, settings: {} },
      { id: "today-habits", type: "habits", size: "large", x: 0, y: 2, hidden: false, settings: {} },
      { id: "today-reflection", type: "reflection", size: "small", x: 8, y: 2, hidden: false, settings: {} },
      { id: "today-photos", type: "photos", size: "medium", x: 0, y: 4, hidden: false, settings: {} },
      { id: "today-calendar", type: "calendar", size: "large", x: 0, y: 5, hidden: false, settings: {} },
    ],
  };

  const result = engine.validateLayout(validAll7);
  assert.equal(result.valid, true);
  assert.equal(result.errors.length, 0);
  assert.equal(result.layout.widgets.length, 7);
  assert.equal(result.layout.schemaVersion, 2);

  // When only 2 widgets are supplied, validateLayout appends missing default widgets
  const partial = {
    schemaVersion: 2,
    view: "today",
    widgets: [
      { id: "today-summary", type: "summary", size: "large", x: 0, y: 0, hidden: false, settings: {} },
      { id: "today-habits", type: "habits", size: "large", x: 0, y: 2, hidden: false, settings: {} },
    ],
  };
  const partialResult = engine.validateLayout(partial);
  assert.equal(partialResult.layout.widgets.length, 7, "Missing required widgets must be appended safely");
});

test("TodayLayoutEngine migrates v1 layout non-destructively", () => {
  const v1Storage = [
    { id: "summary", order: 0, hidden: false, collapsed: false },
    { id: "focus", order: 1, hidden: false, collapsed: false },
    { id: "context", order: 2, hidden: true, collapsed: false },
    { id: "habits", order: 3, hidden: false, collapsed: false },
    { id: "photos", order: 4, hidden: false, collapsed: false },
    { id: "calendar", order: 5, hidden: false, collapsed: false },
    { id: "reflection", order: 6, hidden: false, collapsed: false },
  ];

  const { engine, storage } = createMockEnvironment({
    "life-ledger-layout-v1": JSON.stringify(v1Storage),
  });

  const layout = engine.readStoredLayout();
  assert.equal(layout.schemaVersion, 2);
  assert.equal(layout.view, "today");
  assert.ok(Array.isArray(layout.widgets));
  assert.equal(layout.widgets.length, 7);

  // v1 data in localStorage must remain untouched
  const v1Raw = storage["life-ledger-layout-v1"];
  assert.equal(v1Raw, JSON.stringify(v1Storage), "v1 storage must not be modified or deleted");

  // v2 data is saved to life-ledger-layout-v2
  const v2Raw = storage["life-ledger-layout-v2"];
  assert.ok(v2Raw, "v2 storage key must be populated after migration");
  const parsedV2 = JSON.parse(v2Raw);
  assert.equal(parsedV2.schemaVersion, 2);

  // context widget was hidden in v1, should be hidden in v2
  const contextW = parsedV2.widgets.find(w => w.type === "context");
  assert.ok(contextW);
  assert.equal(contextW.hidden, true);
});

test("TodayLayoutEngine corrupt JSON in v2 falls back to default without deleting raw localStorage", () => {
  const corruptPayload = "{ this is not valid JSON }--corrupt-string";
  const { engine, storage } = createMockEnvironment({
    "life-ledger-layout-v2": corruptPayload,
  });

  const layout = engine.readStoredLayout();
  assert.equal(layout.schemaVersion, 2);
  assert.equal(layout.widgets.length, 7);

  // Raw corrupt payload must NOT be deleted from storage
  const rawAfter = storage["life-ledger-layout-v2"];
  assert.equal(rawAfter, corruptPayload, "Raw corrupt data must remain preserved in localStorage");
});

test("TodayLayoutEngine clamps invalid coordinates and out-of-bounds positions", () => {
  const { engine } = createMockEnvironment();
  const invalid = {
    schemaVersion: 2,
    view: "today",
    widgets: [
      // x: 10 with medium (w: 8) would exceed 12 columns (10 + 8 = 18)
      { id: "today-summary", type: "summary", size: "medium", x: 10, y: -5, hidden: false, settings: {} },
    ],
  };

  const result = engine.validateLayout(invalid);
  assert.equal(result.valid, false, "Invalid/out-of-bounds input must report valid: false");
  assert.ok(result.errors.length > 0);
  const w = result.layout.widgets[0];
  assert.equal(w.x, 4, "x must be clamped so x + w <= 12");
  assert.equal(w.y, 0, "negative y must be clamped to 0");
});

test("TodayLayoutEngine resolves overlapping collisions deterministically", () => {
  const { engine } = createMockEnvironment();
  // Two large widgets placed at the exact same (0, 0)
  const overlapping = {
    schemaVersion: 2,
    view: "today",
    widgets: [
      { id: "today-summary", type: "summary", size: "large", x: 0, y: 0, hidden: false, settings: {} },
      { id: "today-habits", type: "habits", size: "large", x: 0, y: 0, hidden: false, settings: {} },
    ],
  };

  const result = engine.validateLayout(overlapping);
  const widgets = result.layout.widgets;

  const w1 = widgets.find(w => w.type === "summary");
  const w2 = widgets.find(w => w.type === "habits");
  assert.ok(w1 && w2);

  const dims1 = engine.getSizeDimensions(w1.size);
  const dims2 = engine.getSizeDimensions(w2.size);

  // Rectangles must not overlap
  const overlaps = !(
    w1.x + dims1.w <= w2.x ||
    w2.x + dims2.w <= w1.x ||
    w1.y + dims1.h <= w2.y ||
    w2.y + dims2.h <= w1.y
  );
  assert.equal(overlaps, false, "Collision resolver must shift widgets so no rectangles overlap");
});

test("TodayLayoutEngine preserves unknown forward-compatible widgets", () => {
  const { engine } = createMockEnvironment();
  const futureLayout = {
    schemaVersion: 2,
    view: "today",
    widgets: [
      { id: "today-summary", type: "summary", size: "large", x: 0, y: 0, hidden: false, settings: {} },
      { id: "today-habits", type: "habits", size: "large", x: 0, y: 2, hidden: false, settings: {} },
      { id: "future-weather", type: "weather", size: "small", x: 8, y: 0, hidden: false, settings: { city: "Berlin" }, customData: 42 },
    ],
  };

  const result = engine.validateLayout(futureLayout);
  assert.equal(result.valid, true);
  const weather = result.layout.widgets.find(w => w.id === "future-weather");
  assert.ok(weather, "Unknown forward-compatible widget must be preserved");
  assert.equal(weather.type, "weather");
  assert.equal(weather.settings.city, "Berlin");
});

test("TodayLayoutEngine discrete S/M/L sizing enforces allowed dimensions and rejects others", () => {
  const { engine } = createMockEnvironment();
  assert.deepEqual(toPlain(engine.getSizeDimensions("small")), { w: 4, h: 1 });
  assert.deepEqual(toPlain(engine.getSizeDimensions("medium")), { w: 8, h: 1 });
  assert.deepEqual(toPlain(engine.getSizeDimensions("large")), { w: 8, h: 2 });

  // Invalid size falls back to medium
  assert.deepEqual(toPlain(engine.getSizeDimensions("xlarge")), { w: 8, h: 1 });
  assert.deepEqual(toPlain(engine.getSizeDimensions("tiny")), { w: 8, h: 1 });
});

test("TodayLayoutEngine transaction undo reverts previous layout change", () => {
  const { engine } = createMockEnvironment();
  const initial = engine.getLayout();
  const habitsWidget = initial.widgets.find(w => w.type === "habits");
  assert.equal(habitsWidget.size, "large");

  // Push size change
  engine._pushTransaction();
  habitsWidget.size = "medium";
  engine.writeStoredLayout(initial);

  const updated = engine.getLayout();
  assert.equal(updated.widgets.find(w => w.type === "habits").size, "medium");
  assert.equal(engine.canUndo(), true);

  // Undo
  const undone = engine.undo();
  assert.equal(undone, true);

  const restored = engine.getLayout();
  assert.equal(restored.widgets.find(w => w.type === "habits").size, "large");
});

test("TodayLayoutEngine resetLayout restores default layout", () => {
  const { engine } = createMockEnvironment();
  const layout = engine.getLayout();
  // Mutate photos widget to small and hidden
  const photos = layout.widgets.find(w => w.type === "photos");
  photos.size = "small";
  photos.hidden = true;
  engine.writeStoredLayout(layout);

  const modified = engine.getLayout();
  assert.equal(modified.widgets.find(w => w.type === "photos").size, "small");
  assert.equal(modified.widgets.find(w => w.type === "photos").hidden, true);

  // Reset
  const def = engine.resetLayout();
  assert.equal(def.widgets.length, 7);
  const resetPhotos = engine.getLayout().widgets.find(w => w.type === "photos");
  assert.equal(resetPhotos.size, "medium");
  assert.equal(resetPhotos.hidden, false);
});

test("TodayLayoutEngine cancelEditSession restores pre-edit snapshot on Escape", () => {
  const { engine } = createMockEnvironment();
  const initial = engine.getLayout();
  const photos = initial.widgets.find(w => w.type === "photos");
  assert.equal(photos.size, "medium");
  assert.equal(photos.hidden, false);

  // Enter edit mode -> takes session snapshot
  engine.setEditMode(true);
  assert.equal(engine.isEditMode(), true);

  // Perform multiple mutations during edit mode
  engine._changeWidgetSize("today-photos", "small");
  engine._toggleWidgetHidden("today-photos");

  const duringEdit = engine.getLayout();
  const photosDuring = duringEdit.widgets.find(w => w.type === "photos");
  assert.equal(photosDuring.size, "small");
  assert.equal(photosDuring.hidden, true);

  // Cancel edit session (Escape) -> restores initial layout
  engine.cancelEditSession();
  assert.equal(engine.isEditMode(), false);

  const afterCancel = engine.getLayout();
  const photosRestored = afterCancel.widgets.find(w => w.type === "photos");
  assert.equal(photosRestored.size, "medium", "Size must be restored to pre-edit state");
  assert.equal(photosRestored.hidden, false, "Hidden flag must be restored to pre-edit state");
});

test("TodayLayoutEngine _changeWidgetSize enforces discrete dimensions and clamps to columns", () => {
  const { engine } = createMockEnvironment();
  engine._changeWidgetSize("today-focus", "medium");
  const focusM = engine.getLayout().widgets.find(w => w.type === "focus");
  assert.equal(focusM.size, "medium");
  assert.ok(focusM.x + 8 <= 12, "Medium widget (w=8) must not overflow 12 columns");

  engine._changeWidgetSize("today-focus", "large");
  const focusL = engine.getLayout().widgets.find(w => w.type === "focus");
  assert.equal(focusL.size, "large");
  assert.ok(focusL.x + 8 <= 12, "Large widget (w=8) must not overflow 12 columns");
});
