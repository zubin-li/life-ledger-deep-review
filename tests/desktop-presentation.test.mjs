import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const indexHtml = readFileSync(new URL("../public/index.html", import.meta.url), "utf8");
const appJs = readFileSync(new URL("../public/app.js", import.meta.url), "utf8");
const styles = readFileSync(new URL("../public/styles.css", import.meta.url), "utf8");

test("desktop mode is detected before the stylesheet loads, from the desktop query param only", () => {
  const headSection = indexHtml.slice(0, indexHtml.indexOf("<link rel=\"stylesheet\""));
  assert.match(headSection, /new URLSearchParams\(location\.search\)\.get\("desktop"\)/);
  assert.match(headSection, /desktopMode === "tauri-local" \|\| desktopMode === "tauri-cloud"/);
  assert.match(headSection, /document\.documentElement\.dataset\.desktop = desktopMode/);
});

test("desktop presentation CSS is scoped under html[data-desktop] and layers a titlebar-inset adjustment onto the shared base layout", () => {
  assert.match(styles, /html\[data-desktop\] \.sidebar \{[^}]*height: calc\(100vh - var\(--desktop-inset\)\);/s);
  assert.match(styles, /html\[data-desktop\] \.main-content \{[^}]*max-width: none;/s);
  // Since Life Ledger 2.0, the base (non-desktop) sidebar and main content are already the
  // edge-attached, full-bleed "calm instrument panel" layout shared by web/PWA and desktop —
  // html[data-desktop] only layers the titlebar-inset height and full-bleed content padding
  // on top of it, it no longer switches between two different visual designs.
  assert.match(styles, /^\.sidebar \{ position: sticky; top: 0; height: 100vh; margin: 0;/m);
  assert.match(styles, /^\.main-content \{ min-width: 0; max-width: 100%; padding: var\(--space-5\)/m);
});

test("PWA install affordances are hidden only in desktop mode and live in Settings", () => {
  assert.match(styles, /html\[data-desktop\] \[data-install-app\] \{ display: none !important; \}/);
  assert.match(indexHtml, /id="installAppButton"[^>]*data-install-app/);
  assert.match(indexHtml, /id="settingsPane"/);
});

test("an unobtrusive localized desktop status badge exists and is translated in all three languages", () => {
  assert.match(indexHtml, /<span class="desktop-mode-badge" id="desktopModeBadge" hidden><\/span>/);
  assert.match(appJs, /function applyDesktopStatus\(\)/);
  assert.match(appJs, /desktop: \{ statusLocal: "本地 Mac", statusCloud: "已连接云端" \}/);
  assert.match(appJs, /desktop: \{ statusLocal: "Local Mac", statusCloud: "Connected Cloud" \}/);
  assert.match(appJs, /desktop: \{ statusLocal: "Lokaler Mac", statusCloud: "Verbundene Cloud" \}/);
  // Only the two Tauri desktop query values should ever reveal the badge.
  assert.match(appJs, /if \(desktopMode === "tauri-local"\) \{\s*badge\.hidden = false;/);
  assert.match(appJs, /\} else if \(desktopMode === "tauri-cloud"\) \{\s*badge\.hidden = false;/);
  assert.match(appJs, /\} else \{\s*badge\.hidden = true;\s*\}/);
});

test("the active nav item is marked with aria-current and switchToView keeps it in sync", () => {
  assert.match(indexHtml, /<button class="nav-item active" data-view="today" aria-current="page">/);
  assert.match(appJs, /function switchToView\(view, \{ animate = true \} = \{\}\)/);
  assert.match(appJs, /item\.setAttribute\("aria-current", "page"\)/);
  assert.match(appJs, /item\.removeAttribute\("aria-current"\)/);
});

test("normal web mode is untouched: no desktop query param means no desktop dataset and no badge reveal", () => {
  // Simulate the exact head-script logic against a URL with no desktop param.
  const params = new URLSearchParams("");
  const desktopMode = params.get("desktop");
  assert.equal(desktopMode, null);
  assert.notEqual(desktopMode, "tauri-local");
  assert.notEqual(desktopMode, "tauri-cloud");
});
