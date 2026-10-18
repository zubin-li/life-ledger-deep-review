import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const widgetRegistrySrc = readFileSync(new URL("../public/widget-registry.js", import.meta.url), "utf8");

function createMockEnvironment() {
  const elements = new Map();

  function makeMockElement(tag, className = "", id = "") {
    const children = [];
    const classListSet = new Set(className ? className.split(/\s+/) : []);
    const dataset = {};
    const attrs = new Map();
    const el = {
      tagName: tag.toUpperCase(),
      id,
      className,
      dataset,
      style: {},
      hidden: false,
      rows: 0,
      value: "",
      innerHTML: "",
      textContent: "",
      classList: {
        add(...c) { c.forEach(x => classListSet.add(x)); },
        remove(...c) { c.forEach(x => classListSet.delete(x)); },
        toggle(c, force) {
          if (force === undefined) {
            if (classListSet.has(c)) classListSet.delete(c);
            else classListSet.add(c);
          } else if (force) classListSet.add(c);
          else classListSet.delete(c);
        },
        contains(c) { return classListSet.has(c); },
      },
      setAttribute(k, v) { attrs.set(k, String(v)); },
      getAttribute(k) { return attrs.get(k) || null; },
      removeAttribute(k) { attrs.delete(k); },
      appendChild(child) {
        children.push(child);
        return child;
      },
      before(child) {
        children.unshift(child);
      },
      prepend(child) {
        children.unshift(child);
      },
      querySelector(selector) {
        return elements.get(selector) || null;
      },
      querySelectorAll(selector) {
        return elements.has(selector) ? [elements.get(selector)] : [];
      },
      children,
      addEventListener() {},
      removeEventListener() {},
      focus() {},
    };
    if (id) elements.set(`#${id}`, el);
    if (className) {
      className.split(/\s+/).forEach(c => elements.set(`.${c}`, el));
    }
    return el;
  }

  const mockDocument = {
    createElement: tag => makeMockElement(tag),
    getElementById: id => elements.get(`#${id}`) || null,
    querySelector: sel => elements.get(sel) || null,
    querySelectorAll: sel => elements.has(sel) ? [elements.get(sel)] : [],
    documentElement: {
      classList: {
        contains: () => false,
      },
      lang: "en",
    },
  };

  const sandbox = {
    console,
    document: mockDocument,
    window: {},
    globalThis: {},
  };
  sandbox.window = sandbox;
  sandbox.globalThis = sandbox;

  vm.createContext(sandbox);
  vm.runInContext(widgetRegistrySrc, sandbox);
  return {
    registry: sandbox.LifeLedgerWidgetRegistry,
    WidgetRegistry: sandbox.WidgetRegistry || sandbox.LifeLedgerWidgetRegistry.constructor,
    makeMockElement,
    registerMockElement: (sel, el) => elements.set(sel, el),
  };
}

function toPlain(obj) {
  return JSON.parse(JSON.stringify(obj));
}

test("WidgetRegistry registers seven core widgets with content-specific allowed sizes", () => {
  const { registry } = createMockEnvironment();
  const expectedTypes = ["summary", "habits", "calendar", "focus", "photos", "reflection", "context"];

  for (const type of expectedTypes) {
    const widget = registry.get(type);
    assert.ok(widget, `Widget "${type}" must be registered in the registry`);
    assert.equal(widget.type, type);
    assert.deepEqual(toPlain(widget.allowedSizes), ["small", "medium", "large"], `Widget "${type}" must expose its real size policy`);
    assert.ok(["small", "medium", "large"].includes(widget.defaultSize));
    assert.equal(typeof widget.render, "function");
    assert.equal(typeof widget.getA11ySummary, "function");
  }

  const all = registry.getAll();
  assert.equal(all.length, 7, "Registry must contain exactly the 7 Today widgets by default");
});

test("WidgetRegistry summary widget renders distinct content hierarchies across S/M/L", () => {
  const { registry, makeMockElement, registerMockElement } = createMockEnvironment();
  const summaryWidget = registry.get("summary");

  const card = makeMockElement("article", "module-card", "summaryCard");
  const meta = makeMockElement("div", "today-stage-meta");
  const mood = makeMockElement("div", "", "quickMood");
  const reflectBtn = makeMockElement("button", "today-reflect", "openDayDetail");
  const eventsStrip = makeMockElement("div", "today-events-strip", "todayEventsStrip");

  registerMockElement(".today-stage-meta", meta);
  registerMockElement("#quickMood", mood);
  registerMockElement("#openDayDetail", reflectBtn);
  registerMockElement("#todayEventsStrip", eventsStrip);

  // Small size: date + completion only (meta & eventsStrip hidden)
  summaryWidget.render({ element: card, size: "small" });
  assert.equal(card.dataset.widgetSize, "small");
  assert.equal(meta.hidden, true);
  assert.equal(eventsStrip.hidden, true);

  // Medium size: adds mood, eventsStrip
  summaryWidget.render({ element: card, size: "medium" });
  assert.equal(card.dataset.widgetSize, "medium");
  assert.equal(meta.hidden, false);
  assert.equal(mood.hidden, false);
  assert.equal(eventsStrip.hidden, false);

  // Large size: adds context, greeting, and review prompt
  summaryWidget.render({ element: card, size: "large" });
  assert.equal(card.dataset.widgetSize, "large");
  assert.equal(meta.hidden, false);
  assert.equal(reflectBtn.hidden, false);
  assert.equal(eventsStrip.hidden, false);
});

