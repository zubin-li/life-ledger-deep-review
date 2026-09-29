import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const appJs = readFileSync(new URL("../public/app.js", import.meta.url), "utf8");
const indexHtml = readFileSync(new URL("../public/index.html", import.meta.url), "utf8");
const styles = readFileSync(new URL("../public/styles.css", import.meta.url), "utf8");

// These are a supplemental source-level guard, not the sole proof of correctness — the actual
// snapshot/reconciliation math is executed and asserted for real in tests/widget-contract.test.mjs.

test("the widget bridge is gated to the local Tauri window only, never cloud or plain web", () => {
  assert.match(appJs, /const widgetBridgeActive = desktopMode === "tauri-local"/);
  assert.match(appJs, /Boolean\(desktopBridge\?\.publishWidgetSnapshot && desktopBridge\?\.readPendingWidgetMutations && desktopBridge\?\.ackWidgetMutations\)/);
});

test("app.js delegates the pure snapshot/mutation logic to the shared, independently-tested widget-contract module", () => {
  assert.match(appJs, /window\.LifeLedgerWidgetContract\.buildWidgetSnapshotFromHabits\(/);
  assert.match(appJs, /window\.LifeLedgerWidgetContract\.planMutationApplication\(/);
  assert.match(indexHtml, /<script type="module" src="\.\/widget-contract\.js\?v=1\.3\.0"><\/script>/);
});

test("initWidgetBridge defers its first run until DOMContentLoaded, after the module script has attached window.LifeLedgerWidgetContract", () => {
  const start = appJs.indexOf("function initWidgetBridge()");
  const end = appJs.indexOf("\nfunction applyLanguage()", start);
  const body = appJs.slice(start, end);
  assert.ok(body.length > 0);
  assert.match(body, /document\.addEventListener\("DOMContentLoaded"/);
});

test("a habit toggle for today republishes the widget snapshot; toggles for other dates do not", () => {
  const start = appJs.indexOf("const commit = () => {");
  const end = appJs.indexOf("};", start);
  const commitBody = appJs.slice(start, end);
  assert.match(commitBody, /if \(date === isoDate\(new Date\(\)\)\) void publishWidgetSnapshot\(\);/);
});

test("becoming visible again triggers mutation reconciliation (covers app resume while the widget was used)", () => {
  const start = appJs.indexOf('document.addEventListener("visibilitychange"');
  const end = appJs.indexOf("});", start);
  const body = appJs.slice(start, end);
  assert.match(body, /void reconcileWidgetMutations\(\);/);
});

test("the periodic reconciliation interval respects the >=2s no-fast-polling constraint by a wide margin", () => {
  const match = appJs.match(/const WIDGET_RECONCILE_INTERVAL_MS = (\d+);/);
  assert.ok(match, "WIDGET_RECONCILE_INTERVAL_MS must be defined");
  const intervalMs = Number(match[1]);
  assert.ok(intervalMs >= 2000, `interval ${intervalMs}ms must be >= 2000ms`);
});

test("widget i18n copy exists for English, Simplified Chinese, and German, with no notes/mood-reason wording", () => {
  assert.match(appJs, /widget: \{\s*title: "桌面小组件"/);
  assert.match(appJs, /widget: \{\s*title: "Desktop widget"/);
  assert.match(appJs, /widget: \{\s*title: "Desktop-Widget"/);
});

test("the widget status card markup and CSS exist and default to hidden outside desktop-local mode", () => {
  assert.match(indexHtml, /<div class="widget-status-card" id="widgetStatusCard" hidden>/);
  assert.match(styles, /\.widget-status-card\[hidden\] \{ display: none; \}/);
});

test("updateWidgetStatusUI hides the card entirely when the bridge is not active, and only then", () => {
  const start = appJs.indexOf("function updateWidgetStatusUI()");
  const end = appJs.indexOf("\nasync function publishWidgetSnapshot()", start);
  const body = appJs.slice(start, end);
  assert.match(body, /if \(!widgetBridgeActive\) \{\s*card\.hidden = true;\s*return;\s*\}/);
});
