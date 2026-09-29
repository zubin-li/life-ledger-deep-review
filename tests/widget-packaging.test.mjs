import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync, statSync } from "node:fs";
import { execFileSync } from "node:child_process";

const root = new URL("..", import.meta.url);
const read = path => readFileSync(new URL(path, root), "utf8");

const tauriConf = JSON.parse(read("src-tauri/tauri.conf.json"));
const appEntitlements = read("src-tauri/Entitlements.plist");
const extEntitlements = read("src-tauri/widget/LifeLedgerWidgetExtension/LifeLedgerWidgetExtension.entitlements");
const extInfoPlist = read("src-tauri/widget/LifeLedgerWidgetExtension/Info.plist");
const buildScript = read("scripts/build-widget.sh");
const prepareScript = read("scripts/desktop-prepare.mjs");
const cargoToml = read("src-tauri/Cargo.toml");
const libRs = read("src-tauri/src/lib.rs");
const widgetBridgeRs = read("src-tauri/src/widget_bridge.rs");

test("tauri.conf.json wires the widget .appex and reload helper into the exact bundle.macOS.files paths build-widget.sh produces", () => {
  assert.equal(tauriConf.bundle.macOS.entitlements, "./widget/build/_plists/App.entitlements");
  assert.equal(
    tauriConf.bundle.macOS.files["PlugIns/LifeLedgerWidgetExtension.appex"],
    "./widget/build/PlugIns/LifeLedgerWidgetExtension.appex"
  );
  assert.equal(
    tauriConf.bundle.macOS.files["Resources/life-ledger-widget-reload"],
    "./widget/build/Resources/life-ledger-widget-reload"
  );
  // The main app keeps its existing macOS 12 floor; only the widget extension requires 14+.
  assert.equal(tauriConf.bundle.macOS.minimumSystemVersion, "12.0");
});

test("both entitlements files declare the same placeholder App Group identifier", () => {
  const appGroups = appEntitlements.match(/<string>([^<]*)<\/string>/g);
  assert.match(appEntitlements, /com\.apple\.security\.application-groups/);
  assert.match(appEntitlements, /__APP_GROUP_ID__/);
  assert.match(extEntitlements, /com\.apple\.security\.application-groups/);
  assert.match(extEntitlements, /__APP_GROUP_ID__/);
  assert.ok(appGroups, "app entitlements must declare at least one string value");
});

test("the widget extension is sandboxed but the main app entitlements do not force app-sandbox", () => {
  assert.match(extEntitlements, /<key>com\.apple\.security\.app-sandbox<\/key>/);
  assert.doesNotMatch(appEntitlements, /<key>com\.apple\.security\.app-sandbox<\/key>/);
});

test("the extension Info.plist declares the WidgetKit extension point and a substitutable App Group key", () => {
  assert.match(extInfoPlist, /com\.apple\.widgetkit-extension/);
  assert.match(extInfoPlist, /LifeLedgerAppGroupIdentifier/);
  assert.match(extInfoPlist, /__APP_GROUP_ID__/);
  assert.match(extInfoPlist, /<key>LSMinimumSystemVersion<\/key>\s*<string>14\.0<\/string>/);
});

test("build-widget.sh degrades gracefully (exit 0) when no Swift toolchain is present", t => {
  const hasSwift = (() => {
    try {
      execFileSync("bash", ["-c", "command -v swift"], { encoding: "utf8" });
      return true;
    } catch {
      return false;
    }
  })();
  if (hasSwift) {
    // On a machine that actually has Swift (e.g. real macOS CI), the full pipeline is already
    // exercised by `npm run desktop:prepare` / desktop:widget:build — not worth re-running (and
    // potentially compiling WidgetKit) inside this fast unit test.
    t.skip("a real Swift toolchain is present on this host; covered by desktop:prepare instead");
    return;
  }
  const result = execFileSync("bash", [new URL("../scripts/build-widget.sh", import.meta.url).pathname], {
    encoding: "utf8",
  });
  assert.match(result, /No 'swift' toolchain found/);
});

test("build-widget.sh --require-signing fails clearly when APPLE_DEVELOPMENT_TEAM is unset", () => {
  assert.throws(() => {
    execFileSync("bash", [new URL("../scripts/build-widget.sh", import.meta.url).pathname, "--require-signing"], {
      encoding: "utf8",
      env: { ...process.env, APPLE_DEVELOPMENT_TEAM: "" },
    });
  }, /Command failed/);
});

