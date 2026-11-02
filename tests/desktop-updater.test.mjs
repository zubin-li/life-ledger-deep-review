import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const conf = JSON.parse(readFileSync(new URL("../src-tauri/tauri.conf.json", import.meta.url), "utf8"));
const lib = readFileSync(new URL("../src-tauri/src/lib.rs", import.meta.url), "utf8");
const updates = readFileSync(new URL("../src-tauri/src/updates.rs", import.meta.url), "utf8");
const workflow = readFileSync(new URL("../.github/workflows/release.yml", import.meta.url), "utf8");
const localCap = JSON.parse(readFileSync(new URL("../src-tauri/capabilities/local-only.json", import.meta.url), "utf8"));

// User 11/02: updates are offered inside the app and installed only after the user agrees.
test("in-app updates use a signed feed over https and never install silently", () => {
  const u = conf.plugins.updater;
  assert.match(u.pubkey, /^[A-Za-z0-9+/=]{100,}$/, "minisign public key (base64)");
  assert.deepEqual(u.endpoints, ["https://github.com/zubin-li/life-ledger-deep-review/releases/download/mac-updates/latest.json"]);
  assert.equal(conf.bundle.createUpdaterArtifacts, true);
  assert.ok(!JSON.stringify(conf).includes("dangerousInsecureTransportProtocol"));
  assert.match(updates, /OkCancelCustom\(install\.clone\(\), text\("later"\)/, "asks first");
  // The only other install path is the QA-only auto-accept, compiled into `--features qa` test builds, never releases.
  const released = updates.replace(/#\[cfg\(feature = "qa"\)\]\n\s*if std::env::var_os\("LL_QA_ACCEPT_UPDATE"\)[\s\S]*?\n    \}\n/, "");
  assert.notEqual(released, updates, "QA block found and excluded");
  assert.ok(released.indexOf("crate::confirmed(&answer, &install)") < released.indexOf("download_and_install"), "install only after yes");
  assert.match(lib, /\.plugin\(tauri_plugin_updater::Builder::new\(\)\.build\(\)\)/);
  assert.match(lib, /updates::schedule\(app\.handle\(\)\.clone\(\)\);/);
});

test("the update check is reachable from the menu and both windows, nothing more", () => {
  assert.ok(localCap.permissions.includes("allow-check-for-updates"));
  assert.match(lib, /\.permission\("allow-check-for-updates"\)/);
  assert.ok(!localCap.permissions.some(p => p.startsWith("updater:")), "the page cannot drive the updater directly");
});

test("release workflow signs updates from a secret and publishes the feed to mac-updates", () => {
  assert.match(workflow, /TAURI_SIGNING_PRIVATE_KEY: \$\{\{ secrets\.TAURI_SIGNING_PRIVATE_KEY \}\}/);
  assert.match(workflow, /gh release upload mac-updates \*\.app\.tar\.gz \*\.app\.tar\.gz\.sig latest\.json --clobber/);
});
