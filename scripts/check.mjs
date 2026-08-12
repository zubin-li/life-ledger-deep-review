import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";

const root = new URL("../", import.meta.url);
const required = [
  "public/index.html",
  "public/app.js",
  "public/styles.css",
  "public/sw.js",
  "public/manifest.webmanifest",
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
  /111d2aac5acc6efc98199232866fdcae/i,
  /e4973028-fbf1-4982-a746-6cd94037bf78/i,
  /life-ledger-1tj\.pages\.dev/i,
  /\/Users\/ashan/i,
  /zubinli\.applications@gmail\.com/i,
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

console.log("Open-source safety and structure checks passed.");
