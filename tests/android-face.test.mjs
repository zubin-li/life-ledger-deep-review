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
    assert.equal((androidDistHtml.match(/src="\.\/android-face\.js/g) || []).length, 1);
    assert.ok(androidDistHtml.indexOf('src="./android-face.js') < androidDistHtml.indexOf('src="./app.js'), "launch surface precedes the shared core");
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

test("Phase 4 weather curve helper preserves 00/06/12/18/24 ticks and dashed current-time line (l013)", async () => {
  const { win } = await loadFaceHelpers({ hostname: "example.com" });
  const { buildWeatherCurveModel } = win.LifeLedgerAndroidFaceHelpers;

  const hours = Array.from({ length: 25 }, (_, i) => ({
    time: `2026-11-25T${String(i).padStart(2, "0")}:00`,
    temperature: 4 + Math.round(Math.sin((i / 24) * Math.PI) * 7),
    probability: i === 14 ? 20 : 10,
    code: 2,
  }));
  const todayModel = buildWeatherCurveModel(hours, "2026-11-25T12:00", true);
  assert.deepEqual(
    Array.from(todayModel.ticks, tk => tk.label),
    ["00", "06", "12", "18", "24"],
  );
  assert.equal(todayModel.nowX, 108);
  assert.ok(todayModel.nowY >= 16 && todayModel.nowY <= 44);
  assert.equal(todayModel.maxPt.label, "11°");

  // Off-today omits dashed now line while keeping the full 5-tick curve
  const otherDayModel = buildWeatherCurveModel(hours, "2026-11-25T12:00", false);
  assert.equal(otherDayModel.nowX, null);
  assert.equal(otherDayModel.ticks.length, 5);

  // Flat temperature curve stays finite (no NaN division by zero)
  const flat = buildWeatherCurveModel(hours.map(h => ({ ...h, temperature: 8 })), "2026-11-25T06:00", true);
  assert.ok(Number.isFinite(flat.nowY));
  assert.doesNotMatch(flat.linePath, /NaN/);
});

test("Phase 5 keypad expression evaluation and locale decimal parsing match ledger-core.js exactly", async () => {
  const { win } = await loadFaceHelpers({ hostname: "example.com" });
  const { localeDecimalSeparator, evaluateKeypadExpression, resolvePredictiveBackAction } = win.LifeLedgerAndroidFaceHelpers;

  // Load real ledger-core.js to verify exact minor-unit parity
  const ledgerSource = await readFile(resolve(root, "public/ledger-core.js"), "utf8");
  const ledgerSandbox = { globalThis: {}, Intl, Date, Math, Number, String, Array, Object, Set, Map, RegExp, JSON };
  ledgerSandbox.globalThis = ledgerSandbox;
  vm.runInNewContext(ledgerSource, ledgerSandbox, { filename: "public/ledger-core.js" });
  const ledgerCore = ledgerSandbox.LifeLedgerLedger;
  assert.equal(typeof ledgerCore.parseMoneyInput, "function");

  // 1. Locale decimal separator: de -> ",", zh/en -> "."
  assert.equal(localeDecimalSeparator("de"), ",");
  assert.equal(localeDecimalSeparator("de-DE"), ",");
  assert.equal(localeDecimalSeparator("zh"), ".");
  assert.equal(localeDecimalSeparator("en"), ".");

  // 2. Single values with locale decimals equal ledger-core.parseMoneyInput
  for (const [expr, lang] of [
    ["12,50", "de"],
    ["4,80", "de"],
    ["12.50", "zh"],
    ["0.99", "en"],
    ["100", "de"],
  ]) {
    const res = evaluateKeypadExpression(expr, lang, ledgerCore.parseMoneyInput);
    assert.equal(res.ok, true, expr);
    assert.equal(res.amountMinor, ledgerCore.parseMoneyInput(expr), `minor mismatch for ${expr}`);
  }

  // 3. Inline + / - arithmetic matches exact minor-unit sum/diff in ledger-core
  const addDe = evaluateKeypadExpression("4,80 + 7,70", "de", ledgerCore.parseMoneyInput);
  assert.equal(addDe.ok, true);
  assert.equal(addDe.hasOperator, true);
  assert.equal(addDe.amountMinor, ledgerCore.parseMoneyInput("12,50"));
  assert.equal(addDe.formattedDisplay, "12,50");

  const subZh = evaluateKeypadExpression("20.00−4.80+1.30", "zh", ledgerCore.parseMoneyInput);
  assert.equal(subZh.ok, true);
  assert.equal(subZh.amountMinor, ledgerCore.parseMoneyInput("16.50"));
  assert.equal(subZh.formattedDisplay, "16.50");

  // 4. Zero / negative results are rejected cleanly
  assert.equal(evaluateKeypadExpression("5,00 - 5,00", "de", ledgerCore.parseMoneyInput).ok, false);
  assert.equal(evaluateKeypadExpression("2.00 - 9.50", "en", ledgerCore.parseMoneyInput).ok, false);
  assert.equal(evaluateKeypadExpression("", "zh", ledgerCore.parseMoneyInput).ok, false);

  // 5. Predictive back closes full-screen Focus overlay before dialogs/tabs
  assert.deepEqual(
    { ...resolvePredictiveBackAction({ sheetOpen: false, focusOpen: true, dialogOpen: true, activeView: "today" }) },
    { handled: true, action: "close-focus" },
  );
});

test("Phase 6 launch splash: frequency rules, 7 styles × 21 quotes, silent-mode audio guard, and .llmedia custom media round-trip", async () => {
  const { win } = await loadFaceHelpers({ hostname: "example.com" });
  const {
    SPLASH_WEEKDAY_STYLES,
    SPLASH_QUOTES,
    SPLASH_MEDIA_IMAGE_DATE,
    SPLASH_MEDIA_AUDIO_DATE,
    weekdayIndexFromIso,
    shouldShowSplashOnLaunch,
    resolveSplashStyleAndQuote,
    shouldPlaySplashAudio,
    buildSplashMediaBackupEntry,
    isSplashMediaBackupEntry,
    resolvePredictiveBackAction,
  } = win.LifeLedgerAndroidFaceHelpers;

  // 1. Splash frequency rule: default "daily" = first open per day; "off" never; "always" every open; blocked during onboarding
  assert.equal(shouldShowSplashOnLaunch({ frequency: "daily", lastShownDate: "", todayIso: "2026-11-25" }), true);
  assert.equal(shouldShowSplashOnLaunch({ frequency: "daily", lastShownDate: "2026-11-24", todayIso: "2026-11-25" }), true);
  assert.equal(shouldShowSplashOnLaunch({ frequency: "daily", lastShownDate: "2026-11-25", todayIso: "2026-11-25" }), false);
  assert.equal(shouldShowSplashOnLaunch({ frequency: "always", lastShownDate: "2026-11-25", todayIso: "2026-11-25" }), true);
  assert.equal(shouldShowSplashOnLaunch({ frequency: "off", lastShownDate: "", todayIso: "2026-11-25" }), false);
  assert.equal(shouldShowSplashOnLaunch({ frequency: "always", lastShownDate: "", todayIso: "2026-11-25", welcomeStep: 1 }), true);
  assert.equal(shouldShowSplashOnLaunch({ frequency: "daily", lastShownDate: "", todayIso: "2026-11-25", welcomeStep: 1 }), true);
  assert.equal(shouldShowSplashOnLaunch({ frequency: "off", todayIso: "2026-11-25", welcomeStep: 2 }), false);
  assert.equal(shouldShowSplashOnLaunch({ frequency: "daily", lastShownDate: "2026-11-25", todayIso: "2026-11-25", welcomeStep: 1 }), false);

  // 2. 7 weekday styles & all 21 quotes (zh/en/de, text + author/work) complete and accurate
  assert.equal(SPLASH_WEEKDAY_STYLES.length, 7);
  assert.equal(SPLASH_QUOTES.length, 7);
  let totalEntries = 0;
  for (let wd = 0; wd < 7; wd += 1) {
    assert.equal(SPLASH_WEEKDAY_STYLES[wd].index, wd);
    for (const lang of ["zh", "en", "de"]) {
      const q = SPLASH_QUOTES[wd][lang];
      assert.ok(q && q.text.trim().length > 4, `missing quote text wd=${wd} lang=${lang}`);
      assert.ok(q && q.source.trim().length > 2, `missing quote source wd=${wd} lang=${lang}`);
      totalEntries += 1;
    }
  }
  assert.equal(totalEntries, 21);

  // Spot-check SPEC Mon / Wed / Sat dates & style mapping
  assert.equal(weekdayIndexFromIso("2026-11-23"), 0); // Monday
  assert.equal(weekdayIndexFromIso("2026-11-25"), 2); // Wednesday
  assert.equal(weekdayIndexFromIso("2026-11-28"), 5); // Saturday
  const monZh = resolveSplashStyleAndQuote({ dateIso: "2026-11-23", lang: "zh" });
  assert.equal(monZh.style.id, "dawn");
  assert.equal(monZh.quote.text, "千里之行，始于足下。");
  const wedZh = resolveSplashStyleAndQuote({ dateIso: "2026-11-25", lang: "zh" });
  assert.equal(wedZh.style.id, "water");
  assert.equal(wedZh.quote.text, "知止而后有定，定而后能静。");
  const satDe = resolveSplashStyleAndQuote({ dateIso: "2026-11-28", lang: "de" });
  assert.equal(satDe.style.id, "moss");
  assert.match(satDe.quote.source, /Friedrich Schiller/);

  // Shared quoteSettings custom mode works without parallel store
  const customRes = resolveSplashStyleAndQuote({
    dateIso: "2026-11-25",
    lang: "zh",
    quoteSettings: { mode: "custom", items: [{ text: "慎终如始，则无败事。", source: "《道德经》" }] },
  });
  assert.equal(customRes.fromCustom, true);
  assert.equal(customRes.quote.text, "慎终如始，则无败事。");

  // 3. Music never plays when silent flag is set (and fails closed when undefined/off)
  assert.equal(shouldPlaySplashAudio({ musicEnabled: false, hasAudio: true, ringerSilent: false }), false);
  assert.equal(shouldPlaySplashAudio({ musicEnabled: true, hasAudio: true, ringerSilent: true }), false);
  assert.equal(shouldPlaySplashAudio({ musicEnabled: true, hasAudio: true, ringerSilent: undefined }), false);
  assert.equal(shouldPlaySplashAudio({ musicEnabled: true, hasAudio: true, ringerSilent: false, forceSilent: true }), false);
  assert.equal(shouldPlaySplashAudio({ musicEnabled: true, hasAudio: false, ringerSilent: false }), false);
  assert.equal(shouldPlaySplashAudio({ musicEnabled: true, hasAudio: true, ringerSilent: false }), true);

  // 4. Custom media (image + audio) round-trips byte-for-byte through existing media-backup.js v1 format
  const mediaCode = await readFile(resolve(root, "public/media-backup.js"), "utf8");
  const mediaRoot = {};
  vm.runInNewContext(mediaCode, {
    window: mediaRoot,
    TextEncoder,
    TextDecoder,
    Blob,
    Uint8Array,
    DataView,
    JSON,
    Error,
    Date,
    fetch: () => { throw new Error("unexpected fetch"); },
  });
  const mediaApi = mediaRoot.LifeLedgerMediaBackup;
  assert.equal(mediaApi.VERSION, 1);

  const imgBytes = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10, 42, 99]);
  const audBytes = new Uint8Array([73, 68, 51, 3, 0, 0, 0, 1, 2, 3, 4, 5]);
  const entries = [
    buildSplashMediaBackupEntry({ id: "splash-img-1", kind: "image", contentType: "image/png", width: 412, height: 915, createdAt: 1764000000000 }, "blob:img-1"),
    buildSplashMediaBackupEntry({ id: "splash-aud-1", kind: "audio", contentType: "audio/mpeg", createdAt: 1764000001000 }, "blob:aud-1"),
  ];
  const backup = { format: "life-ledger-backup", schemaVersion: 3, scope: "all", data: { habits: [], logs: {} } };
  const fetcher = async url => {
    if (url === "blob:img-1") return new Response(new Blob([imgBytes], { type: "image/png" }));
    if (url === "blob:aud-1") return new Response(new Blob([audBytes], { type: "audio/mpeg" }));
    throw new Error(`unexpected ${url}`);
  };
  const bundle = await mediaApi.createBundle(backup, entries, fetcher);
  assert.equal(await mediaApi.isBundle(bundle), true);
  const parsed = await mediaApi.parseBundle(bundle);
  assert.equal(parsed.entries.length, 2);
  assert.equal(parsed.entries[0].photo.date, SPLASH_MEDIA_IMAGE_DATE);
  assert.equal(parsed.entries[1].photo.date, SPLASH_MEDIA_AUDIO_DATE);
  assert.equal(isSplashMediaBackupEntry(parsed.entries[0].photo), true);
  assert.equal(isSplashMediaBackupEntry(parsed.entries[1].photo), true);
  assert.deepEqual(new Uint8Array(await parsed.entries[0].blob.arrayBuffer()), imgBytes);
  assert.deepEqual(new Uint8Array(await parsed.entries[1].blob.arrayBuffer()), audBytes);

  // 5. Predictive back closes Splash and Splash Settings before lower layers
  assert.deepEqual(
    { ...resolvePredictiveBackAction({ splashOpen: true, sheetOpen: true, activeView: "today" }) },
    { handled: true, action: "close-splash" },
  );
  assert.deepEqual(
    { ...resolvePredictiveBackAction({ splashOpen: false, sheetOpen: false, splashSettingsOpen: true, settingsOpen: true, activeView: "today" }) },
    { handled: true, action: "close-splash-settings" },
  );
});


test("Android phone language uses BCP-47 prefixes until an explicit choice, including after restore", async () => {
  const dist = await mkdtemp(join(tmpdir(), "ll-android-language-"));
  try {
    await prepare(dist);
    const source = await readFile(join(dist, "app.js"), "utf8");
    const { win } = await loadFaceHelpers();
    const { resolveAndroidLanguage } = win.LifeLedgerAndroidFaceHelpers;
    const helper = source.match(/function androidLanguage\(stored, explicit\) \{[\s\S]*?\n\}/)?.[0];
    assert.ok(helper);
    for (const [languages, stored, explicit, expected] of [
      [["zh-CN", "en-US"], null, null, "zh"],
      [["de-DE", "en-US"], null, null, "de"],
      [["fr-FR", "DE-at", "zh-Hant-TW"], null, null, "de"],
      [["en-US", "zh-Hant"], null, null, "zh"],
      [["fr-FR", "en-US"], null, null, "en"],
      [["den", "zho"], null, null, "en"],
      [["zh-CN"], "en", "true", "en"],
      [["de-DE"], "en", null, "en"],
      [["de-DE"], "en", "false", "de"],
      [["zh-CN"], "invalid", "true", "zh"],
    ]) {
      const actual = vm.runInNewContext(`${helper}; androidLanguage(stored, explicit)`, {
        supportedLanguages: ["en", "de", "zh"], requestedLanguage: null,
        navigator: { languages }, stored, explicit,
        window: { LifeLedgerAndroidFaceHelpers: { resolveAndroidLanguage } },
      });
      assert.equal(actual, expected, JSON.stringify({ languages, stored, explicit }));
    }
    assert.match(source, /let currentLang = androidLanguage\(storedLanguage, explicitLanguagePreference\)/);
    assert.match(source, /function syncBackupPreferencesToRuntime\(\) \{[\s\S]*?currentLang = androidLanguage\(storedLang, explicitLang\)/);
  } finally {
    await rm(dist, { recursive: true, force: true });
  }
});


test("Android semantic text colors meet AA on light and dark surfaces", async () => {
  const css = await readFile(resolve(root, "public/android-face.css"), "utf8");
  const tokens = selector => {
    const start = css.indexOf(`${selector} {`);
    assert.notEqual(start, -1);
    const block = css.slice(start, css.indexOf("}", start));
    return Object.fromEntries([...block.matchAll(/--a-([\w-]+):\s*(#[A-Fa-f0-9]{6})/g)].map(match => [match[1], match[2]]));
  };
  const luminance = hex => [1, 3, 5].map(i => Number.parseInt(hex.slice(i, i + 2), 16) / 255)
    .map(value => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4)
    .reduce((sum, value, i) => sum + value * [0.2126, 0.7152, 0.0722][i], 0);
  const base = tokens('html[data-android-app="true"]');
  for (const selector of ['html[data-android-app="true"]:not([data-theme="dark"])', 'html[data-android-app="true"][data-theme="dark"]']) {
    const palette = { ...base, ...tokens(selector) };
    for (const [foreground, background] of [
      ["on-surface", "surface"], ["on-surface-variant", "surface-container-high"],
      ["primary", "primary-soft"], ["good-fg", "good-soft"], ["calm-fg", "calm-soft"],
      ["low-fg", "low-soft"], ["habit", "habit-soft"], ["focus", "focus-soft"],
      ["photo", "photo-soft"], ["expense", "expense-soft"], ["sky", "sky-soft"], ["income", "surface-card"],
    ]) {
      const values = [luminance(palette[foreground]), luminance(palette[background])].sort((a, b) => a - b);
      const ratio = (values[1] + 0.05) / (values[0] + 0.05);
      assert.ok(ratio >= 4.5, `${selector}: ${foreground} on ${background} = ${ratio}`);
    }
  }
});
