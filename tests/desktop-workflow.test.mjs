import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const workflow = readFileSync(new URL("../.github/workflows/macos-desktop.yml", import.meta.url), "utf8");
const releaseWorkflow = readFileSync(new URL("../.github/workflows/release.yml", import.meta.url), "utf8");
const tauriConf = JSON.parse(readFileSync(new URL("../src-tauri/tauri.conf.json", import.meta.url), "utf8"));

test("macOS desktop workflow targets GitHub-hosted Apple Silicon and required gates", () => {
  assert.match(workflow, /workflow_dispatch:/);
  assert.match(workflow, /pull_request:/);
  assert.match(workflow, /runs-on: macos-15/);
  assert.match(workflow, /timeout-minutes:\s*60/);
  assert.match(workflow, /npm test/);
  assert.match(workflow, /npm run desktop:check/);
  assert.match(workflow, /cargo test --manifest-path src-tauri\/Cargo\.toml/);
  assert.match(workflow, /npm run desktop:build/);
});

test("desktop workflow watches all public assets and zips the configured product bundle", () => {
  assert.match(workflow, /- "public\/\*\*"/);
  assert.doesNotMatch(workflow, /Life Ledger Deep Review\.app/);
  assert.match(workflow, /TAURI_PRODUCT_NAME: Life Ledger/);
  assert.match(workflow, /\$\{TAURI_PRODUCT_NAME\}\.app/);
  assert.match(workflow, /Life-Ledger\.app\.zip/);
  assert.match(workflow, /bundle\/dmg\/\*\.dmg/);
  assert.match(workflow, /actions\/upload-artifact@v4/);
  assert.equal(tauriConf.productName, "Life Ledger");
});

test("release workflow builds macOS artifacts on macos-15 before attaching them to the GitHub release", () => {
  assert.match(releaseWorkflow, /macos-artifacts:[\s\S]*runs-on: macos-15/);
  assert.match(releaseWorkflow, /needs:\s*verify/);
  assert.match(releaseWorkflow, /macos-artifacts:/);
  assert.match(releaseWorkflow, /needs: \[verify, macos-artifacts\]/);
  assert.match(releaseWorkflow, /download-artifact@v4/);
  assert.match(releaseWorkflow, /gh release create/);
  assert.match(releaseWorkflow, /release-assets\/\*\.dmg/);
  assert.match(releaseWorkflow, /release-assets\/\*\.zip/);
  assert.match(releaseWorkflow, /npm run desktop:build/);
});
