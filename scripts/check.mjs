import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";

const root = new URL("../", import.meta.url);
const required = [
  "public/index.html",
  "public/app.js",
  "public/voice-checkin.js",
  "public/photo-memories.js",
  "public/media-backup.js",
  "public/deployment-mode.js",
  "public/cloudbase-sync.js",
  "public/_init_tcb-env.js",
  "public/vendor/cloudbase-sdk.js",
  "public/vendor/cloudbase-sdk.js.LEGAL.txt",
  "public/vendor/heic2any.min.js",
  "public/styles.css",
  "public/sw.js",
  "public/manifest.webmanifest",
  "OPEN-LIFE-LEDGER.html",
  "src/index.js",
  "src/voice.js",
  "migrations/0001_initial.sql",
  "README.md",
  "README.zh-CN.md",
  "cloudbaserc.json",
  "scripts/build-cloudbase.mjs",
  "scripts/build-cloudbase-sdk.mjs",
  "scripts/deploy-cloudbase.mjs",
  "docs/cloudbase-china.md",
  "docs/cloudbase-china.zh-CN.md",
  "docs/backup-and-restore.md",
  "docs/backup-and-restore.zh-CN.md",
  ".github/workflows/pages.yml",
  "LICENSE",
];

await Promise.all(required.map(path => readFile(new URL(path, root))));

const textFiles = [
  ...required.filter(path => !path.endsWith("LICENSE") && !path.includes("vendor/cloudbase-sdk.js")),
  "SECURITY.md",
  "PRIVACY.md",
  "CONTRIBUTING.md",
  "wrangler.jsonc",
];
const forbidden = [
  /"database_id"\s*:\s*"[0-9a-f]{8}-[0-9a-f-]{27,}"/i,
  /life-ledger-[a-z0-9]+\.pages\.dev/i,
  /\/Users\/[^/\s]+\//i,
  /[\w.+-]+@gmail\.com/i,
];

for (const path of textFiles) {
  const content = await readFile(new URL(path, root), "utf8");
  for (const pattern of forbidden) {
    if (pattern.test(content)) throw new Error(`Private marker found in ${path}: ${pattern}`);
  }
}

const assetNames = await readdir(new URL("public/assets/", root));
for (const name of ["app-icon-192.png", "app-icon-512.png", "apple-touch-icon.png"]) {
  if (!assetNames.includes(name)) throw new Error(`Missing required asset: ${name}`);
}

const index = await readFile(new URL("public/index.html", root), "utf8");
const app = await readFile(new URL("public/app.js", root), "utf8");
if (/type=["']module["'][^>]*src=["']\.\/app\.js/.test(index)) {
  throw new Error("Direct-file mode must load app.js as a classic script");
}
if (!app.includes('window.LIFE_LEDGER_DEPLOYMENT_MODE || "local"')) {
  throw new Error("Static HTTPS hosts must default to explicit local-only mode");
}
for (const marker of ["life-ledger-backup", "previewImportFile", "restorePendingImport", "undoLastRestore"]) {
  if (!app.includes(marker)) throw new Error(`Backup and restore implementation is incomplete: ${marker}`);
}
for (const marker of ['id="importFile"', 'id="importPreview"', 'id="restoreImport"']) {
  if (!index.includes(marker)) throw new Error(`Backup and restore interface is incomplete: ${marker}`);
}
for (const marker of ['id="voiceReflectionButton"', 'id="voiceReflectionDialog"', 'id="voiceDraft"']) {
  if (!index.includes(marker)) throw new Error(`Voice reflection interface is incomplete: ${marker}`);
}
const launcher = await readFile(new URL("OPEN-LIFE-LEDGER.html", root), "utf8");
if (!launcher.includes("public/index.html")) {
  throw new Error("The zero-configuration launcher must point to public/index.html");
}

const cloudBaseConfig = JSON.parse(await readFile(new URL("cloudbaserc.json", root), "utf8"));
if (cloudBaseConfig.$schema !== "https://static.cloudbase.net/cli/cloudbaserc.schema.json") {
  throw new Error("CloudBase configuration must use the maintained CLI schema");
}
if (cloudBaseConfig.app?.buildCommand !== "npm run build:cloudbase" || cloudBaseConfig.app?.outputDir !== "dist/cloudbase") {
  throw new Error("CloudBase application build settings are incomplete");
}
const cloudBaseAdapter = await readFile(new URL("public/cloudbase-sync.js", root), "utf8");
if (cloudBaseAdapter.includes("getLoginState") || cloudBaseAdapter.includes("framework-plugin")) {
  throw new Error("Deprecated CloudBase APIs or Framework plugins must not be reintroduced");
}

console.log("Open-source safety and structure checks passed.");
