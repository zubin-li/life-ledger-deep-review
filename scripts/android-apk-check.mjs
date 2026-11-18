import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { evaluateApkDumps } from "./android-manifest.mjs";

export function findBackupRulesPath(resourcesDump) {
  const block = resourcesDump.match(/xml/life_ledger_backup_rules[\s\S]{0,300}?\(file\)\s+(\S+)/);
  return block ? block[1] : "res/xml/life_ledger_backup_rules.xml";
}

function dump(aapt2, apk, label, args) {
  const result = spawnSync(aapt2, args, { encoding: "utf8" });
  if (result.status !== 0) {
    console.error(`${label} dump failed: ${result.stderr || result.stdout || aapt2}`);
    process.exit(1);
  }
  return result.stdout;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const apk = process.argv[2];
  const aapt2 = process.argv[3];
  if (!apk || !aapt2) {
    console.error("usage: android-apk-check.mjs <apk> <aapt2>");
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

  const errors = evaluateApkDumps({ packageName, permissions, xmltree, rules: rulesDump.stdout });
  if (errors.length) {
    console.error(errors.join("\n"));
    process.exit(1);
  }
  console.log(`APK permission check passed: ${apk}`);
}
