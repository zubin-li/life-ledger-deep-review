import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";

const root = new URL("../", import.meta.url);
const required = [
  "public/index.html",
  "public/app.js",
  "public/styles.css",
  "public/sw.js",
  "public/manifest.webmanifest",
  "OPEN-LIFE-LEDGER.html",
  "src/index.js",
  "migrations/0001_initial.sql",
  "README.md",
  "README.zh-CN.md",
  "LICENSE",
];

await Promise.all(required.map(path => readFile(new URL(path, root))));

const textFiles = [
  ...required.filter(path => !path.endsWith("LICENSE")),
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
if (!app.includes('location.protocol === "https:"')) {
  throw new Error("Cloud sync must stay disabled for file:// and local HTTP use");
}
const launcher = await readFile(new URL("OPEN-LIFE-LEDGER.html", root), "utf8");
if (!launcher.includes("public/index.html")) {
  throw new Error("The zero-configuration launcher must point to public/index.html");
}

console.log("Open-source safety and structure checks passed.");
