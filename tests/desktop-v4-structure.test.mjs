import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const root = new URL("../", import.meta.url);
const read = path => readFileSync(new URL(path, root), "utf8");
const html = read("public/index.html");
const css = read("public/styles.css");
const app = read("public/app.js");
const lib = read("src-tauri/src/lib.rs");
const pkg = JSON.parse(read("package.json"));

test("4.0.0 is the install identity across package, assets, cache, and About", () => {
  assert.equal(pkg.version, "4.0.0");
  assert.match(html, /styles\.css\?v=4\.0\.0/);
  assert.match(html, /app\.js\?v=4\.0\.0/);
  assert.match(read("public/sw.js"), /life-ledger-pwa-4\.0\.0/);
  assert.match(read("src-tauri/tauri.conf.json"), /"version": "4\.0\.0"/);
  assert.match(read("src-tauri/Cargo.toml"), /version = "4\.0\.0"/);
  assert.match(html, /id="appVersionLabel">4\.0\.0</);
  assert.match(html, /id="aboutBuild">Life Ledger 4\.0\.0</);
});

test("the five desktop first viewports are recomposed, not appended to the 3.0 list", () => {
  assert.match(html, /class="view active today-desk"/);
  assert.match(html, /class="today-desk-grid"/);
  assert.match(html, /class="today-sheet today-journal"/);
  assert.match(css, /html\[data-desktop\] \.today-desk-grid \{ display: grid; grid-template-columns: minmax\(0, 1\.15fr\) minmax\(280px, 360px\)/);
  assert.match(css, /html\[data-desktop\] \.today-date-heading \{ margin: 0; font: 560 44px\/0\.96 var\(--font-display\)/);
  assert.doesNotMatch(css, /html\[data-desktop\] \.today-date-heading \{ margin: 0; font: var\(--text-section-title\)/);
  assert.match(html, /class="view week-board"/);
  assert.match(css, /html\[data-desktop\] \.week-agenda \{ display: grid; grid-template-columns: repeat\(7, minmax\(0, 1fr\)\)/);
  assert.match(html, /class="view timeline-journal"/);
  assert.match(css, /html\[data-desktop\] \.timeline-layout \{ grid-template-columns: minmax\(0, 1fr\) 292px/);
  assert.match(css, /html\[data-desktop\] \.timeline-detail-empty \{[^}]*font: 560 34px/);
  assert.match(html, /review-manuscript/);
  assert.match(css, /html\[data-desktop\] \.review-intro #reviewTitle \{[^}]*font: 560 46px/);
  assert.match(html, /class="view habit-library"/);
  assert.match(css, /html\[data-desktop\] \.habit-settings-header \{ display: none; \}/);
  assert.match(css, /--sidebar-ink: #241f1a/);
});

test("tauri-local retires the PWA service worker cache without deleting user data", () => {
  assert.match(app, /async function retireDesktopServiceWorker\(\)/);
  assert.match(app, /document\.documentElement\.dataset\.desktop === "tauri-local"/);
  assert.match(app, /key\.startsWith\("life-ledger-pwa-"\)/);
  assert.match(app, /registration\.unregister\(\)/);
  assert.doesNotMatch(app, /indexedDB\.deleteDatabase/);
  assert.doesNotMatch(app, /localStorage\.clear\(/);
  const registerAt = app.indexOf('navigator.serviceWorker.register("./sw.js"');
  const gate = app.indexOf('document.documentElement.dataset.desktop === "tauri-local"');
  assert.ok(gate > 0 && registerAt > gate, "service worker registration must stay in the non-local branch");
});

test("the native shell sets Life Ledger 4 titles and traffic-light position", () => {
  assert.match(lib, /Life Ledger 4 · Local/);
  assert.match(lib, /Life Ledger 4 · Deep Review/);
  assert.equal((lib.match(/traffic_light_position\(tauri::LogicalPosition::new\(16\.0, 16\.0\)\)/g) || []).length, 4);
});
