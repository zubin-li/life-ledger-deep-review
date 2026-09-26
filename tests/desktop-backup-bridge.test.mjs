import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const appJs = readFileSync(new URL("../public/app.js", import.meta.url), "utf8");

test("desktop backup bridge is progressive enhancement", () => {
  assert.match(appJs, /const desktopNativeBackup = Boolean\(desktopBridge\?\.saveBackupJson && desktopBridge\?\.openBackupJson\);/);
  assert.match(appJs, /if \(!desktopNativeBackup \|\| blob\.type !== "application\/json"\) \{\s*triggerFileDownload\(blob, filename\);/);
  assert.match(appJs, /if \(!desktopNativeBackup \|\| blob\.type !== "application\/json"\)[\s\S]*showToast\(tr\("toast\.exported"\)\);/);
  assert.match(appJs, /if \(!desktopNativeBackup\) \{\s*\$\("#importFile"\)\.click\(\);/);
  assert.match(appJs, /catch \(error\) \{\s*console\.warn\("Native backup import failed", error\);/);
});
