import test from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import { mkdtemp, readFile, rm, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { prepare } from "../scripts/android-prepare.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

async function loadFaceHelpers({ dataset = {}, search = "", hostname = "zubin-li.github.io", hasAndroidBridge = false } = {}) {
  const source = await readFile(resolve(root, "public/android-face.js"), "utf8");
  const listeners = [];
  const docEl = {
    dataset: { ...dataset },
    classList: { toggle() {}, add() {}, remove() {} },
  };
  const win = {
    location: { search, hostname, protocol: "https:", href: `https://${hostname}/${search}` },
    LifeLedgerAndroidBackup: hasAndroidBridge ? {} : undefined,
    addEventListener: (...args) => listeners.push(args),
    dispatchEvent() {},
  };
  const sandbox = {
    window: win,
    location: win.location,
    URLSearchParams,
    document: {
      documentElement: docEl,
      readyState: "loading",
      addEventListener: (...args) => listeners.push(args),
      querySelector: () => null,
      getElementById: () => null,
    },
    localStorage: { getItem: () => null, setItem() {} },
    setTimeout: () => 0,
    Intl,
    Date,
    Set,
    Array,
    Object,
    String,
    Number,
    Boolean,
  };
  vm.runInNewContext(source, sandbox, { filename: "public/android-face.js" });
  return { win, docEl, listeners };
}

test("Android-flag gating keeps web and macOS builds completely free of Android face", async () => {
  const publicHtml = await readFile(resolve(root, "public/index.html"), "utf8");
  assert.doesNotMatch(publicHtml, /data-android-app="true"/, "public/index.html must not hardcode data-android-app");

  const tempDist = await mkdtemp(join(tmpdir(), "ll-android-gating-"));
  try {
    await prepare(tempDist);
    const androidDistHtml = await readFile(resolve(tempDist, "index.html"), "utf8");
    assert.match(androidDistHtml, /<html lang="en" data-android-app="true">/, "android-dist/index.html must enable data-android-app");
  } finally {
    await rm(tempDist, { recursive: true, force: true });
  }

  // Remote host with ?platform=android must stay inactive
  const remoteAttempt = await loadFaceHelpers({ hostname: "zubin-li.github.io", search: "?platform=android" });
  assert.equal(remoteAttempt.win.LifeLedgerAndroidFace, undefined);
  assert.equal(remoteAttempt.docEl.dataset.androidApp, undefined);
  assert.equal(remoteAttempt.listeners.length, 0);

  // Localhost without ?platform=android must stay inactive (regular web/macOS dev)
  const localNormal = await loadFaceHelpers({ hostname: "localhost", search: "" });
  assert.equal(localNormal.win.LifeLedgerAndroidFace, undefined);
  assert.equal(localNormal.listeners.length, 0);

  // Localhost with ?platform=android activates preview
  const localPreview = await loadFaceHelpers({ hostname: "127.0.0.1", search: "?platform=android" });
  assert.equal(localPreview.docEl.dataset.androidApp, "true");
  assert.equal(localPreview.win.LifeLedgerAndroidFace.isActive(), true);

  // Explicit data-android-app="true" (Android WebView build) activates on any host
  const androidBuild = await loadFaceHelpers({ hostname: "tauri.localhost", dataset: { androidApp: "true" } });
  assert.equal(androidBuild.win.LifeLedgerAndroidFace.isActive(), true);
});

test("Predictive back stack follows strict priority: sheet -> dialog -> welcome -> sub-page -> Today -> OS exit", async () => {
  const { win } = await loadFaceHelpers({ hostname: "example.com" });
  const { resolvePredictiveBackAction } = win.LifeLedgerAndroidFaceHelpers;

  assert.deepEqual(
    { ...resolvePredictiveBackAction({ sheetOpen: true, dialogOpen: true, welcomeStep: 2, activeView: "week" }) },
    { handled: true, action: "close-sheet" },
  );
  assert.deepEqual(
    { ...resolvePredictiveBackAction({ sheetOpen: false, dialogOpen: true, welcomeStep: 2, activeView: "week" }) },
    { handled: true, action: "close-dialog" },
  );
  assert.deepEqual(
    { ...resolvePredictiveBackAction({ sheetOpen: false, dialogOpen: false, welcomeStep: 2, activeView: "today" }) },
    { handled: true, action: "welcome-prev" },
  );
  assert.deepEqual(
    { ...resolvePredictiveBackAction({ sheetOpen: false, dialogOpen: false, welcomeStep: 0, activeView: "week" }) },
    { handled: true, action: "to-timeline", targetView: "timeline" },
  );
  assert.deepEqual(
    { ...resolvePredictiveBackAction({ sheetOpen: false, dialogOpen: false, welcomeStep: 0, activeView: "review" }) },
    { handled: true, action: "to-timeline", targetView: "timeline" },
  );
  assert.deepEqual(
    { ...resolvePredictiveBackAction({ sheetOpen: false, dialogOpen: false, welcomeStep: 0, activeView: "ledger" }) },
    { handled: true, action: "to-today", targetView: "today" },
  );
  assert.deepEqual(
    { ...resolvePredictiveBackAction({ sheetOpen: false, dialogOpen: false, welcomeStep: 0, activeView: "today" }) },
    { handled: false, action: "exit-app" },
  );
});

test("Phase 1 assets: Plus Jakarta Sans OFL fonts, THIRD_PARTY_NOTICES, and scoped reduced-motion CSS", async () => {
  const css = await readFile(resolve(root, "public/android-face.css"), "utf8");
  const notices = await readFile(resolve(root, "THIRD_PARTY_NOTICES.md"), "utf8");

  assert.match(notices, /Plus Jakarta Sans/);
  assert.match(notices, /SIL Open Font License, Version 1\.1/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(css, /html\[data-android-app="true"\]\[data-theme="dark"\]/);

  const fontFiles = [
    "plus-jakarta-sans-latin-500-normal.woff2",
    "plus-jakarta-sans-latin-600-normal.woff2",
    "plus-jakarta-sans-latin-700-normal.woff2",
    "plus-jakarta-sans-latin-ext-500-normal.woff2",
    "plus-jakarta-sans-latin-ext-600-normal.woff2",
    "plus-jakarta-sans-latin-ext-700-normal.woff2",
  ];
  let totalFontBytes = 0;
  for (const name of fontFiles) {
    const info = await stat(resolve(root, "public/assets/fonts", name));
    assert.ok(info.size > 5000, `${name} should be a valid WOFF2 font`);
    totalFontBytes += info.size;
  }
  assert.ok(totalFontBytes < 80 * 1024, `font subset must stay under 80 KB (got ${totalFontBytes} bytes)`);
});

test("Demo-mode isolation hooks in app.js never write demo data to user storage or backups", async () => {
  const appSource = await readFile(resolve(root, "public/app.js"), "utf8");
  const widgetsSource = await readFile(resolve(root, "public/today-widgets.js"), "utf8");

  // 1. Android first-run never auto-seeds demo into user STORAGE_KEY
  assert.match(appSource, /function maybeApplyDemoWorkspace\(\)[\s\S]{0,160}if \(isAndroidAppFace\(\)\) return;/);
  // 2. saveState writes only to in-memory androidDemoState while isolated demo is active
  assert.match(appSource, /function saveState\(options = \{\}\)[\s\S]{0,280}if \(androidDemoActive\) \{\s*androidDemoState = cloneData\(state\);\s*return;\s*\}/);
  // 3. createBackup swaps state to real user state when isolated demo is active so demo records never leak into backups
  assert.match(appSource, /function createBackup\(scope\)[\s\S]{0,420}androidDemoSavedUserState \|\| loadState\(\)/);
  // 4. Wall photo demo seeder never writes into user storage/IndexedDB on Android
  assert.match(widgetsSource, /document\.documentElement\.dataset\.androidApp === "true"/);
});