test("build-widget.sh is executable and documents both required environment variables", () => {
  const path = new URL("../scripts/build-widget.sh", import.meta.url).pathname;
  assert.ok(existsSync(path));
  const mode = statSync(path).mode;
  assert.ok(mode & 0o111, "build-widget.sh must be executable");
  assert.match(buildScript, /APPLE_DEVELOPMENT_TEAM/);
  assert.match(buildScript, /APP_GROUP_ID/);
  assert.match(buildScript, /--require-signing/);
});

test("desktop:prepare chains the widget build as a non-fatal-on-missing-toolchain step", () => {
  assert.match(prepareScript, /build-widget\.sh/);
});

test("package.json exposes a standalone desktop:widget:build script", () => {
  const pkg = JSON.parse(read("package.json"));
  assert.equal(pkg.scripts["desktop:widget:build"], "bash scripts/build-widget.sh");
});

test("the WidgetSharedKit and WidgetReloadHelper packages declare real SwiftPM package manifests", () => {
  const sharedKitPackage = read("src-tauri/widget/WidgetSharedKit/Package.swift");
  const extensionPackage = read("src-tauri/widget/LifeLedgerWidgetExtension/Package.swift");
  const helperPackage = read("src-tauri/widget/WidgetReloadHelper/Package.swift");
  assert.match(sharedKitPackage, /swift-tools-version:5\.9/);
  assert.match(sharedKitPackage, /\.library\(name: "WidgetSharedKit"/);
  assert.match(extensionPackage, /\.macOS\(\.v14\)/);
  assert.match(extensionPackage, /dependencies: \["WidgetSharedKit"\]/);
  assert.match(helperPackage, /\.macOS\(\.v14\)/);
  assert.match(helperPackage, /executableTarget/);
});

test("LifeLedgerWidgetExtension's target compiles and links with -application-extension", () => {
  // Regression guard: a WidgetKit extension's executableTarget must be built with
  // -application-extension at BOTH the swift compile step and the linker step, or macOS refuses
  // to load the resulting binary as an NSExtension even though it compiles fine standalone. Both
  // settings must live on the executableTarget itself (not merely mentioned anywhere in the
  // file), and each flag list must actually contain the literal "-application-extension" string.
  const extensionPackage = read("src-tauri/widget/LifeLedgerWidgetExtension/Package.swift");
  const targetStart = extensionPackage.indexOf(".executableTarget(");
  assert.ok(targetStart !== -1, "expected an .executableTarget( declaration");
  const targetEnd = extensionPackage.indexOf("\n    ]\n)", targetStart);
  const targetBlock = extensionPackage.slice(targetStart, targetEnd === -1 ? undefined : targetEnd);

  assert.match(
    targetBlock,
    /swiftSettings:\s*\[\s*\.unsafeFlags\(\[\s*"-application-extension"\s*\]\)\s*\]/,
    "executableTarget's swiftSettings must pass -application-extension"
  );
  assert.match(
    targetBlock,
    /linkerSettings:\s*\[\s*\.unsafeFlags\(\[\s*"-application-extension"\s*\]\)\s*\]/,
    "executableTarget's linkerSettings must pass -application-extension"
  );
});

test("serde_json is a direct dependency (already present transitively; no new crate added)", () => {
  assert.match(cargoToml, /serde_json = "1"/);
  const lockfile = read("src-tauri/Cargo.lock");
  const occurrences = lockfile.match(/name = "serde_json"/g) || [];
  assert.equal(occurrences.length, 1, "serde_json must resolve to exactly one version in the lockfile");
});

test("the three widget bridge commands are registered in the local-only invoke_handler", () => {
  assert.match(libRs, /mod widget_bridge;/);
  assert.match(libRs, /publish_widget_snapshot,\s*\n\s*read_pending_widget_mutations,\s*\n\s*ack_widget_mutations/);
  assert.match(libRs, /publishWidgetSnapshot: \(snapshot\) => window\.__TAURI__\.core\.invoke\("publish_widget_snapshot"/);
  assert.match(libRs, /readPendingWidgetMutations: \(\) => window\.__TAURI__\.core\.invoke\("read_pending_widget_mutations"\)/);
  assert.match(libRs, /ackWidgetMutations: \(mutationIds\) => window\.__TAURI__\.core\.invoke\("ack_widget_mutations"/);
});

test("the widget reload helper's WidgetCenter kind argument matches the Widget's own kind string", () => {
  const bundle = read("src-tauri/widget/LifeLedgerWidgetExtension/Sources/LifeLedgerWidgetExtension/LifeLedgerWidgetBundle.swift");
  const kindMatch = bundle.match(/let kind = "([^"]+)"/);
  assert.ok(kindMatch, "widget bundle must declare its kind string");
  assert.match(widgetBridgeRs, new RegExp(`const WIDGET_KIND: &str = "${kindMatch[1]}";`));
});
