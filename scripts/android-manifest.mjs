import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const ANDROID_TEST_ID = "app.zubinli.lifeledger.androidtest";

export const REQUIRED_PERMISSIONS = [
  "android.permission.INTERNET",
];

export const FORBIDDEN_PERMISSIONS = [
  "android.permission.READ_EXTERNAL_STORAGE",
  "android.permission.WRITE_EXTERNAL_STORAGE",
  "android.permission.MANAGE_EXTERNAL_STORAGE",
  "android.permission.READ_MEDIA_IMAGES",
  "android.permission.READ_MEDIA_VIDEO",
  "android.permission.READ_MEDIA_AUDIO",
  "android.permission.READ_MEDIA_VISUAL_USER_SELECTED",
];

export const BACKUP_RULES_XML = `<?xml version="1.0" encoding="utf-8"?>
<data-extraction-rules>
    <cloud-backup>
        <exclude domain="root" />
        <exclude domain="file" />
        <exclude domain="database" />
        <exclude domain="sharedpref" />
        <exclude domain="external" />
    </cloud-backup>
    <device-transfer>
        <exclude domain="root" />
        <exclude domain="file" />
        <exclude domain="database" />
        <exclude domain="sharedpref" />
        <exclude domain="external" />
    </device-transfer>
</data-extraction-rules>
`;

const BACKUP_ATTRS = [
  ["android:allowBackup", "false"],
  ["android:fullBackupContent", "false"],
  ["android:dataExtractionRules", "@xml/life_ledger_backup_rules"],
  ["android:enableOnBackInvokedCallback", "true"],
];

function setAttr(attrs, name, value) {
  const normalized = attrs.trimEnd();
  const pattern = new RegExp(`\\s${name.replace(":", "\\:")}="[^"]*"`);
  if (pattern.test(normalized)) return normalized.replace(pattern, ` ${name}="${value}"`);
  return `${normalized} ${name}="${value}"`;
}

function stripPermission(xml, name) {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const patterns = [
    new RegExp(`[ \\t]*<uses-permission\\b[^>]*android:name="${escaped}"[^>]*/>\\s*`, "g"),
    new RegExp(`[ \\t]*<uses-permission\\b[^>]*android:name="${escaped}"[^>]*>\\s*</uses-permission>\\s*`, "g"),
  ];
  return patterns.reduce((current, pattern) => current.replace(pattern, ""), xml);
}

const TOOLS_NAMESPACE = "http://schemas.android.com/tools";

function addPermissionEntries(xml) {
  let next = xml.replace(/<manifest\b([^>]*)>/, (full, attrs) => {
    if (/\bxmlns:tools=/.test(attrs)) return full;
    return `<manifest${attrs} xmlns:tools="${TOOLS_NAMESPACE}">`;
  });
  const required = REQUIRED_PERMISSIONS.map(
    (name) => `    <uses-permission android:name="${name}" />`,
  );
  const removals = FORBIDDEN_PERMISSIONS.map(
    (name) => `    <uses-permission android:name="${name}" tools:node="remove" />`,
  );
  const block = [...required, ...removals].join("\n");
  return next.replace(/(<manifest\b[^>]*>)/, `$1\n${block}`);
}

