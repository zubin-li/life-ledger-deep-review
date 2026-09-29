import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const appJs = readFileSync(new URL("../public/app.js", import.meta.url), "utf8");

function slice(source, startMarker, endMarker) {
  const start = source.indexOf(startMarker);
  assert.ok(start !== -1, `missing marker: ${startMarker}`);
  const end = source.indexOf(endMarker, start);
  assert.ok(end !== -1, `missing end marker: ${endMarker}`);
  return source.slice(start, end);
}

const shortcuts = slice(appJs, "function initDesktopShortcuts()", "\nsyncExportButtonPlacement();");

test("desktop shortcuts are gated to desktop mode only, never active in plain web/PWA mode", () => {
  assert.match(shortcuts, /if \(desktopMode !== "tauri-local" && desktopMode !== "tauri-cloud"\) return;/);
});

test("desktop shortcuts require the Cmd modifier and ignore editable targets", () => {
  assert.match(shortcuts, /if \(!event\.metaKey \|\| event\.repeat \|\| isEditableTarget\(event\.target\)\) return;/);
  assert.match(appJs, /function isEditableTarget\(target\) \{/);
  assert.match(appJs, /"input, textarea, select, \[contenteditable='true'\]"/);
});

test("Cmd+1..5 map to Today, Week, Timeline, Review, Habits in order", () => {
  assert.match(appJs, /const DESKTOP_SHORTCUT_VIEWS = \["today", "week", "timeline", "review", "habits"\];/);
  assert.match(shortcuts, /if \(\/\^\[1-5\]\$\/\.test\(event\.key\)\)/);
  assert.match(shortcuts, /switchToView\(DESKTOP_SHORTCUT_VIEWS\[Number\(event\.key\) - 1\], \{ animate: false \}\)/);
});

test("Cmd+B toggles the sidebar, Cmd+, opens Habits Settings, Cmd+Shift+E opens backup/export", () => {
  assert.match(shortcuts, /event\.key\.toLowerCase\(\) === "b"/);
  assert.match(shortcuts, /sidebarCollapsed = !sidebarCollapsed;/);
  assert.match(shortcuts, /event\.key === ","/);
  assert.match(shortcuts, /switchToView\("habits", \{ animate: false \}\)/);
  assert.match(shortcuts, /event\.shiftKey && event\.key\.toLowerCase\(\) === "e"/);
  assert.match(shortcuts, /withoutMotion\(\(\) => openBackupDialog\(\)\)/);
});

test("every matched shortcut branch calls preventDefault so it cannot fall through to default browser/system behavior", () => {
  const calls = shortcuts.match(/event\.preventDefault\(\);/g) || [];
  assert.equal(calls.length, 4, "expected one preventDefault per shortcut branch (views, sidebar, settings, export)");
});

test("keyboard shortcuts run through withoutMotion so they never animate, unlike mouse-driven nav clicks", () => {
  assert.match(shortcuts, /switchToView\(DESKTOP_SHORTCUT_VIEWS\[Number\(event\.key\) - 1\], \{ animate: false \}\)/);
  assert.match(shortcuts, /switchToView\("habits", \{ animate: false \}\)/);
  assert.match(shortcuts, /withoutMotion\(\(\) => \{/);
  // Mouse clicks on nav items keep the default animate:true path.
  assert.match(appJs, /button\.addEventListener\("click", \(\) => switchToView\(button\.dataset\.view\)\)/);
});

test("initDesktopShortcuts is wired into the app boot sequence", () => {
  assert.match(appJs, /initDesktopShortcuts\(\); initWidgetBridge\(\);\s*$/m);
});
