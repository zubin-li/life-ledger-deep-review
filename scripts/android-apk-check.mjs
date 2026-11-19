import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { evaluateApkDumps } from "./android-manifest.mjs";
import { BACKUP_PLUGIN_CLASS } from "./android-prepare.mjs";

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

  const errors = [
    ...evaluateApkDumps({ packageName, permissions, xmltree, rules: rulesDump.stdout }),
    ...evaluateBackupPluginClass(classTree.stdout),
  ];
  if (errors.length) {
    console.error(errors.join("\n"));
    process.exit(1);
  }
  console.log(`APK permission and dex checks passed: ${apk}`);
}