import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const app = readFileSync(new URL("../public/app.js", import.meta.url), "utf8");
const cardsSource = readFileSync(new URL("../public/today-cards.js", import.meta.url), "utf8");
const widgetsSource = readFileSync(new URL("../public/today-widgets.js", import.meta.url), "utf8");
const indexHtml = readFileSync(new URL("../public/index.html", import.meta.url), "utf8");
const mediaSource = readFileSync(new URL("../public/media-backup.js", import.meta.url), "utf8");

const START = "/* life-ledger-backup-preferences-start */";
const END = "/* life-ledger-backup-preferences-end */";

function extractFunctionSource(source, signature) {
  const start = source.indexOf(signature);
  assert.ok(start >= 0, `missing ${signature} in app.js`);
  const bodyStart = source.indexOf("{", start);
  let depth = 0;
  for (let i = bodyStart; i < source.length; i++) {
    if (source[i] === "{") depth++;
    else if (source[i] === "}") {
      depth--;
      if (depth === 0) return source.slice(start, i + 1);
    }
  }
  throw new Error(`unterminated function: ${signature}`);
}
function constLine(pattern) {
  const match = app.match(pattern);
  assert.ok(match, `missing ${pattern} in app.js`);
  return match[0];
}
// Values created inside the vm have another realm's prototypes; compare plain JSON copies instead.
const plain = value => JSON.parse(JSON.stringify(value));

const blockStart = app.indexOf(START);
const blockEnd = app.indexOf(END);
assert.ok(blockStart >= 0 && blockEnd > blockStart, "backup preferences block must exist in app.js");
const block = app.slice(blockStart + START.length, blockEnd);

function loadApp() {
  const context = { window: { LifeLedgerStorageSuffix: "" }, localStorage: null };
  vm.createContext(context);
  vm.runInContext([
    constLine(/^const BACKUP_FORMAT = .*;$/m),
    constLine(/^const BACKUP_SCHEMA_VERSION = \d+;$/m),
    constLine(/^const NAV_PAGES = \[[^\]]*\];$/m),
    extractFunctionSource(app, "function validAvatar(value)"),
    extractFunctionSource(app, "function profileFrame(f)"),
    extractFunctionSource(app, "function isRecord(value)"),
    block,
    extractFunctionSource(app, "function createBackup(scope)"),
    extractFunctionSource(app, "function importedPayload(raw)"),
    "const seed = { focusSettings: {} };",
    "const cloneData = value => JSON.parse(JSON.stringify(value));",
    "function exportRange(scope) { return scope === \"all\" ? { scope, start: \"\", end: \"\" } : { scope, start: \"2026-10-01\", end: \"2026-10-31\" }; }",
    "function scopedState() { return { habits: [], logs: {} }; }",
  ].join("\n"), context);
  context.fields = vm.runInContext("BACKUP_PREFERENCE_FIELDS", context);
  context.schemaVersion = vm.runInContext("BACKUP_SCHEMA_VERSION", context);
  return context;
}
const api = loadApp();

// A storage that can only be read key by key: any attempt to enumerate it throws.
function makeStorage(entries) {
  const reads = [];
  return {
    reads,
    getItem(key) { reads.push(key); return Object.hasOwn(entries, key) ? entries[key] : null; },
    key() { throw new Error("storage enumeration is forbidden"); },
    get length() { throw new Error("storage enumeration is forbidden"); },
  };
}
function backupWith(entries, scope = "all") {
  const storage = makeStorage(entries);
  api.localStorage = storage;
  return { storage, backup: plain(api.createBackup(scope)) };
}

const AVATAR = "data:image/png;base64,iVBORw0KGgo=";
const SAFE_KEYS = [
  "life-ledger-language", "life-ledger-language-preference-set", "life-ledger-theme", "life-ledger-font",
  "life-ledger-sidebar-collapsed", "life-ledger-calendar-view", "life-ledger-reminder", "life-ledger-device-profile",
  "life-ledger-nav-order", "life-ledger-web-today-cards-v4", "life-ledger-weather-city", "life-ledger-heatmap-palette",
  "life-ledger-freq-habit", "life-ledger-week-collapsed", "life-ledger-wall-prefs", "life-ledger-wall-prefs-2", "life-ledger-wall-prefs-3",
];
const STORED = {
  "life-ledger-language": "de",
  "life-ledger-language-preference-set": "true",
  "life-ledger-theme": "dark",
  "life-ledger-font": "serif",
  "life-ledger-sidebar-collapsed": "true",
  "life-ledger-calendar-view": "heatmap",
  "life-ledger-reminder": JSON.stringify({ enabled: true, time: "08:30", lastSent: "2026-10-28" }),
  "life-ledger-device-profile": JSON.stringify({ name: "  Ada  ", avatar: AVATAR, frame: { x: 20, y: 30, zoom: 2 } }),
  "life-ledger-nav-order": JSON.stringify(["review", "today", "bogus", "review"]),
  "life-ledger-web-today-cards-v4": JSON.stringify([
    { id: "weather", size: "M", hidden: false }, { id: "habits", size: "Q", hidden: true },
    { id: "evil", size: "L" }, { id: "weather", size: "S" },
  ]),
  "life-ledger-weather-city": JSON.stringify({ name: "Berlin", latitude: 52.52, longitude: 13.405, cache: "x" }),
  "life-ledger-heatmap-palette": "\"blue\"",
  "life-ledger-freq-habit": "\"ledger-abc-123\"",
  "life-ledger-week-collapsed": JSON.stringify(["goals", "goals", "nope"]),
  "life-ledger-wall-prefs": JSON.stringify({ auto: false, fit: "contain", x: 1 }),
  "life-ledger-wall-prefs-2": JSON.stringify({ fit: "cover" }),
  "life-ledger-wall-prefs-3": JSON.stringify({ auto: true }),
};
const EXPECTED_VALUES = {
  language: "de",
  languageExplicit: true,
  theme: "dark",
  font: "serif",
  sidebarCollapsed: true,
  calendarView: "heatmap",
  reminder: { enabled: true, time: "08:30" },
  deviceProfile: { name: "Ada", avatar: AVATAR, frame: { x: 20, y: 30, zoom: 2 } },
  navOrder: ["review", "today", "week", "longrange", "timeline", "ledger"],
  todayCards: [{ id: "weather", size: "M", hidden: false }, { id: "habits", size: "L", hidden: true }],
  weatherCity: { name: "Berlin", latitude: 52.52, longitude: 13.405 },
  heatmapPalette: "blue",
  frequencyHabit: "ledger-abc-123",
  weekCollapsed: ["goals"],
  wallPrefs1: { auto: false, fit: "contain" },
  wallPrefs2: { fit: "cover" },
  wallPrefs3: { auto: true },
};
const FORBIDDEN = {
  "life-ledger-cloud-url": "SECRET-cloud-url",
  "life-ledger-cloud-token": "SECRET-token",
  "life-ledger-auth-session": "SECRET-session",
  "life-ledger-oauth-state": "SECRET-oauth",
  "life-ledger-google-calendar-credentials": "SECRET-google",
  "life-ledger-cloudbase-config": "SECRET-cloudbase",
  "life-ledger-cloudflare-config": "SECRET-cloudflare",
  "life-ledger-notification-permission": "SECRET-permission",
  "life-ledger-weather-cache": "SECRET-weather-cache",
  "life-ledger-weather-cache-preview-x": "SECRET-weather-cache",
  "life-ledger-focus-active": "SECRET-focus",
  "life-ledger-restore-safety-v1": "SECRET-restore-safety",
  "life-ledger-demo-dismissed-v1": "SECRET-demo",
  "life-ledger-local-edition": "SECRET-migration",
  "life-ledger-earlier-records": "SECRET-earlier-backup",
  "life-ledger-v1": "SECRET-records",
};