export function patchManifest(xml) {
  let next = [...REQUIRED_PERMISSIONS, ...FORBIDDEN_PERMISSIONS].reduce(stripPermission, xml);
  next = addPermissionEntries(next);
  if (!/<application\b/.test(next)) throw new Error("manifest has no application tag");
  next = next.replace(/<application\b([^>]*?)(\/?)>/g, (_full, attrs, slash) => {
    let updated = attrs.replace(/\s*\/\s*$/, "");
    for (const [name, value] of BACKUP_ATTRS) updated = setAttr(updated, name, value);
    return `<application${updated}${slash}>`;
  });
  for (const name of REQUIRED_PERMISSIONS) {
    const entry = `<uses-permission android:name="${name}" />`;
    if (!next.includes(entry)) throw new Error(`required permission missing: ${name}`);
    if (next.includes(`android:name="${name}" tools:node="remove"`)) {
      throw new Error(`required permission must not be removed: ${name}`);
    }
  }
  for (const name of FORBIDDEN_PERMISSIONS) {
    const marker = `<uses-permission android:name="${name}" tools:node="remove" />`;
    if (!next.includes(marker)) throw new Error(`permission removal marker missing: ${name}`);
  }
  if (!next.includes('android:allowBackup="false"')) throw new Error("allowBackup was not disabled");
  if (!next.includes('android:fullBackupContent="false"')) throw new Error("full backup was not disabled");
  if (!next.includes('android:dataExtractionRules="@xml/life_ledger_backup_rules"')) {
    throw new Error("device transfer rules were not set");
  }
  if (!next.includes('android:enableOnBackInvokedCallback="true"')) {
    throw new Error("predictive back callback was not enabled");
  }
  return next;
}

async function manifestPaths(projectRoot) {
  const found = [];
  async function walk(dir) {
    const entries = await readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name === "build" || entry.name === ".gradle") continue;
      const path = join(dir, entry.name);
      if (entry.isDirectory()) await walk(path);
      else if (entry.name === "AndroidManifest.xml") found.push(path);
    }
  }
  await walk(projectRoot);
  found.sort();
  return found;
}

export async function patchProject(projectRoot) {
  const manifests = await manifestPaths(projectRoot);
  if (!manifests.length) throw new Error(`no AndroidManifest.xml under ${projectRoot}`);
  for (const path of manifests) {
    const patched = patchManifest(await readFile(path, "utf8"));
    await writeFile(path, patched);
  }
  const rulesPath = join(projectRoot, "app/src/main/res/xml/life_ledger_backup_rules.xml");
  await mkdir(dirname(rulesPath), { recursive: true });
  await writeFile(rulesPath, BACKUP_RULES_XML);
  return manifests;
}

function flagIsFalse(dump, attribute) {
  const escaped = attribute.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const patterns = [
    new RegExp(`${escaped}\\([^)]*\\)=\\(type 0x12\\)0x0\\b`),
    new RegExp(`${escaped}\\([^)]*\\)=false\\b`),
    new RegExp(`${escaped}="false"`),
  ];
  return patterns.some((pattern) => pattern.test(dump));
}

export function evaluateApkDumps({ packageName, permissions, xmltree, rules }) {
  const errors = [];
  if (packageName.trim() !== ANDROID_TEST_ID) errors.push(`unexpected package id: ${packageName.trim() || "missing"}`);
  const haystack = `${permissions}\n${xmltree}`;
  for (const name of REQUIRED_PERMISSIONS) {
    if (!haystack.includes(name)) errors.push(`missing required permission: ${name}`);
  }
  for (const name of FORBIDDEN_PERMISSIONS) {
    if (haystack.includes(name)) errors.push(`forbidden permission: ${name}`);
  }
  if (!flagIsFalse(xmltree, "android:allowBackup")) errors.push("android:allowBackup is not false");
  if (!flagIsFalse(xmltree, "android:fullBackupContent")) errors.push("android:fullBackupContent is not false");
  if (!/android:dataExtractionRules\(/.test(xmltree) && !xmltree.includes("life_ledger_backup_rules")) {
    errors.push("dataExtractionRules is missing");
  }
  const deviceTransferOff = /<device-transfer>/.test(rules) || /\bdevice-transfer\b/.test(rules);
  const excludesData = /<exclude[\s>]/.test(rules) || /\bE: exclude\b/.test(rules);
  if (!deviceTransferOff || !excludesData) errors.push("backup rules do not disable device transfer");
  return errors;
}

const isDirect = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isDirect) {
  const projectRoot = resolve(process.argv[2] || "src-tauri/gen/android");
  const manifests = await patchProject(projectRoot);
  console.log(`Patched ${manifests.length} Android manifest(s) and wrote backup rules.`);
}
