import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const appJs = readFileSync(new URL("../public/app.js", import.meta.url), "utf8");
const libRs = readFileSync(new URL("../src-tauri/src/lib.rs", import.meta.url), "utf8");

function slice(source, startMarker, endMarker) {
  const start = source.indexOf(startMarker);
  assert.ok(start !== -1, `missing marker: ${startMarker}`);
  const end = source.indexOf(endMarker, start);
  assert.ok(end !== -1, `missing end marker: ${endMarker}`);
  return source.slice(start, end);
}

const menuBridge = slice(appJs, "async function initMenuBridge()", "\ninitAppShell()");
const webShortcuts = slice(appJs, "function initWebShortcuts()", "\nasync function initMenuBridge");

test("desktop menu bridge listens for menu://action only in tauri desktop mode", () => {
  assert.match(menuBridge, /if \(desktopMode !== "tauri-local" && desktopMode !== "tauri-cloud"\) return;/);
  assert.match(menuBridge, /listen\("menu:\/\/action"/);
  assert.match(menuBridge, /handleMenuAction\(String\(event\.payload \|\| ""\)\)/);
});

test("web/PWA shortcuts stay on keydown fallback and never register the tauri menu listener path", () => {
  assert.match(webShortcuts, /if \(desktopMode === "tauri-local" \|\| desktopMode === "tauri-cloud"\) return;/);
  assert.match(webShortcuts, /event\.metaKey \|\| event\.ctrlKey/);
  assert.match(webShortcuts, /isEditableTarget\(event\.target\)/);
});

test("Cmd+1..5 map to Today, Week, Timeline, Review, Habits in web fallback", () => {
  assert.match(appJs, /const DESKTOP_SHORTCUT_VIEWS = \["today", "week", "timeline", "review", "habits"\];/);
  assert.match(webShortcuts, /if \(\/\^\[1-5\]\$\/\.test\(event\.key\)\)/);
  assert.match(webShortcuts, /switchToView\(DESKTOP_SHORTCUT_VIEWS\[Number\(event\.key\) - 1\], \{ animate: false \}\)/);
});

test("Cmd+B toggles sidebar, Cmd+, opens Settings, Cmd+F focuses quick find in web fallback", () => {
  assert.match(webShortcuts, /event\.key\.toLowerCase\(\) === "b"/);
  assert.match(webShortcuts, /toggleSidebar\(\)/);
  assert.match(webShortcuts, /event\.key === ","/);
  assert.match(webShortcuts, /openSettings\(\)/);
  assert.match(webShortcuts, /event\.key\.toLowerCase\(\) === "f"/);
  assert.match(webShortcuts, /\$\("#quickFind"\)\?\.focus/);
});

test("handleMenuAction routes native menu payloads for views, panes, settings, find, and backup", () => {
  assert.match(appJs, /function handleMenuAction\(action\)/);
  assert.match(appJs, /action\.startsWith\("view:"\)/);
  assert.match(appJs, /action === "sidebar:toggle"/);
  assert.match(appJs, /action === "inspector:toggle"/);
  assert.match(appJs, /action === "settings"/);
  assert.match(appJs, /action === "find"/);
  assert.match(appJs, /action === "export"/);
  assert.match(appJs, /withoutMotion\(\(\) => openBackupDialog\(\)\)/);
});

test("rust menu ids map to stable action strings consumed by the webview", () => {
  assert.match(libRs, /fn menu_action_for_id\(id: &str\) -> Option<&'static str>/);
  assert.match(libRs, /"view_today" => Some\("view:today"\)/);
  assert.match(libRs, /"inspector_toggle" => Some\("inspector:toggle"\)/);
  assert.match(libRs, /emit\(MENU_EVENT, action\)/);
});

test("keyboard-initiated navigation still suppresses motion via withoutMotion or animate:false", () => {
  assert.match(webShortcuts, /switchToView\(DESKTOP_SHORTCUT_VIEWS\[Number\(event\.key\) - 1\], \{ animate: false \}\)/);
  assert.match(appJs, /function withoutMotion\(run\) \{/);
  assert.match(appJs, /button\.addEventListener\("click", \(\) => switchToView\(button\.dataset\.view\)\)/);
});

test("menu bridge and web shortcuts are wired into the app boot sequence", () => {
  assert.match(appJs, /void initMenuBridge\(\); initWebShortcuts\(\); initWidgetBridge\(\);/);
});