test("WidgetRegistry focus widget renders distinct hierarchies across S/M/L", () => {
  const { registry, makeMockElement, registerMockElement } = createMockEnvironment();
  const focusWidget = registry.get("focus");

  const card = makeMockElement("article", "module-card");
  const streakArt = makeMockElement("div", "hairline-mount", "todayFocusStreakArt");
  const openTimerBtn = makeMockElement("button", "secondary-button", "todayFocusOpenTimer");

  registerMockElement("#todayFocusStreakArt", streakArt);
  registerMockElement("#todayFocusOpenTimer", openTimerBtn);

  // Small size: timer + start/pause (presets & streak hidden; primary action buttons openTimerBtn & startBtn remain visible!)
  focusWidget.render({ element: card, size: "small" });
  assert.equal(card.dataset.widgetSize, "small");
  assert.equal(streakArt.hidden, true);
  assert.equal(openTimerBtn.hidden, false, "Focus primary action openTimerBtn must remain visible in small size");

  // Large size: streak art and timer settings visible
  focusWidget.render({ element: card, size: "large" });
  assert.equal(card.dataset.widgetSize, "large");
  assert.equal(streakArt.hidden, false);
  assert.equal(openTimerBtn.hidden, false);
});

test("WidgetRegistry habits widget renders distinct hierarchies across S/M/L using .today-habit-row", () => {
  const { registry, makeMockElement } = createMockEnvironment();
  const habitsWidget = registry.get("habits");

  const card = makeMockElement("article", "module-card", "habitsCard");
  const habitList = makeMockElement("ul", "today-habit-list", "todayHabitList");
  card.appendChild(habitList);

  const row1 = makeMockElement("li", "today-habit-row", "h1");
  const row2 = makeMockElement("li", "today-habit-row", "h2");
  const row3 = makeMockElement("li", "today-habit-row", "h3");
  const row4 = makeMockElement("li", "today-habit-row", "h4");
  const row5 = makeMockElement("li", "today-habit-row", "h5");
  const allRows = [row1, row2, row3, row4, row5];
  allRows.forEach(r => habitList.appendChild(r));

  // Small size: next habit only (1 row visible)
  card.querySelectorAll = sel => (sel.includes(".today-habit-row") ? allRows : []);
  habitsWidget.render({ element: card, size: "small" });
  assert.equal(row1.hidden, false, "Row 1 must be visible in small");
  assert.equal(row2.hidden, true, "Row 2 must be hidden in small");
  assert.equal(row3.hidden, true, "Row 3 must be hidden in small");

  // Medium size: priority habits (up to 4 rows visible)
  habitsWidget.render({ element: card, size: "medium" });
  assert.equal(row1.hidden, false, "Row 1 must be visible in medium");
  assert.equal(row2.hidden, false, "Row 2 must be visible in medium");
  assert.equal(row3.hidden, false, "Row 3 must be visible in medium");
  assert.equal(row4.hidden, false, "Row 4 must be visible in medium");
  assert.equal(row5.hidden, true, "Row 5 must be hidden in medium");

  // Large size: full list (all 5 rows visible)
  habitsWidget.render({ element: card, size: "large" });
  assert.equal(row1.hidden, false);
  assert.equal(row2.hidden, false);
  assert.equal(row3.hidden, false);
  assert.equal(row4.hidden, false);
  assert.equal(row5.hidden, false);
});

test("WidgetRegistry rejects invalid sizes and requires render function", () => {
  const { registry } = createMockEnvironment();

  assert.throws(() => {
    registry.register({
      id: "invalid-widget",
      type: "invalid",
      allowedSizes: ["tiny", "huge"],
      defaultSize: "tiny",
      render: () => {},
    });
  }, /Invalid size "tiny"/);

  assert.throws(() => {
    registry.register({
      id: "no-render",
      type: "no-render",
      allowedSizes: ["small", "medium", "large"],
      defaultSize: "small",
    });
  }, /Widget render must be a function/);
});