test("schema version is 3 and the codec exposes exactly the approved settings", () => {
  assert.equal(api.schemaVersion, 3);
  assert.deepEqual(plain(api.fields.map(field => field.key)), SAFE_KEYS);
  assert.deepEqual(plain(api.fields.map(field => field.name)), [
    "language", "languageExplicit", "theme", "font", "sidebarCollapsed", "calendarView", "reminder", "deviceProfile",
    "navOrder", "todayCards", "weatherCity", "heatmapPalette", "frequencyHabit", "weekCollapsed", "wallPrefs1", "wallPrefs2", "wallPrefs3",
  ]);
  assert.doesNotMatch(block, /Object\.(?:keys|entries)\(localStorage\)|localStorage\.key\(|localStorage\.length/, "no generic key iteration");
});

test("field keys and the card/nav/week allow-lists stay in step with the app", () => {
  assert.match(app, /const LANGUAGE_KEY = "life-ledger-language";/);
  assert.match(app, /const LANGUAGE_PREFERENCE_KEY = "life-ledger-language-preference-set";/);
  assert.match(app, /const THEME_KEY = "life-ledger-theme";/);
  assert.match(app, /const SIDEBAR_KEY = "life-ledger-sidebar-collapsed";/);
  assert.match(app, /const CALENDAR_VIEW_KEY = "life-ledger-calendar-view";/);
  assert.match(app, /const REMINDER_KEY = "life-ledger-reminder";/);
  assert.match(app, /var PROFILE_KEY = "life-ledger-device-profile"/);
  assert.match(app, /const NAV_ORDER_KEY = "life-ledger-nav-order";/);
  assert.match(app, /const weekCollapseKey = "life-ledger-week-collapsed";/);
  assert.match(cardsSource, /const KEY = "life-ledger-web-today-cards-v4" \+ NS/);
  for (const key of ["life-ledger-weather-city", "life-ledger-heatmap-palette", "life-ledger-freq-habit", "life-ledger-wall-prefs"]) {
    assert.ok(widgetsSource.includes(`"${key}"`), key);
  }
  for (const module of ["review", "goals", "completed", "insights"]) assert.ok(indexHtml.includes(`data-module="${module}"`), module);

  const sizes = vm.runInContext("BACKUP_PREF_CARD_SIZES", api);
  const parse = list => list.split(",").map(item => item.replace(/["'\s]/g, ""));
  for (const id of ["habits", "calendar", "dayplan", "tools"]) {
    const match = cardsSource.match(new RegExp(`id: "${id}",[^\\n]*?sizes: \\[([^\\]]*)\\]`));
    assert.ok(match, `today-cards.js card ${id}`);
    assert.deepEqual(plain(sizes[id]), parse(match[1]), id);
  }
  for (const id of ["weather", "freq", "rhythm", "heatmap", "photos", "focus", "spending"]) {
    const match = widgetsSource.match(new RegExp(`id: "${id}",[^\\n]*?sizes: \\[([^\\]]*)\\]`));
    assert.ok(match, `today-widgets.js card ${id}`);
    assert.deepEqual(plain(sizes[id]), parse(match[1]), id);
  }
  const wallMatch = widgetsSource.match(/Object\.entries\(walls\)\.map\([^\n]*?sizes: \[([^\]]*)\]/);
  assert.ok(wallMatch, "today-widgets.js wall cards");
  for (const id of ["wall", "wall2", "wall3"]) assert.deepEqual(plain(sizes[id]), parse(wallMatch[1]), id);
  assert.deepEqual(plain(Object.keys(sizes)).sort(), ["calendar", "dayplan", "focus", "freq", "habits", "heatmap", "photos", "rhythm", "spending", "tools", "wall", "wall2", "wall3", "weather"]);
});

test("full v3 backup encodes safe preferences and decodes them back on import", () => {
  const { backup } = backupWith({ ...STORED, ...FORBIDDEN });
  assert.equal(backup.schemaVersion, 3);
  assert.equal(backup.scope, "all");
  assert.deepEqual(backup.preferences, { version: 1, values: EXPECTED_VALUES });
  assert.equal("preferences" in backup.data, false, "preferences live beside data, never inside it");

  const imported = api.importedPayload(JSON.parse(JSON.stringify(backup)));
  assert.equal(imported.modern, true);
  assert.equal(imported.scope, "all");
  assert.deepEqual(plain(imported.preferences), { version: 1, values: EXPECTED_VALUES });
  assert.equal("preferences" in imported.data, false);
});

test("a full backup with nothing stored carries an empty envelope and imports that valid empty envelope", () => {
  const { backup } = backupWith({});
  assert.deepEqual(backup.preferences, { version: 1, values: {} });
  assert.deepEqual(plain(api.importedPayload(backup).preferences), { version: 1, values: {} });
});

test("preview workspaces read their own suffixed widget keys, never the shared ones", () => {
  const storage = makeStorage({
    "life-ledger-weather-city": JSON.stringify({ name: "Real", latitude: 1, longitude: 2 }),
    "life-ledger-weather-city-preview-demo": JSON.stringify({ name: "Preview", latitude: 3, longitude: 4 }),
    "life-ledger-theme": "light",
  });
  const encoded = plain(vm.runInContext("encodeBackupPreferences", api)(storage, { suffix: "-preview-demo" }));
  assert.deepEqual(encoded.values.weatherCity, { name: "Preview", latitude: 3, longitude: 4 });
  assert.equal(encoded.values.theme, "light", "per-device settings are not suffixed");
  assert.equal(storage.reads.includes("life-ledger-weather-city"), false);
});

test("partial month, week and day backups omit preferences and never read storage for them", () => {
  for (const scope of ["month", "week", "day"]) {
    const { storage, backup } = backupWith({ ...STORED, ...FORBIDDEN }, scope);
    assert.equal(backup.schemaVersion, 3);
    assert.equal(backup.scope, scope);
    assert.equal(Object.hasOwn(backup, "preferences"), false, scope);
    assert.deepEqual(storage.reads, [], scope);
    assert.equal(JSON.stringify(backup).includes("SECRET"), false, scope);
    const imported = api.importedPayload(backup);
    assert.equal(imported.scope, scope);
    assert.equal(imported.preferences, null, scope);
  }
});

test("v1, v2 and legacy inputs stay importable and yield no preferences", () => {
  const forged = { version: 1, values: { theme: "dark" } };
  const data = { habits: [{ id: "h1", versions: [] }], logs: { "2026-10-01": { h1: true } } };
  for (const schemaVersion of [1, 2]) {
    const imported = api.importedPayload({ format: "life-ledger-backup", schemaVersion, scope: "all", exportedAt: "2026-10-01T00:00:00Z", data, preferences: forged });
    assert.equal(imported.modern, true, `v${schemaVersion}`);
    assert.equal(imported.scope, "all");
    assert.equal(imported.preferences, null, `v${schemaVersion} must ignore a preferences envelope`);
    assert.equal(imported.data.habits[0].id, "h1");
    assert.equal(imported.data.logs["2026-10-01"].h1, true);
  }
  const legacy = api.importedPayload({ ...data, preferences: forged });
  assert.equal(legacy.modern, false);
  assert.equal(legacy.preferences, null);
  assert.equal(legacy.data.habits[0].id, "h1");
  const unversioned = api.importedPayload({ format: "life-ledger-backup", scope: "all", data, preferences: forged });
  assert.equal(unversioned.preferences, null);
});

test("v3 preferences are only honoured on a full backup; partial scopes and unknown scopes are ignored", () => {
  const data = { habits: [], logs: {} };
  const preferences = { version: 1, values: { theme: "dark" } };
  const full = api.importedPayload({ format: "life-ledger-backup", schemaVersion: 3, scope: "all", data, preferences });
  assert.deepEqual(plain(full.preferences), { version: 1, values: { theme: "dark" } });
  for (const scope of ["month", "week", "day", "weird", undefined]) {
    const imported = api.importedPayload({ format: "life-ledger-backup", schemaVersion: 3, scope, data, preferences });
    assert.equal(imported.preferences, null, String(scope));
  }
  assert.equal(api.importedPayload({ format: "life-ledger-backup", schemaVersion: 3, scope: "all", data }).preferences, null, "v3 without an envelope");
});

test("backup versions above 3 are rejected", () => {
  const data = { habits: [], logs: {} };
  assert.throws(() => api.importedPayload({ format: "life-ledger-backup", schemaVersion: 4, scope: "all", data }), /unsupported-backup-version/);
  assert.throws(() => api.importedPayload({ format: "life-ledger-backup", schemaVersion: "99", scope: "all", data }), /unsupported-backup-version/);
});

test("malicious or invalid preference values are ignored field by field", () => {
  const allInvalid = JSON.parse(`{"format":"life-ledger-backup","schemaVersion":3,"scope":"all","exportedAt":"2026-10-29T00:00:00Z",
    "data":{"habits":[],"logs":{}},
    "preferences":{"version":1,"values":{
      "language":"fr","languageExplicit":"true","theme":"<img onerror=x>","font":{"a":1},"sidebarCollapsed":"true","calendarView":["heatmap"],
      "reminder":{"enabled":true,"time":"25:99"},
      "deviceProfile":{"name":"","avatar":"javascript:alert(1)"},
      "navOrder":"today",
      "todayCards":[{"id":"__proto__","size":"L"},{"id":"constructor","size":"L"},{"id":"toString"},null,7],
      "weatherCity":{"name":"Nowhere","latitude":91,"longitude":0},
      "heatmapPalette":"neon","frequencyHabit":"../../etc/passwd","weekCollapsed":{"0":"goals"},
      "wallPrefs1":{"auto":"yes","fit":"stretch"},"wallPrefs2":[],"wallPrefs3":null,
      "cloudUrl":"https://evil.example","authToken":"x","__proto__":{"polluted":true},"constructor":{"prototype":{"polluted":true}}
    }}}`);
  assert.equal(api.importedPayload(allInvalid).preferences, null);

  const mixed = JSON.parse(`{"format":"life-ledger-backup","schemaVersion":3,"scope":"all","exportedAt":"2026-10-29T00:00:00Z",
    "data":{"habits":[],"logs":{}},
    "preferences":{"version":1,"values":{
      "theme":"light","language":"zh","font":"comic-sans","languageExplicit":1,
      "reminder":{"enabled":"yes","time":"08:00"},
      "deviceProfile":{"name":"\\u0007${"A".repeat(100)}","avatar":"data:image/svg+xml;base64,PHN2Zz4=","frame":{"x":500,"y":-5,"zoom":"9"}},
      "weatherCity":{"name":"Bad","latitude":"52","longitude":13},
      "weekCollapsed":["review","script","review"],
      "wallPrefs1":{"auto":true,"fit":"contain","onload":"evil()"},
      "cloudUrl":"https://evil.example","__proto__":{"polluted":true},"constructor":{"prototype":{"polluted":true}}
    }}}`);
  const { preferences } = api.importedPayload(mixed);
  assert.deepEqual(plain(preferences), {
    version: 1,
    values: {
      language: "zh",
      theme: "light",
      deviceProfile: { name: "A".repeat(60), avatar: "", frame: { x: 100, y: 0, zoom: 3 } },
      weekCollapsed: ["review"],
      wallPrefs1: { auto: true, fit: "contain" },
    },
  });
  assert.equal(JSON.stringify(preferences).includes("evil"), false);
  assert.equal(({}).polluted, undefined);
  assert.equal(vm.runInContext("({}).polluted", api), undefined);

  for (const bad of [
    { version: 2, values: { theme: "dark" } }, { version: 1, values: [] }, { version: 1, values: "theme" },
    { version: 1 }, "theme", [], null, 42,
  ]) {
    const imported = api.importedPayload({ format: "life-ledger-backup", schemaVersion: 3, scope: "all", data: { habits: [], logs: {} }, preferences: bad });
    assert.equal(imported.preferences, null, JSON.stringify(bad));
  }
});

test("invalid stored values never reach the exported envelope", () => {
  const { backup } = backupWith({
    "life-ledger-theme": "neon",
    "life-ledger-language": "fr",
    "life-ledger-sidebar-collapsed": "maybe",
    "life-ledger-reminder": "{not json",
    "life-ledger-web-today-cards-v4": "{}",
    "life-ledger-weather-city": JSON.stringify({ name: "X", latitude: 0, longitude: 999 }),
    "life-ledger-freq-habit": "\"has space\"",
    "life-ledger-font": "rounded",
  });
  assert.deepEqual(backup.preferences, { version: 1, values: { font: "rounded" } });
});

test("forbidden keys are never read and never appear in a backup", () => {
  const { storage, backup } = backupWith({ ...STORED, ...FORBIDDEN });
  const serialised = JSON.stringify(backup);
  assert.equal(serialised.includes("SECRET"), false);
  for (const key of Object.keys(FORBIDDEN)) {
    assert.equal(storage.reads.includes(key), false, `${key} must not be read`);
    assert.equal(serialised.includes(key), false, `${key} must not be exported`);
  }
  assert.deepEqual([...storage.reads].sort(), [...SAFE_KEYS].sort(), "only the approved keys are read");
  // Even a forged envelope naming forbidden settings cannot smuggle them through decoding.
  const decoded = plain(vm.runInContext("decodeBackupPreferences", api)({
    version: 1,
    values: { ...EXPECTED_VALUES, cloudUrl: "x", authToken: "x", googleCalendar: "x", notificationPermission: "granted", weatherCache: {}, focusActive: {}, restoreSafety: {} },
  }));
  assert.deepEqual(decoded, { version: 1, values: EXPECTED_VALUES });
});

test(".llmedia bundles accept embedded backup schema 2 or 3, keep photo metadata, and import without preferences", async () => {
  const root = {};
  vm.runInNewContext(mediaSource, {
    window: root, TextEncoder, TextDecoder, Blob, Uint8Array, DataView, JSON, Error, Date,
    fetch: () => { throw new Error("unexpected fetch"); },
  });
  const media = root.LifeLedgerMediaBackup;
  const bytes = { a: new Uint8Array([82, 73, 70, 70, 1, 2, 3]), b: new Uint8Array([255, 216, 255, 9, 8]) };
  const photos = [
    { id: "p1", backupId: "backup-1", date: "2026-10-12", contentType: "image/webp", width: 800, height: 600, createdAt: 1760000000000 },
    { id: "p2", date: "2026-10-13", contentType: "image/jpeg", width: 0, height: 0 },
  ].map((photo, index) => ({ ...photo, url: `/photo/${photo.id}`, bytes: [bytes.a, bytes.b][index] }));
  const fetcher = async url => {
    const photo = photos.find(item => item.url === url);
    return new Response(new Blob([photo.bytes], { type: photo.contentType }));
  };
  for (const schemaVersion of [2, 3]) {
    const backup = { format: "life-ledger-backup", schemaVersion, scope: "month", data: { habits: [], logs: {} } };
    const bundle = await media.createBundle(backup, photos, fetcher);
    const parsed = await media.parseBundle(bundle);
    assert.equal(parsed.manifest.backup.schemaVersion, schemaVersion);
    assert.deepEqual(plain(parsed.entries.map(entry => entry.photo)), [
      { id: "p1", backupId: "backup-1", date: "2026-10-12", contentType: "image/webp", size: bytes.a.length, width: 800, height: 600, createdAt: 1760000000000 },
      { id: "p2", backupId: "p2", date: "2026-10-13", contentType: "image/jpeg", size: bytes.b.length, width: 0, height: 0, createdAt: 0 },
    ]);
    assert.deepEqual(new Uint8Array(await parsed.entries[0].blob.arrayBuffer()), bytes.a);
    assert.deepEqual(new Uint8Array(await parsed.entries[1].blob.arrayBuffer()), bytes.b);
    const imported = api.importedPayload(parsed.manifest.backup);
    assert.equal(imported.scope, "month");
    assert.equal(imported.preferences, null);
  }
});

// ---------------------------------------------------------------------------------------------
// Batch 3B: replacement semantics, importedPayload data filtering and restore/undo behaviour.
// ---------------------------------------------------------------------------------------------

// A read/write/remove storage backed by a Map. Enumeration is forbidden, like the read-only mock above.
function makeWritableStorage(initial = {}) {
  const data = new Map(Object.entries(initial));
  return {
    getItem(key) { return data.has(key) ? data.get(key) : null; },
    setItem(key, value) { data.set(key, String(value)); },
    removeItem(key) { data.delete(key); },
    snapshot() { return Object.fromEntries(data); },
    key() { throw new Error("storage enumeration is forbidden"); },
    get length() { throw new Error("storage enumeration is forbidden"); },
  };
}
const SAFETY_KEY = "life-ledger-restore-safety-v1";
function withoutSafety(snapshot) {
  const copy = { ...snapshot };
  delete copy[SAFETY_KEY];
  return copy;
}
const applyBackupPreferences = vm.runInContext("applyBackupPreferences", api);

test("applyBackupPreferences writes present values, removes omitted allowlisted keys and leaves other keys alone", () => {
  const storage = makeWritableStorage({ ...STORED, ...FORBIDDEN, "unrelated-key": "keep" });
  const result = applyBackupPreferences(storage, { version: 1, values: { theme: "light" } });
  assert.equal(result, true);
  assert.deepEqual(storage.snapshot(), { ...FORBIDDEN, "unrelated-key": "keep", "life-ledger-theme": "light" });
  for (const key of SAFE_KEYS.filter(item => item !== "life-ledger-theme")) {
    assert.equal(storage.getItem(key), null, `${key} is omitted from the envelope, so it is cleared`);
  }
});

test("applyBackupPreferences writes every approved field of a full envelope in its stored format", () => {
  const storage = makeWritableStorage({ ...FORBIDDEN });
  assert.equal(applyBackupPreferences(storage, { version: 1, values: EXPECTED_VALUES }, { permission: "granted" }), true);
  const stored = storage.snapshot();
  for (const key of Object.keys(FORBIDDEN)) assert.equal(stored[key], FORBIDDEN[key], `${key} untouched`);
  assert.equal(stored["life-ledger-theme"], "dark");
  assert.equal(stored["life-ledger-language-preference-set"], "true");
  assert.deepEqual(JSON.parse(stored["life-ledger-reminder"]), { enabled: true, time: "08:30" });
  assert.deepEqual(JSON.parse(stored["life-ledger-weather-city"]), EXPECTED_VALUES.weatherCity);
  assert.deepEqual(Object.keys(stored).filter(key => !(key in FORBIDDEN)).sort(), [...SAFE_KEYS].sort());
});

test("applyBackupPreferences with a valid empty envelope clears every allowlisted key and nothing else", () => {
  const storage = makeWritableStorage({ ...STORED, ...FORBIDDEN });
  assert.equal(applyBackupPreferences(storage, { version: 1, values: {} }), true);
  assert.deepEqual(storage.snapshot(), { ...FORBIDDEN });
});

test("applyBackupPreferences returns false and preserves storage for an invalid or absent envelope", () => {
  const initial = { ...STORED, ...FORBIDDEN };
  for (const bad of [
    undefined, null, "theme", 42, [], {},
    { version: 2, values: { theme: "dark" } }, { version: 1 }, { version: 1, values: [] }, { version: 1, values: "theme" },
    { version: 1, values: { theme: "neon", font: "comic-sans" } },
    { version: 1, values: { cloudUrl: "https://evil.example" } },
  ]) {
    const storage = makeWritableStorage(initial);
    assert.equal(applyBackupPreferences(storage, bad), false, JSON.stringify(bad));
    assert.deepEqual(storage.snapshot(), initial, `storage preserved for ${JSON.stringify(bad)}`);
  }
  assert.equal(applyBackupPreferences(null, { version: 1, values: { theme: "dark" } }), false);
  assert.equal(applyBackupPreferences({ getItem() { return null; } }, { version: 1, values: { theme: "dark" } }), false);
});

test("applyBackupPreferences clamps reminder.enabled off unless notification permission is granted", () => {
  const envelope = { version: 1, values: { reminder: { enabled: true, time: "08:30" } } };
  for (const [permission, enabled] of [["granted", true], ["default", false], ["denied", false], ["unsupported", false]]) {
    const storage = makeWritableStorage({ "life-ledger-reminder": JSON.stringify({ enabled: false, time: "21:00", lastSent: "2026-10-28" }) });
    assert.equal(applyBackupPreferences(storage, envelope, { permission }), true);
    assert.deepEqual(JSON.parse(storage.getItem("life-ledger-reminder")), { enabled, time: "08:30" }, permission);
  }
  // Without an explicit permission and without a Notification API in the realm, the reminder is also clamped off.
  const storage = makeWritableStorage();
  assert.equal(applyBackupPreferences(storage, envelope), true);
  assert.deepEqual(JSON.parse(storage.getItem("life-ledger-reminder")), { enabled: false, time: "08:30" });
  // An envelope that already has the reminder disabled stays disabled even with permission.
  const disabled = makeWritableStorage();
  applyBackupPreferences(disabled, { version: 1, values: { reminder: { enabled: false, time: "07:15" } } }, { permission: "granted" });
  assert.deepEqual(JSON.parse(disabled.getItem("life-ledger-reminder")), { enabled: false, time: "07:15" });
});

test("importedPayload discards unknown application data keys and keeps the known state fields", () => {
  const unknownKeys = ["cloudUrl", "authToken", "unknownApp", "profile", "prefs", "exportMeta2", "polluted", "__proto__"];
  const dataJson = `{
    "habits":[{"id":"h1","versions":[]}],
    "logs":{"2026-10-01":{"h1":true}},
    "reviews":{"2026-10-01":{"note":"kept"}},
    "dailyGoals":{"2026-10-01":["a"]},
    "weeklyGoals":{"2026-W40":["b"]},
    "longTermGoals":[{"id":"g1"}],
    "weeklyOutputs":{"2026-W40":"out"},
    "weeklyReviews":{"2026-W40":"rev"},
    "focusSessions":[{"id":"f1","date":"2026-10-01"}],
    "focusSettings":{"focusMinutes":30},
    "quoteSettings":{"mode":"daily"},
    "cloudUrl":"https://evil.example","authToken":"SECRET-token","unknownApp":{"a":1},
    "profile":{"name":"Ada"},"prefs":{"theme":"dark"},"exportMeta2":{"x":1},
    "__proto__":{"polluted":true},"polluted":true
  }`;
  const knownKeys = [
    "dailyGoals", "focusSessions", "focusSettings", "habits", "logs", "longTermGoals",
    "quoteSettings", "reviews", "weeklyGoals", "weeklyOutputs", "weeklyReviews",
  ];
  const inputs = {
    "v3 wrapper": { format: "life-ledger-backup", schemaVersion: 3, scope: "all", exportedAt: "2026-10-29T00:00:00Z", data: JSON.parse(dataJson) },
    "v2 wrapper": { format: "life-ledger-backup", schemaVersion: 2, scope: "all", exportedAt: "2026-10-29T00:00:00Z", data: JSON.parse(dataJson) },
    "legacy raw state": JSON.parse(dataJson),
  };
  for (const [label, raw] of Object.entries(inputs)) {
    const imported = api.importedPayload(raw);
    assert.deepEqual(plain(Object.keys(imported.data)).sort(), knownKeys, label);
    for (const key of unknownKeys) assert.equal(Object.hasOwn(imported.data, key), false, `${label}: ${key} is discarded`);
    assert.equal(imported.data.polluted, undefined, label);
    assert.equal(JSON.stringify(imported.data).includes("SECRET-token"), false, label);
    assert.equal(JSON.stringify(imported.data).includes("evil.example"), false, label);
    assert.deepEqual(plain(imported.data), {
      habits: [{ id: "h1", versions: [] }],
      logs: { "2026-10-01": { h1: true } },
      reviews: { "2026-10-01": { note: "kept" } },
      dailyGoals: { "2026-10-01": ["a"] },
      weeklyGoals: { "2026-W40": ["b"] },
      longTermGoals: [{ id: "g1" }],
      weeklyOutputs: { "2026-W40": "out" },
      weeklyReviews: { "2026-W40": "rev" },
      focusSessions: [{ id: "f1", date: "2026-10-01" }],
      focusSettings: { focusMinutes: 30 },
      quoteSettings: { mode: "daily" },
    }, label);
  }
});

// A VM holding the real restore/undo functions from app.js with mocked DOM, storage and runtime state.
const RESTORE_STUBS = `
var state, pendingImport = null, pendingMediaImport = null, selectedAnalyticsHabitIds = ["stale"];
var cloudMode = false, currentLang = "en", themeChoice = "system", sidebarCollapsed = false, calendarViewMode = "mood";
var reminderSettings = null, deviceProfileCache = null, voiceReflection = null, photoMemories = null;
const supportedLanguages = ["en", "de", "zh"];
const requestedLanguage = "en";
const PROFILE_KEY = "life-ledger-device-profile";
const seed = { focusSettings: {} };
const cloneData = value => JSON.parse(JSON.stringify(value));
const $ = selector => elements[selector] || null;
function tr(key) { return key; }
async function appConfirm() { return true; }
function showToast(message) { calls.toasts.push(message); }
function renderAll() { calls.renders++; }
function renderDrawer() { calls.drawers++; }
function saveState() { calls.saved.push(JSON.stringify(state)); }
function applyTheme() { calls.themes.push(themeChoice); }
function applyFont() {}
function applySidebarState() {}
function updateReminderStatus() {}
function armReminderClock() {}
function renderDeviceProfile() {}
function applyNavOrder() {}
function renderNavOrderSettings() {}
function syncWeekCollapseState() {}
function readDeviceProfile() { return {}; }
function localPrefs() { return {}; }
function isDemoWorkspaceActive() { return false; }
function cleanStarterWorkspaceBase() { return { habits: [], logs: {} }; }
function dismissDemoMetadataAfterRestore() {}
function stripDemoCalendarPhotos() {}
function clearImportSelection() { pendingImport = null; pendingMediaImport = null; }
`;
function loadRestoreHarness({ stored = {}, state, permission = "granted", suffix = "" } = {}) {
  const storage = makeWritableStorage(stored);
  const calls = { saved: [], toasts: [], warnings: [], themes: [], renders: 0, drawers: 0 };
  const elements = {
    "#undoRestore": { hidden: true },
    "#restoreImport": { textContent: "Restore", disabled: false },
    "#exportDialog": { closed: false, close() { this.closed = true; } },
    "#reminderEnabled": { checked: false },
    "#reminderTime": { value: "" },
  };
  const notification = { permission };
  const context = {
    window: { LifeLedgerStorageSuffix: suffix, Notification: notification, LifeLedgerTodayCards: { reload() {} }, LifeLedgerTodayWidgets: { reload() {} } },
    Notification: notification,
    localStorage: storage,
    console: { warn(...args) { calls.warnings.push(args.map(String).join(" ")); }, log() {} },
    calls,
    elements,
  };
  vm.createContext(context);
  vm.runInContext([
    constLine(/^const BACKUP_FORMAT = .*;$/m),
    constLine(/^const BACKUP_SCHEMA_VERSION = \d+;$/m),
    constLine(/^const NAV_PAGES = \[[^\]]*\];$/m),
    constLine(/^const LANGUAGE_KEY = .*;$/m),
    constLine(/^const LANGUAGE_PREFERENCE_KEY = .*;$/m),
    constLine(/^const THEME_KEY = .*;$/m),
    constLine(/^const SIDEBAR_KEY = .*;$/m),
    constLine(/^const CALENDAR_VIEW_KEY = .*;$/m),
    constLine(/^const REMINDER_KEY = .*;$/m),
    constLine(/^const RESTORE_SAFETY_KEY = .*;$/m),
    RESTORE_STUBS,
    extractFunctionSource(app, "function validAvatar(value)"),
    extractFunctionSource(app, "function profileFrame(f)"),
    extractFunctionSource(app, "function isRecord(value)"),
    block,
    extractFunctionSource(app, "function keepCloudWallMedia(wallMedia)"),
    extractFunctionSource(app, "function importedPayload(raw)"),
    extractFunctionSource(app, "function mergeBackupData(current, incoming)"),
    extractFunctionSource(app, "function loadReminderSettings()"),
    extractFunctionSource(app, "function reminderPermission()"),
    extractFunctionSource(app, "function syncBackupPreferencesToRuntime()"),
    extractFunctionSource(app, "async function restorePendingImport()"),
    extractFunctionSource(app, "function undoLastRestore()"),
  ].join("\n"), context);
  assert.equal(vm.runInContext("RESTORE_SAFETY_KEY", context), SAFETY_KEY);
  context.state = JSON.parse(JSON.stringify(state ?? { habits: [], logs: {} }));
  return { context, storage, calls, elements };
}
async function restoreWith(harness, raw) {
  harness.context.pendingImport = harness.context.importedPayload(raw);
  await harness.context.restorePendingImport();
}
const habitIds = state => plain(state).habits.map(habit => habit.id);

const OLD_STATE = { habits: [{ id: "old", versions: [] }], logs: { "2026-09-01": { old: true } } };
const NEW_DATA = { habits: [{ id: "new", versions: [] }], logs: { "2026-10-01": { new: true } } };
const NEW_PREFS = {
  version: 1,
  values: { language: "de", languageExplicit: true, theme: "dark", sidebarCollapsed: true, calendarView: "heatmap", reminder: { enabled: true, time: "08:30" } },
};
const CURRENT_STORED = { "life-ledger-theme": "light", "life-ledger-font": "rounded", "life-ledger-cloud-token": "SECRET-token" };
const fullBackup = (extra = {}) => ({
  format: "life-ledger-backup", schemaVersion: 3, scope: "all", exportedAt: "2026-10-29T00:00:00Z", data: NEW_DATA, preferences: NEW_PREFS, ...extra,
});

test("restorePendingImport applies state and valid preferences from a full v3 backup", async () => {
  const harness = loadRestoreHarness({ stored: CURRENT_STORED, state: OLD_STATE });
  const { context, storage, calls, elements } = harness;
  await restoreWith(harness, fullBackup());

  assert.deepEqual(habitIds(context.state), ["new"]);
  assert.deepEqual(plain(context.state.logs), NEW_DATA.logs);
  assert.deepEqual(withoutSafety(storage.snapshot()), {
    "life-ledger-theme": "dark",
    "life-ledger-language": "de",
    "life-ledger-language-preference-set": "true",
    "life-ledger-sidebar-collapsed": "true",
    "life-ledger-calendar-view": "heatmap",
    "life-ledger-reminder": JSON.stringify({ enabled: true, time: "08:30" }),
    "life-ledger-cloud-token": "SECRET-token",
  });
  assert.equal(storage.getItem("life-ledger-font"), null, "font was omitted from the envelope, so the old value is replaced");

  const safety = JSON.parse(storage.getItem(SAFETY_KEY));
  assert.equal(safety.version, 1);
  assert.equal(typeof safety.savedAt, "number");
  assert.deepEqual(safety.state, OLD_STATE);
  assert.deepEqual(safety.preferences, { version: 1, values: { theme: "light", font: "rounded" } });

  assert.equal(context.currentLang, "de");
  assert.equal(context.themeChoice, "dark");
  assert.equal(context.sidebarCollapsed, true);
  assert.equal(context.calendarViewMode, "heatmap");
  assert.deepEqual(plain(context.reminderSettings), { enabled: true, time: "08:30", lastSent: "" });
  assert.equal(elements["#reminderEnabled"].checked, true);
  assert.equal(elements["#reminderTime"].value, "08:30");
  assert.deepEqual(calls.themes, ["dark"]);
  assert.equal(calls.saved.length, 1);
  assert.deepEqual(JSON.parse(calls.saved[0]).habits.map(habit => habit.id), ["new"]);
  assert.deepEqual(calls.toasts, ["toast.restored"]);
  assert.equal(calls.renders, 1);
  assert.equal(elements["#undoRestore"].hidden, false);
  assert.equal(elements["#exportDialog"].closed, true);
  assert.equal(elements["#restoreImport"].disabled, false);
  assert.equal(elements["#restoreImport"].textContent, "Restore");
  assert.equal(context.pendingImport, null);
});

test("restorePendingImport clamps a restored reminder off when notification permission is not granted", async () => {
  const harness = loadRestoreHarness({ stored: CURRENT_STORED, state: OLD_STATE, permission: "default" });
  await restoreWith(harness, fullBackup());
  assert.deepEqual(JSON.parse(harness.storage.getItem("life-ledger-reminder")), { enabled: false, time: "08:30" });
  assert.equal(harness.context.reminderSettings.enabled, false);
  assert.equal(harness.elements["#reminderEnabled"].checked, false);
});

test("restorePendingImport with a valid empty preferences envelope clears the allowlisted settings", async () => {
  const harness = loadRestoreHarness({ stored: CURRENT_STORED, state: OLD_STATE });
  await restoreWith(harness, fullBackup({ preferences: { version: 1, values: {} } }));
  assert.deepEqual(withoutSafety(harness.storage.snapshot()), { "life-ledger-cloud-token": "SECRET-token" });
  assert.deepEqual(habitIds(harness.context.state), ["new"]);
  assert.equal(harness.context.themeChoice, "system");
  assert.deepEqual(harness.calls.themes, ["system"]);
});

test("restorePendingImport keeps preferences when a partial v3 backup is merged in", async () => {
  const harness = loadRestoreHarness({ stored: CURRENT_STORED, state: OLD_STATE });
  const { context, storage, calls, elements } = harness;
  await restoreWith(harness, fullBackup({ scope: "month" }));

  assert.deepEqual(habitIds(context.state).sort(), ["new", "old"], "partial restore merges into the current state");
  assert.deepEqual(plain(context.state.logs), { ...OLD_STATE.logs, ...NEW_DATA.logs });
  assert.deepEqual(withoutSafety(storage.snapshot()), CURRENT_STORED);
  assert.deepEqual(calls.themes, [], "runtime preferences are not re-synced");
  assert.equal(context.currentLang, "en");
  assert.equal(context.themeChoice, "system");
  assert.deepEqual(calls.toasts, ["toast.restored"]);
  assert.equal(calls.saved.length, 1);
  assert.equal(elements["#undoRestore"].hidden, false);
  assert.deepEqual(JSON.parse(storage.getItem(SAFETY_KEY)).preferences, { version: 1, values: { theme: "light", font: "rounded" } });
});

test("restorePendingImport keeps preferences for v1, v2 and legacy backups even when they carry an envelope", async () => {
  const cases = {
    v1: fullBackup({ schemaVersion: 1 }),
    v2: fullBackup({ schemaVersion: 2 }),
    legacy: { ...NEW_DATA, preferences: NEW_PREFS },
  };
  for (const [label, raw] of Object.entries(cases)) {
    const harness = loadRestoreHarness({ stored: CURRENT_STORED, state: OLD_STATE });
    await restoreWith(harness, raw);
    assert.deepEqual(habitIds(harness.context.state), ["new"], `${label}: state restored`);
    assert.deepEqual(withoutSafety(harness.storage.snapshot()), CURRENT_STORED, `${label}: preferences preserved`);
    assert.deepEqual(harness.calls.themes, [], `${label}: runtime not re-synced`);
    assert.equal(harness.context.currentLang, "en", label);
    assert.deepEqual(harness.calls.toasts, ["toast.restored"], label);
    assert.equal(harness.elements["#undoRestore"].hidden, false, label);
  }
});

test("undoLastRestore restores state and preferences from a wrapper snapshot and deletes the safety key", () => {
  const snapshot = {
    version: 1,
    savedAt: 1,
    state: OLD_STATE,
    preferences: { version: 1, values: { theme: "light", font: "rounded", reminder: { enabled: false, time: "21:00" } } },
  };
  const harness = loadRestoreHarness({
    stored: {
      "life-ledger-theme": "dark", "life-ledger-language": "de", "life-ledger-language-preference-set": "true",
      "life-ledger-cloud-token": "SECRET-token", [SAFETY_KEY]: JSON.stringify(snapshot),
    },
    state: NEW_DATA,
  });
  const { context, storage, calls, elements } = harness;
  elements["#undoRestore"].hidden = false;
  context.undoLastRestore();

  assert.deepEqual(habitIds(context.state), ["old"]);
  assert.deepEqual(plain(context.state.logs), OLD_STATE.logs);
  assert.deepEqual(storage.snapshot(), {
    "life-ledger-theme": "light",
    "life-ledger-font": "rounded",
    "life-ledger-reminder": JSON.stringify({ enabled: false, time: "21:00" }),
    "life-ledger-cloud-token": "SECRET-token",
  });
  assert.equal(storage.getItem(SAFETY_KEY), null);
  assert.equal(elements["#undoRestore"].hidden, true);
  assert.equal(context.themeChoice, "light");
  assert.equal(context.currentLang, "en", "language keys were absent in the snapshot, so the app falls back");
  assert.deepEqual(calls.themes, ["light"]);
  assert.equal(calls.saved.length, 1);
  assert.deepEqual(JSON.parse(calls.saved[0]).habits.map(habit => habit.id), ["old"]);
  assert.deepEqual(calls.toasts, ["toast.restoreUndone"]);
  assert.equal(calls.renders, 1);
  assert.deepEqual(calls.warnings, []);
});

test("a full restore followed by undo returns both state and preferences to where they started", async () => {
  const harness = loadRestoreHarness({ stored: CURRENT_STORED, state: OLD_STATE });
  const { context, storage, calls, elements } = harness;
  await restoreWith(harness, fullBackup());
  assert.notDeepEqual(withoutSafety(storage.snapshot()), CURRENT_STORED);
  assert.ok(storage.getItem(SAFETY_KEY));

  context.undoLastRestore();
  assert.deepEqual(habitIds(context.state), ["old"]);
  assert.deepEqual(storage.snapshot(), CURRENT_STORED, "preferences are back and the safety key is gone");
  assert.equal(elements["#undoRestore"].hidden, true);
  assert.equal(context.themeChoice, "light");
  assert.equal(context.currentLang, "en");
  assert.deepEqual(calls.toasts, ["toast.restored", "toast.restoreUndone"]);
  assert.deepEqual(calls.warnings, []);
});

test("undoLastRestore restores a legacy raw-state snapshot, keeps current preferences and deletes the safety key", () => {
  const current = { "life-ledger-theme": "dark", "life-ledger-font": "serif", "life-ledger-language": "de", "life-ledger-cloud-token": "SECRET-token" };
  const variants = {
    "raw state": OLD_STATE,
    "raw state with a stray preferences field": { ...OLD_STATE, preferences: { version: 1, values: { theme: "light" } } },
  };
  for (const [label, legacy] of Object.entries(variants)) {
    const harness = loadRestoreHarness({ stored: { ...current, [SAFETY_KEY]: JSON.stringify(legacy) }, state: NEW_DATA });
    const { context, storage, calls, elements } = harness;
    elements["#undoRestore"].hidden = false;
    context.undoLastRestore();

    assert.deepEqual(habitIds(context.state), ["old"], label);
    assert.deepEqual(plain(context.state.logs), OLD_STATE.logs, label);
    assert.deepEqual(storage.snapshot(), current, `${label}: current preferences preserved, safety key deleted`);
    assert.equal(elements["#undoRestore"].hidden, true, label);
    assert.deepEqual(calls.themes, [], `${label}: runtime not re-synced`);
    assert.equal(context.themeChoice, "system", label);
    assert.equal(calls.saved.length, 1, label);
    assert.deepEqual(calls.toasts, ["toast.restoreUndone"], label);
    assert.deepEqual(calls.warnings, [], label);
  }
});

test("undoLastRestore deletes a malformed safety snapshot, hides undo and leaves state and preferences alone", () => {
  const cases = {
    "absent key": undefined,
    "not JSON": "{broken",
    "JSON null": "null",
    "JSON array": "[]",
    "wrapper with invalid preferences": JSON.stringify({ version: 1, savedAt: 1, state: OLD_STATE, preferences: { version: 1, values: { theme: "neon" } } }),
    "wrapper with unsupported version": JSON.stringify({ version: 2, savedAt: 1, state: OLD_STATE, preferences: NEW_PREFS }),
    "wrapper without state": JSON.stringify({ version: 1, savedAt: 1, preferences: NEW_PREFS }),
    "wrapper with invalid state": JSON.stringify({ version: 1, savedAt: 1, state: { habits: "x", logs: {} }, preferences: NEW_PREFS }),
  };
  const current = { habits: [{ id: "current", versions: [] }], logs: {} };
  const prefs = { "life-ledger-theme": "dark", "life-ledger-font": "serif", "life-ledger-cloud-token": "SECRET-token" };
  for (const [label, rawSnapshot] of Object.entries(cases)) {
    const stored = rawSnapshot === undefined ? { ...prefs } : { ...prefs, [SAFETY_KEY]: rawSnapshot };
    const harness = loadRestoreHarness({ stored, state: current });
    const { context, storage, calls, elements } = harness;
    elements["#undoRestore"].hidden = false;
    context.undoLastRestore();

    assert.equal(storage.getItem(SAFETY_KEY), null, `${label}: safety key deleted`);
    assert.equal(elements["#undoRestore"].hidden, true, `${label}: undo hidden`);
    assert.deepEqual(storage.snapshot(), prefs, `${label}: preferences untouched`);
    assert.deepEqual(plain(context.state), current, `${label}: state untouched`);
    assert.deepEqual(calls.saved, [], label);
    assert.deepEqual(calls.themes, [], label);
    assert.deepEqual(calls.toasts, [], label);
    assert.equal(calls.renders, 0, label);
    assert.equal(calls.warnings.length, 1, label);
  }
});
