import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const root = new URL("../", import.meta.url);
const read = path => readFileSync(new URL(path, root), "utf8");

function loadInteraction() {
  const context = { globalThis: {}, document: { documentElement: { classList: { contains: () => false } } }, matchMedia: () => ({ matches: false }) };
  context.globalThis = context;
  context.window = context;
  vm.createContext(context);
  vm.runInContext(read("public/interaction.js"), context);
  return context.LifeLedgerInteraction;
}

const api = loadInteraction();
const html = read("public/index.html");
const css = read("public/styles.css");
const app = read("public/app.js");

test("command filtering keeps every token and highlights the match", () => {
  const commands = [
    { id: "view:today", title: "Go to Today", keywords: "today view" },
    { id: "habit:read", title: "Mark Read done today", keywords: "read habit" },
    { id: "lang:zh", title: "使用简体中文", keywords: "language zh 中文" },
  ];
  assert.deepEqual(api.filterCommands(commands, "timeline missing").map(item => item.id), []);
  assert.deepEqual(api.filterCommands(commands, "read today").map(item => item.id), ["habit:read"]);
  assert.deepEqual(api.filterCommands(commands, "中文").map(item => item.id), ["lang:zh"]);
  assert.equal(api.highlightMarkup("Mark Read done", "read"), "Mark <mark>Read</mark> done");
  assert.equal(api.filterCommands(commands, "").length, 3);
});

test("keyboard selection wraps and an empty list stays empty", () => {
  assert.equal(api.nextSelection(-1, 1, 3), 0);
  assert.equal(api.nextSelection(2, 1, 3), 0);
  assert.equal(api.nextSelection(0, -1, 3), 2);
  assert.equal(api.nextSelection(0, 1, 0), -1);
});

test("view direction and disclosure keep one open group", () => {
  assert.equal(api.viewDirection("today", "review"), 1);
  assert.equal(api.viewDirection("habits", "week"), -1);
  assert.equal(api.viewDirection("today", "today"), 0);
  assert.deepEqual(JSON.parse(JSON.stringify(api.disclosureState(["completed"], "later", true))), ["later"]);
  assert.deepEqual(JSON.parse(JSON.stringify(api.disclosureState(["later"], "later", false))), []);
});

test("selection geometry retargets from the latest frame and skips travel when reduced", () => {
  const first = api.indicatorGeometry({ left: 0, top: 0 }, { left: 8, top: 10, width: 80, height: 32 });
  const second = api.indicatorGeometry({ left: 0, top: 0 }, { left: 8, top: 48, width: 120, height: 32 });
  const traveling = api.motionPlan(first, second, { reduced: false });
  const interrupted = api.motionPlan(first, { ...second, y: 90 }, { reduced: false });
  assert.equal(traveling.animate, true);
  assert.equal(interrupted.frame.y, 90);
  assert.notEqual(interrupted.frame, traveling.frame);
  const reduced = api.motionPlan(first, second, { reduced: true });
  assert.equal(reduced.animate, false);
  assert.deepEqual(reduced.frame, second);
  assert.equal(api.flipDelta(first, second).scaleX, 80 / 120);
});

test("review badge is real pending work and acknowledge clears it", () => {
  assert.deepEqual(JSON.parse(JSON.stringify(api.badgeVisibility(2, 0))), { visible: true, count: 2 });
  assert.deepEqual(JSON.parse(JSON.stringify(api.badgeVisibility(2, 2))), { visible: false, count: 2 });
  assert.deepEqual(JSON.parse(JSON.stringify(api.badgeVisibility(0, 0))), { visible: false, count: 0 });
});

test("the desktop shell exposes one sliding nav, a command palette, and the 12-column desk", () => {
  assert.match(html, /class="nav-indicator"/);
  assert.match(html, /id="commandPalette"/);
  assert.match(html, /data-disclosure-group="today"/);
  assert.match(html, /class="today-primary"/);
  assert.match(html, /class="today-context"/);
  assert.match(html, /id="reviewHeatmap"/);
  assert.match(html, /id="reviewHabitCompare"/);
  assert.match(app, /mountCommandPalette\(/);
  assert.match(app, /recentUnreflectedCount\(/);
  assert.match(css, /grid-column: span 7/);
  assert.match(css, /grid-column: span 5/);
  assert.match(css, /prefers-reduced-motion: reduce[\s\S]*\.nav-indicator/);
  assert.doesNotMatch(html, /class="floating-dock"|class="mega-panel"/);
});
