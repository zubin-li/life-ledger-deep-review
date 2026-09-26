import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const workflow = readFileSync(new URL("../.github/workflows/macos-desktop.yml", import.meta.url), "utf8");

test("macOS desktop workflow targets GitHub-hosted Apple Silicon and required gates", () => {
  assert.match(workflow, /workflow_dispatch:/);
  assert.match(workflow, /pull_request:/);
  assert.match(workflow, /runs-on: macos-14/);
  assert.match(workflow, /timeout-minutes:\s*60/);
  assert.match(workflow, /npm test/);
  assert.match(workflow, /npm run desktop:check/);
  assert.match(workflow, /cargo test --manifest-path src-tauri\/Cargo\.toml/);
  assert.match(workflow, /npm run desktop:build/);
});

test("workflow uploads dmg and zipped app artifacts", () => {
  assert.match(workflow, /bundle\/dmg\/\*\.dmg/);
  assert.match(workflow, /Life-Ledger-Deep-Review\.app\.zip/);
  assert.match(workflow, /actions\/upload-artifact@v4/);
});
