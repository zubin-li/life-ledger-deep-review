import { spawnSync } from "node:child_process";
import { evaluateApkDumps } from "./android-manifest.mjs";

const apk = process.argv[2];
const aapt = process.argv[3];
if (!apk || !aapt) {
  console.error("usage: android-apk-check.mjs <apk> <aapt>");
  process.exit(2);
}

function dump(args) {
  const result = spawnSync(aapt, args, { encoding: "utf8" });
  if (result.status !== 0) {
    console.error(result.stderr || result.stdout || `${aapt} failed`);
    process.exit(1);
  }
  return result.stdout;
}

const permissions = dump(["dump", "permissions", apk]);
const xmltree = dump(["dump", "xmltree", apk, "AndroidManifest.xml"]);
const rulesDump = spawnSync(aapt, ["dump", "xmltree", apk, "res/xml/life_ledger_backup_rules.xml"], { encoding: "utf8" });
if (rulesDump.status !== 0) {
  console.error(rulesDump.stderr || rulesDump.stdout || "backup rules resource missing from apk");
  process.exit(1);
}

const errors = evaluateApkDumps({ permissions, xmltree, rules: rulesDump.stdout });
if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}
console.log(`APK permission check passed: ${apk}`);
