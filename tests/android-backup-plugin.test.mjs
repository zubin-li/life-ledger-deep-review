import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const plugin = readFileSync(new URL("../src-tauri/android/src/main/java/BackupPlugin.kt", import.meta.url), "utf8");
const mobileRs = readFileSync(new URL("../src-tauri/src/mobile/backup.rs", import.meta.url), "utf8");
const capability = JSON.parse(readFileSync(new URL("../src-tauri/capabilities/android-local.json", import.meta.url), "utf8"));

test("android backup plugin uses SAF create/open document intents", () => {
  assert.match(plugin, /Intent\.ACTION_CREATE_DOCUMENT/);
  assert.match(plugin, /Intent\.ACTION_OPEN_DOCUMENT/);
  assert.match(plugin, /"application\/json"/);
  assert.match(plugin, /"text\/plain"/);
  assert.doesNotMatch(plugin, /READ_EXTERNAL_STORAGE|WRITE_EXTERNAL_STORAGE/);
  assert.match(plugin, /openFileDescriptor/);
  assert.match(plugin, /BufferedOutputStream/);
  assert.match(plugin, /BufferedInputStream/);
  assert.match(plugin, /ioExecutor\.execute\s*\{\s*try\s*\{\s*val displayName = queryDisplayName/s);
  assert.match(plugin, /flushError/);
});

test("mobile backup commands and capabilities stay android-scoped", () => {
  assert.match(mobileRs, /register_android_plugin\(PLUGIN_CLASS, "BackupPlugin"\)/);
  assert.match(mobileRs, /app\.zubinli\.lifeledger\.androidtest\.backup/);
  assert.match(mobileRs, /android_pick_import/);
  assert.ok(capability.permissions.includes("allow-android-pick-import"));
  assert.ok(capability.permissions.includes("allow-android-backup-open-write"));
  assert.doesNotMatch(readFileSync(new URL("../src-tauri/capabilities/local-only.json", import.meta.url), "utf8"), /allow-android/);
});