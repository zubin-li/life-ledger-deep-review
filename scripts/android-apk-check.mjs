import { spawnSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { evaluateApkDumps } from "./android-manifest.mjs";
import { BACKUP_PLUGIN_CLASS } from "./android-prepare.mjs";

export const FORBIDDEN_APK_ASSETS = [
  "cloudbase-sync.js",
  "_init_tcb-env.js",
  "cloudbase-sdk.js",
  "voice-checkin.js",
  "sw.js",
];

export function findBackupRulesPath(resourcesDump) {
  const block = resourcesDump.match(/xml\/life_ledger_backup_rules[\s\S]{0,300}?\(file\)\s+(\S+)/);
  return block ? block[1] : "res/xml/life_ledger_backup_rules.xml";
}

export function evaluateBackupPluginClass(apkanalyzerOutput) {
  const errors = [];
  if (!apkanalyzerOutput.includes(BACKUP_PLUGIN_CLASS)) {
    errors.push(`missing compiled dex class: ${BACKUP_PLUGIN_CLASS}`);
  }
  return errors;
}

export function listZipEntries(buffer) {
  const buf = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer);
  const minEocd = 22;
  const searchStart = Math.max(0, buf.length - 65557);
  let eocdOffset = -1;
  for (let i = buf.length - minEocd; i >= searchStart; i -= 1) {
    if (buf.readUInt32LE(i) === 0x06054b50) {
      eocdOffset = i;
      break;
    }
  }
  if (eocdOffset < 0) return [];
  const totalEntries = buf.readUInt16LE(eocdOffset + 10);
  let offset = buf.readUInt32LE(eocdOffset + 16);
  const names = [];
  for (let idx = 0; idx < totalEntries && offset + 46 <= buf.length; idx += 1) {
    if (buf.readUInt32LE(offset) !== 0x02014b50) break;
    const nameLen = buf.readUInt16LE(offset + 28);
    const extraLen = buf.readUInt16LE(offset + 30);
    const commentLen = buf.readUInt16LE(offset + 32);
    const nameStart = offset + 46;
    const nameEnd = nameStart + nameLen;
    if (nameEnd > buf.length) break;
    names.push(buf.toString("utf8", nameStart, nameEnd));
    offset = nameEnd + extraLen + commentLen;
  }
  return names;
}

export function evaluateApkAssets(entries) {
  const list = Array.isArray(entries)
    ? entries
    : String(entries || "")
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean);
  const errors = [];
  for (const raw of list) {
    const normalized = String(raw).replaceAll("\\", "/").toLowerCase();
    for (const forbidden of FORBIDDEN_APK_ASSETS) {
      if (normalized === forbidden || normalized.endsWith(`/${forbidden}`)) {
        errors.push(`forbidden cloud/AI asset in apk: ${raw}`);
      }
    }
  }
  return errors;
}

function dump(aapt2, apk, label, args) {
  const result = spawnSync(aapt2, args, { encoding: "utf8", maxBuffer: 32 * 1024 * 1024 });
  if (result.status !== 0) {
    console.error(`${label} dump failed: ${result.error?.message || result.stderr || result.stdout || aapt2}`);
    process.exit(1);
  }
  return result.stdout;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const apk = process.argv[2];
  const aapt2 = process.argv[3];
  const apkanalyzer = process.argv[4];
  if (!apk || !aapt2 || !apkanalyzer) {
    console.error("usage: android-apk-check.mjs <apk> <aapt2> <apkanalyzer>");
    process.exit(2);
  }

  const badging = dump(aapt2, apk, "badging", ["dump", "badging", apk]);
  const packageName = badging.match(/^package: name='([^']+)'/m)?.[1] ?? "";
  const permissions = dump(aapt2, apk, "permissions", ["dump", "permissions", apk]);
  const xmltree = dump(aapt2, apk, "manifest", ["dump", "xmltree", apk, "--file", "AndroidManifest.xml"]);
  const resources = dump(aapt2, apk, "resources", ["dump", "resources", apk]);
  const rulesFile = findBackupRulesPath(resources);
  const rulesDump = spawnSync(aapt2, ["dump", "xmltree", apk, "--file", rulesFile], { encoding: "utf8" });
  if (rulesDump.status !== 0) {
    console.error(rulesDump.stderr || rulesDump.stdout || `backup rules resource missing from apk (${rulesFile})`);
    process.exit(1);
  }

  const classTree = spawnSync(apkanalyzer, ["dex", "packages", "--defined-only", apk], {
    encoding: "utf8",
    maxBuffer: 32 * 1024 * 1024,
  });
  if (classTree.status !== 0) {
    console.error(classTree.stderr || classTree.stdout || `apkanalyzer dex list failed for ${apk}`);
    process.exit(1);
  }

  const apkEntries = listZipEntries(await readFile(apk));
  const errors = [
    ...evaluateApkDumps({ packageName, permissions, xmltree, rules: rulesDump.stdout }),
    ...evaluateBackupPluginClass(classTree.stdout),
    ...evaluateApkAssets(apkEntries),
  ];
  if (errors.length) {
    console.error(errors.join("\n"));
    process.exit(1);
  }
  console.log(`APK permission, asset and dex checks passed: ${apk}`);
}