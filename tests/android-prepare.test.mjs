import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { mkdtemp, readFile, readdir, rm, writeFile, mkdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { LOCAL_MODE_SOURCE, prepare, REMOVE_FILES } from "../scripts/android-prepare.mjs";
import {
  BACKUP_RULES_XML,
  evaluateApkDumps,
  FORBIDDEN_PERMISSIONS,
  patchManifest,
  patchProject,
  REQUIRED_PERMISSIONS,
} from "../scripts/android-manifest.mjs";
import {
  evaluateApkAssets,
  evaluateBackupPluginClass,
  findBackupRulesPath,
  FORBIDDEN_APK_ASSETS,
} from "../scripts/android-apk-check.mjs";
import { BACKUP_PLUGIN_CLASS, injectAndroidBackupPlugin } from "../scripts/android-prepare.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const dist = resolve(root, "android-dist");
const TEXT_EXTENSIONS = new Set([".js", ".mjs", ".html", ".css", ".json", ".webmanifest", ".svg", ".txt"]);
const FORBIDDEN_SNIPPETS = [
  "cloudbase-sync.js",
  "_init_tcb-env.js",
  "cloudbase-sdk",
  "voice-checkin.js",
  "/api/voice-review",
  "check_for_updates",
  "/api/calendar/",
  "./api/state",
  "mac-updates/latest.json",
  "./sw.js",
];
const CORE_FILES = [
  "index.html",
  "app.js",
  "styles.css",
  "ledger-core.js",
  "ledger-ui.js",
  "deployment-mode.js",
  "manifest.webmanifest",
  "assets/app-icon.svg",
  "today-widgets.js",
  "weather-widget.js",
];

const SAMPLE_MANIFEST = `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
    <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
    <uses-permission android:name="android.permission.CAMERA" />
    <application
        android:icon="@mipmap/ic_launcher"
        android:label="@string/app_name"
        android:usesCleartextTraffic="\${usesCleartextTraffic}">
        <activity android:name=".MainActivity" android:exported="true" />
    </application>
</manifest>
`;

function sha256(text) {
  return createHash("sha256").update(text).digest("hex");
}

async function textFiles(dir) {
  const found = [];
  async function walk(current) {
    const entries = await readdir(current, { withFileTypes: true });
    for (const entry of entries) {
      const path = join(current, entry.name);
      if (entry.isDirectory()) await walk(path);
      else if (TEXT_EXTENSIONS.has(extname(entry.name))) found.push(path);
    }
  }
  await walk(dir);
  found.sort();
  return found;
}

test("android prepare keeps a local offline dist and leaves public untouched", async () => {
  const publicIndexBefore = await readFile(resolve(root, "public/index.html"), "utf8");
  const publicCloudBefore = await readFile(resolve(root, "public/cloudbase-sync.js"), "utf8");
  await prepare();
  const first = {
    index: sha256(await readFile(resolve(dist, "index.html"), "utf8")),
    app: sha256(await readFile(resolve(dist, "app.js"), "utf8")),
    widgets: sha256(await readFile(resolve(dist, "today-widgets.js"), "utf8")),
    mode: sha256(await readFile(resolve(dist, "deployment-mode.js"), "utf8")),
  };
  await prepare();
  assert.equal(sha256(await readFile(resolve(dist, "index.html"), "utf8")), first.index);
  assert.equal(sha256(await readFile(resolve(dist, "app.js"), "utf8")), first.app);
  assert.equal(sha256(await readFile(resolve(dist, "today-widgets.js"), "utf8")), first.widgets);
  assert.equal(sha256(await readFile(resolve(dist, "deployment-mode.js"), "utf8")), first.mode);
  assert.equal(await readFile(resolve(root, "public/index.html"), "utf8"), publicIndexBefore);
  assert.equal(await readFile(resolve(root, "public/cloudbase-sync.js"), "utf8"), publicCloudBefore);
  assert.match(publicIndexBefore, /cloudbase-sync\.js/);

  for (const relative of REMOVE_FILES) {
    await assert.rejects(readFile(resolve(dist, relative)), { code: "ENOENT" });
  }
  for (const relative of CORE_FILES) {
    const body = await readFile(resolve(dist, relative), "utf8");
    assert.ok(body.length > 0, relative);
  }
  assert.equal(await readFile(resolve(dist, "deployment-mode.js"), "utf8"), LOCAL_MODE_SOURCE);
  assert.match(LOCAL_MODE_SOURCE, /window\.LIFE_LEDGER_DEPLOYMENT_MODE = "local";/);
  assert.doesNotMatch(await readFile(resolve(dist, "index.html"), "utf8"), /cloudbase-sync|_init_tcb-env|voice-checkin\.js/);

  const androidWidgets = await readFile(resolve(dist, "today-widgets.js"), "utf8");
  const androidCards = await readFile(resolve(dist, "today-cards.js"), "utf8");
  assert.match(androidWidgets, /api\.open-meteo\.com\/v1\/forecast/);
  assert.match(androidWidgets, /geocoding-api\.open-meteo\.com\/v1\/search/);
  assert.match(androidWidgets, /Open-Meteo · CC BY 4\.0/);
  assert.match(androidWidgets, /id: "weather", el: cards\.weather/);
  assert.doesNotMatch(androidWidgets, /cards\.weather\.remove\(\)/);
  assert.doesNotMatch(androidCards, /planGrid\.remove\(\)/);
  assert.match(androidCards, /planGrid\.hidden = true/);
  assert.doesNotMatch(androidCards, /id: "dayplan", el: wrap\(planGrid/);

  const hits = [];
  for (const path of await textFiles(dist)) {
    const body = await readFile(path, "utf8");
    for (const snippet of FORBIDDEN_SNIPPETS) {
      if (body.includes(snippet)) hits.push(`${path.slice(dist.length + 1)} contains ${snippet}`);
    }
  }
  assert.deepEqual(hits, []);

  for (const relative of ["app.js", "today-widgets.js", "deployment-mode.js"]) {
    const checked = spawnSync(process.execPath, ["--check", resolve(dist, relative)], { encoding: "utf8" });
    assert.equal(checked.status, 0, checked.stderr);
  }
});

test("backup plugin injection copies Kotlin into the generated android app and pins Android 1.0 (versionCode 1)", async () => {
  const dir = await mkdtemp(join(tmpdir(), "ll-android-inject-"));
  const appRoot = join(dir, "app");
  await mkdir(join(appRoot, "src/main"), { recursive: true });
  await writeFile(join(appRoot, "proguard-rules.pro"), "-keep class androidx.appcompat.widget.Toolbar { *; }\n");
  await writeFile(
    join(appRoot, "build.gradle.kts"),
    'android {\n  defaultConfig {\n    versionCode = tauriProperties.getProperty("tauri.android.versionCode", "3001000").toInt()\n    versionName = tauriProperties.getProperty("tauri.android.versionName", "3.1.0")\n  }\n}\n',
  );
  const destination = await injectAndroidBackupPlugin(dir);
  const injected = await readFile(destination, "utf8");
  assert.match(injected, /BackupPlugin/);
  assert.match(await readFile(join(appRoot, "proguard-rules.pro"), "utf8"), /life-ledger-backup-plugin/);
  const gradle = await readFile(join(appRoot, "build.gradle.kts"), "utf8");
  assert.match(gradle, /versionCode = 1\b/);
  assert.match(gradle, /versionName = "1\.0"/);
  const props = await readFile(join(appRoot, "tauri.properties"), "utf8");
  assert.match(props, /tauri\.android\.versionCode=1/);
  assert.match(props, /tauri\.android\.versionName=1\.0/);
  await rm(dir, { recursive: true, force: true });
});

test("manifest patch keeps INTERNET, removes broad storage permissions and disables backup transfer", async () => {
  const patched = patchManifest(SAMPLE_MANIFEST);
  assert.equal(patchManifest(patched), patched);
  for (const name of REQUIRED_PERMISSIONS) {
    assert.match(patched, new RegExp(`<uses-permission android:name="${name.replaceAll(".", "\\.")}" \\/>`), name);
    assert.doesNotMatch(patched, new RegExp(`${name.replaceAll(".", "\\.")}" tools:node="remove"`), name);
  }
  for (const name of FORBIDDEN_PERMISSIONS) {
    assert.match(
      patched,
      new RegExp(`<uses-permission android:name="${name.replaceAll(".", "\\.")}" tools:node="remove" \\/>`),
      name,
    );
  }
  assert.match(patched, /xmlns:tools="http:\/\/schemas\.android\.com\/tools"/);
  assert.match(patched, /android\.permission\.CAMERA/);
  assert.match(patched, /android:allowBackup="false"/);
  assert.match(patched, /android:fullBackupContent="false"/);
  assert.match(patched, /android:dataExtractionRules="@xml\/life_ledger_backup_rules"/);
  assert.match(patched, /android:enableOnBackInvokedCallback="true"/);

  const withoutInternet = patchManifest(
    '<manifest xmlns:android="http://schemas.android.com/apk/res/android"><uses-permission android:name="android.permission.INTERNET" tools:node="remove" /><application android:usesCleartextTraffic="true" /></manifest>',
  );
  assert.match(withoutInternet, /<uses-permission android:name="android\.permission\.INTERNET" \/>/);
  assert.doesNotMatch(withoutInternet, /INTERNET" tools:node="remove"/);
  assert.match(withoutInternet, /<application android:usesCleartextTraffic="true" android:allowBackup="false"/);

  const dir = await mkdtemp(join(tmpdir(), "ll-android-manifest-"));
  try {
    const manifestDir = join(dir, "app/src/main");
    await mkdir(manifestDir, { recursive: true });
    await writeFile(join(manifestDir, "AndroidManifest.xml"), SAMPLE_MANIFEST);
    const written = await patchProject(dir);
    assert.equal(written.length, 1);
    assert.match(await readFile(written[0], "utf8"), /allowBackup="false"/);
    assert.equal(await readFile(join(manifestDir, "res/xml/life_ledger_backup_rules.xml"), "utf8"), BACKUP_RULES_XML);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("apk dump and asset checks require INTERNET, reject storage permissions and cloud/AI assets", () => {
  const missingInternet = evaluateApkDumps({
    packageName: "app.zubinli.lifeledger.androidtest",
    permissions: "uses-permission: name='android.permission.CAMERA'\n",
    xmltree: [
      'A: android:allowBackup(0x01010280)=(type 0x12)0x0',
      'A: android:fullBackupContent(0x010104eb)=(type 0x12)0x0',
      "A: android:dataExtractionRules(0x0101057a)=@xml/life_ledger_backup_rules",
    ].join("\n"),
    rules: BACKUP_RULES_XML,
  });
  assert.ok(missingInternet.some((line) => line.includes("missing required permission: android.permission.INTERNET")));

  const badStorage = evaluateApkDumps({
    packageName: "app.zubinli.lifeledger.androidtest",
    permissions: "uses-permission: name='android.permission.INTERNET'\nuses-permission: name='android.permission.READ_EXTERNAL_STORAGE'\n",
    xmltree: 'A: android:allowBackup(0x01010280)=(type 0x12)0xffffffff\n',
    rules: "<data-extraction-rules></data-extraction-rules>",
  });
  assert.ok(badStorage.some((line) => line.includes("READ_EXTERNAL_STORAGE")));
  assert.ok(badStorage.some((line) => line.includes("allowBackup")));

  const good = evaluateApkDumps({
    packageName: "app.zubinli.lifeledger.androidtest",
    permissions: "uses-permission: name='android.permission.INTERNET'\nuses-permission: name='android.permission.CAMERA'\n",
    xmltree: [
      'A: android:allowBackup(0x01010280)=(type 0x12)0x0',
      'A: android:fullBackupContent(0x010104eb)=(type 0x12)0x0',
      "A: android:dataExtractionRules(0x0101057a)=@xml/life_ledger_backup_rules",
    ].join("\n"),
    rules: BACKUP_RULES_XML,
  });
  assert.deepEqual(good, []);
  const fromAapt = evaluateApkDumps({
    packageName: "app.zubinli.lifeledger.androidtest",
    permissions: "package: app.zubinli.lifeledger.androidtest\nuses-permission: name='android.permission.INTERNET'\n",
    xmltree: [
      "A: android:allowBackup(0x01010280)=false",
      "A: android:fullBackupContent(0x010104eb)=false",
      "A: android:dataExtractionRules(0x0101057a)=(type 0x1)0x7f100000",
    ].join("\n"),
    rules: "E: device-transfer (line=8)\n    E: exclude (line=9)\n      A: domain(0x01010000)=\"root\"\n",
  });
  assert.deepEqual(fromAapt, []);
  const wrongPackage = evaluateApkDumps({
    packageName: "app.zubinli.lifeledger",
    permissions: "uses-permission: name='android.permission.INTERNET'\n",
    xmltree: [
      'A: android:allowBackup(0x01010280)=(type 0x12)0x0',
      'A: android:fullBackupContent(0x010104eb)=(type 0x12)0x0',
      "A: android:dataExtractionRules(0x0101057a)=@xml/life_ledger_backup_rules",
    ].join("\n"),
    rules: BACKUP_RULES_XML,
  });
  assert.ok(wrongPackage.some((line) => line.includes("package id")));

  // APK asset gate: forbids cloudbase / AI / sw.js assets
  assert.deepEqual(evaluateApkAssets(["AndroidManifest.xml", "classes.dex", "assets/weather-widget.js"]), []);
  for (const name of FORBIDDEN_APK_ASSETS) {
    const errs = evaluateApkAssets(["AndroidManifest.xml", `assets/${name}`]);
    assert.ok(errs.some((line) => line.includes(name)), `should reject ${name}`);
  }
});

test("android config is a separate test id and does not replace the desktop id", async () => {
  const packageJson = JSON.parse(await readFile(resolve(root, "package.json"), "utf8"));
  const desktop = JSON.parse(await readFile(resolve(root, "src-tauri/tauri.conf.json"), "utf8"));
  const android = JSON.parse(await readFile(resolve(root, "src-tauri/tauri.android.conf.json"), "utf8"));
  const capability = JSON.parse(await readFile(resolve(root, "src-tauri/capabilities/android-local.json"), "utf8"));
  const lib = await readFile(resolve(root, "src-tauri/src/lib.rs"), "utf8");
  const apkCheck = await readFile(resolve(root, "scripts/android-apk-check.mjs"), "utf8");
  assert.equal(packageJson.scripts.tauri, "tauri");
  assert.equal(desktop.identifier, "app.zubinli.lifeledger");
  assert.equal(android.identifier, "app.zubinli.lifeledger.androidtest");
  assert.equal(android.productName, "Life Ledger Android Test");
  assert.equal(android.version, "1.0.0");
  assert.equal(android.bundle.android.versionCode, 1);
  assert.equal(android.app.windows[0].label, "main");
  assert.equal(android.app.windows[0].title, "Life Ledger Android Test");
  assert.equal(android.build.frontendDist, "../android-dist");
  assert.equal(android.bundle.createUpdaterArtifacts, false);
  assert.deepEqual(android.app.security.capabilities, ["android-local"]);
  assert.deepEqual(capability.platforms, ["android"]);
  assert.deepEqual(capability.permissions, [
    "core:default",
    "allow-android-pick-import",
    "allow-android-pick-export",
    "allow-android-document-length",
    "allow-android-backup-open-write",
    "allow-android-backup-write-chunk",
    "allow-android-backup-close-write",
    "allow-android-backup-open-read",
    "allow-android-backup-read-chunk",
    "allow-android-backup-close-read",
    "allow-android-get-ringer-mode",
    "allow-android-set-back-enabled",
  ]);
  const backupPlugin = await readFile(resolve(root, "src-tauri/android/src/main/java/BackupPlugin.kt"), "utf8");
  assert.match(backupPlugin, /ACTION_CREATE_DOCUMENT/);
  assert.match(backupPlugin, /ACTION_OPEN_DOCUMENT/);
  const workflow = await readFile(resolve(root, ".github/workflows/android-cloud-build.yml"), "utf8");
  assert.doesNotMatch(workflow, /Strip internet permission/i);
  assert.match(workflow, /tauri android init --ci/);
  assert.match(workflow, /android-prepare\.mjs src-tauri\/gen\/android/);
  assert.match(workflow, /apkanalyzer/);
  assert.match(workflow, /cmdline-tools\/latest\/bin\/sdkmanager/);
  assert.doesNotMatch(workflow, /packages:\s*tools/);
  assert.match(workflow, /tauri android build --apk --target aarch64/);
  assert.match(workflow, /keytool -genkeypair/);
  assert.match(workflow, /apksigner.*sign/s);
  assert.match(workflow, /build-tools\/35\.0\.0\/aapt2/);
  assert.match(apkCheck, /"--file", "AndroidManifest\.xml"/);
  assert.match(apkCheck, /"dump", "badging"/);
  assert.match(apkCheck, /maxBuffer/);
  assert.match(apkCheck, /apkanalyzer/);
  assert.match(apkCheck, /\["dex", "packages", "--defined-only", apk\]/);
  assert.doesNotMatch(apkCheck, /\["dex", "classes"/);
  assert.deepEqual(evaluateBackupPluginClass(`${BACKUP_PLUGIN_CLASS}\n`), []);
  assert.notDeepEqual(evaluateBackupPluginClass("com.example.Missing\n"), []);
  assert.equal(
    findBackupRulesPath("resource 0x7f130000 xml/life_ledger_backup_rules\n  () (file) res/0w.xml type=XML"),
    "res/0w.xml",
  );
  assert.match(workflow, /android-apk\/\*-signed\.apk/);
  assert.match(workflow, /retention-days: 1/);
  assert.doesNotMatch(workflow, /secrets\./);
  assert.match(lib, /#\[cfg\(desktop\)\]\s*mod desktop/);
  assert.match(lib, /#\[cfg\(mobile\)\]\s*mod mobile/);
  assert.match(await readFile(resolve(root, "src-tauri/src/mobile/mod.rs"), "utf8"), /pub fn run\(\)/);
});
