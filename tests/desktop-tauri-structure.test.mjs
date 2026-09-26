import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const mainRs = readFileSync(new URL("../src-tauri/src/main.rs", import.meta.url), "utf8");
const libRs = readFileSync(new URL("../src-tauri/src/lib.rs", import.meta.url), "utf8");
const cargoToml = readFileSync(new URL("../src-tauri/Cargo.toml", import.meta.url), "utf8");
const packageJson = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));
const prepareScript = readFileSync(new URL("../scripts/desktop-prepare.mjs", import.meta.url), "utf8");
const defaultCapability = JSON.parse(readFileSync(new URL("../src-tauri/capabilities/default.json", import.meta.url), "utf8"));
const localCapability = JSON.parse(readFileSync(new URL("../src-tauri/capabilities/local-only.json", import.meta.url), "utf8"));

test("tauri main is thin and local capability is scoped", () => {
  assert.match(mainRs, /life_ledger_desktop_lib::run\(\);/);
  assert.deepEqual(defaultCapability.windows, ["launcher"]);
  assert.deepEqual(localCapability.windows, ["local"]);
  assert.ok(!defaultCapability.windows.includes("cloud"));
  assert.ok(!localCapability.windows.includes("cloud"));
});

test("cloud url validation exists in rust and cloud window is separate", () => {
  assert.match(libRs, /fn validate_cloud_url\(raw_url: &str\)/);
  assert.match(libRs, /WebviewWindowBuilder::new\(\s*&app,\s*"cloud"/);
  assert.match(libRs, /const MAX_JSON_IMPORT_BYTES: u64 = 10 \* 1024 \* 1024;/);
});

test("tauri crate version stays aligned with the package version", () => {
  assert.match(cargoToml, new RegExp(`version = "${packageJson.version.replaceAll(".", "\\.")}"`));
});

test("desktop preparation includes every launcher module", () => {
  assert.match(prepareScript, /launcher-i18n\.js/);
  assert.match(prepareScript, /url-validation\.js/);
});
