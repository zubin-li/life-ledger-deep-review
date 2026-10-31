import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const appJs = readFileSync(new URL("../public/app.js", import.meta.url), "utf8");
const libRs = readFileSync(new URL("../src-tauri/src/lib.rs", import.meta.url), "utf8");

test("desktop backup bridge is progressive enhancement", () => {
  assert.match(appJs, /const desktopNativeBackup = Boolean\([\s\S]*saveBackupBinary[\s\S]*openBackupFile/);
  assert.match(appJs, /filename\.endsWith\("\.llmedia"\)/);
  assert.match(appJs, /desktopBridge\.saveBackupBinary/);
  assert.match(appJs, /desktopBridge\.openBackupFile/);
  assert.match(appJs, /if \(!desktopNativeBackup\) \{\s*\$\("#importFile"\)\.click\(\);/);
  assert.match(appJs, /backup-cancelled/);
});

test("native open payload framing round-trips filename and bytes", () => {
  const decodeSource = appJs.slice(
    appJs.indexOf("function decodeNativeOpenBackupPayload"),
    appJs.indexOf("async function saveBackupBlob"),
  );
  const context = { TextDecoder, File, payload: null, decoded: null };
  vm.createContext(context);
  vm.runInContext(`${decodeSource}\nthis.decode = decodeNativeOpenBackupPayload;`, context);
  const name = "life-ledger-media-2026-10.llmedia";
  const payload = new Uint8Array([1, name.length & 255, name.length >> 8, ...new TextEncoder().encode(name), 0x4c, 0x46]);
  context.payload = payload.buffer;
  const decoded = vm.runInContext("decode(payload)", context);
  assert.equal(decoded.name, name);
  assert.equal(decoded.file.name, name);
  assert.equal(decoded.file.type, "application/x-life-ledger-media");
});

test("local bridge exposes json and binary backup commands", () => {
  assert.match(libRs, /save_backup_binary/);
  assert.match(libRs, /open_backup_file/);
  assert.match(libRs, /saveBackupBinary:/);
  assert.match(libRs, /openBackupFile:/);
});

test("binary backup commands stay on the local capability only", () => {
  const localCapability = JSON.parse(readFileSync(new URL("../src-tauri/capabilities/local-only.json", import.meta.url), "utf8"));
  const defaultCapability = JSON.parse(readFileSync(new URL("../src-tauri/capabilities/default.json", import.meta.url), "utf8"));
  assert.ok(localCapability.permissions.includes("allow-save-backup-binary"));
  assert.ok(localCapability.permissions.includes("allow-open-backup-file"));
  assert.ok(!defaultCapability.permissions?.includes("allow-save-backup-binary"));
});

test("rust backup validation rejects oversize export and unknown import extensions in source", () => {
  const jsonSaveStart = libRs.indexOf("fn save_backup_json");
  const jsonSaveBlock = libRs.slice(jsonSaveStart, libRs.indexOf("fn sanitize_llmedia_filename", jsonSaveStart));
  assert.match(jsonSaveBlock, /validate_json_export_length\(payload\.contents\.len\(\)\)\?;/);
  assert.match(jsonSaveBlock, /validate_json_export_length[\s\S]*rfd::FileDialog::new\(\)/);
  const saveStart = libRs.indexOf("fn save_backup_binary");
  const saveBlock = libRs.slice(saveStart, libRs.indexOf("#[derive(serde::Serialize)]", saveStart));
  assert.match(saveBlock, /validate_binary_export_body\(&bytes\)\?;/);
  assert.match(saveBlock, /validate_binary_export_body\(&bytes\)\?[\s\S]*rfd::FileDialog::new\(\)/);
  assert.match(libRs, /fn validate_binary_export_body\(bytes: &\[u8\]\)/);
  assert.match(libRs, /Err\("file-too-large"\.to_string\(\)\)/);
  assert.match(libRs, /fn backup_import_kind\(extension: Option<&str>\)/);
  assert.match(libRs, /UNSUPPORTED_FILE_TYPE_ERROR/);
  const openStart = libRs.indexOf("fn open_backup_file");
  const openBlock = libRs.slice(openStart, openStart + 700);
  assert.match(openBlock, /backup_import_kind\(extension\)\?;/);
  assert.doesNotMatch(openBlock, /import_limit_for_extension/);
});

test("llmedia filename sanitization rejects path separators instead of stripping basenames", () => {
  const sanitizeStart = libRs.indexOf("fn sanitize_llmedia_filename");
  const sanitizeBlock = libRs.slice(sanitizeStart, libRs.indexOf("fn validate_binary_export_body", sanitizeStart));
  assert.match(sanitizeBlock, /trimmed\.contains\('\/'\)/);
  assert.match(sanitizeBlock, /trimmed\.contains\('\\\\'\)/);
  assert.doesNotMatch(sanitizeBlock, /rsplit\(\['\/', '\\\\'\]\)/);
});
