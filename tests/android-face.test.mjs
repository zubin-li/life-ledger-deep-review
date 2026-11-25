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

test("Phase 3 Today helpers: completed habits sort to end, back-to-today only off-today, future date read-only, card library default (l03/l029)", async () => {
  const { win } = await loadFaceHelpers({ hostname: "example.com" });
  const {
    sortAndroidHabits,
    shouldShowBackToToday,
    isAndroidDateReadOnly,
    buildWeekDays,
    resolveAndroidTodayCards,
  } = win.LifeLedgerAndroidFaceHelpers;

  // 1. Completed habits move to the end while incomplete habits stay first in order (l03)
  const habits = [
    { id: "exercise", name: "运动" },
    { id: "reading", name: "阅读" },
    { id: "sleep2330", name: "23:30睡" },
    { id: "hydration", name: "饮水" },
  ];
  const sorted = sortAndroidHabits(habits, ["hydration", "exercise"]);
  assert.deepEqual(
    Array.from(sorted, h => h.id),
    ["reading", "sleep2330", "hydration", "exercise"],
  );

  // 2. Back-to-today capsule visible ONLY when selectedDate !== todayIso
  assert.equal(shouldShowBackToToday("2026-11-25", "2026-11-25"), false);
  assert.equal(shouldShowBackToToday("2026-11-24", "2026-11-25"), true);
  assert.equal(shouldShowBackToToday("2026-11-26", "2026-11-25"), true);

  // 3. Future date is strictly read-only; today and past dates remain editable
  assert.equal(isAndroidDateReadOnly("2026-11-26", "2026-11-25"), true);
  assert.equal(isAndroidDateReadOnly("2026-11-25", "2026-11-25"), false);
  assert.equal(isAndroidDateReadOnly("2026-11-24", "2026-11-25"), false);

  // 4. 7-day strip always builds Mon..Sun with future flags set accurately
  const week = buildWeekDays("2026-11-25", "2026-11-25");
  assert.equal(week.length, 7);
  assert.equal(week[0].iso, "2026-11-23");
  assert.equal(week[2].iso, "2026-11-25");
  assert.equal(week[2].isSelected, true);
  assert.equal(week[2].isFuture, false);
  assert.equal(week[3].iso, "2026-11-26");
  assert.equal(week[3].isFuture, true);
  assert.equal(week[6].iso, "2026-11-29");
  assert.equal(week[6].isFuture, true);

  // 5. Optional cards (rhythm) are excluded from default Today and only added from Card Library (l029)
  const defaultCards = resolveAndroidTodayCards(null);
  assert.equal(defaultCards.includes("rhythm"), false);
  const withRhythm = resolveAndroidTodayCards([...defaultCards, "rhythm", "unknown-card"]);
  assert.equal(withRhythm.includes("rhythm"), true);
  assert.equal(withRhythm.includes("unknown-card"), false);

  // 6. Shared core write hooks guard against future-date mutations
  const appSource = await readFile(resolve(root, "public/app.js"), "utf8");
  assert.match(appSource, /toggleHabitImmediate:\s*\(date, id\)\s*=>\s*\{\s*if \(String\(date \|\| ""\) > effectiveDemoTodayIso\(\)\) return null;/);
  assert.match(appSource, /setDayNote:\s*\(date, note\)\s*=>\s*\{\s*if \(String\(date \|\| ""\) > effectiveDemoTodayIso\(\)\) return false;/);
});
