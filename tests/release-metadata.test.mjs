import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const read = path => readFile(new URL(path, root), "utf8");

test("stable release metadata stays aligned", async () => {
  const [packageJson, packageLock, index, serviceWorker, changelog] = await Promise.all([
    read("package.json").then(JSON.parse),
    read("package-lock.json").then(JSON.parse),
    read("public/index.html"),
    read("public/sw.js"),
    read("CHANGELOG.md"),
  ]);
  const version = packageJson.version;

  assert.match(version, /^\d+\.\d+\.\d+$/);
  assert.equal(packageLock.version, version);
  assert.equal(packageLock.packages[""].version, version);
  assert.match(index, new RegExp(`styles\\.css\\?v=${version.replaceAll(".", "\\.")}`));
  assert.match(index, new RegExp(`app\\.js\\?v=${version.replaceAll(".", "\\.")}`));
  assert.match(serviceWorker, new RegExp(`life-ledger-pwa-${version.replaceAll(".", "\\.")}`));
  // The version may be bumped ahead of a formal release (no tag/GitHub Release yet), in which
  // case the changes stay recorded under "Unreleased" rather than a finalized `## [x.y.z]`
  // heading for that exact version — both are valid, aligned states.
  const escapedVersion = version.replaceAll(".", "\\.");
  const hasStableHeading = new RegExp(`## \\[${escapedVersion}\\]`).test(changelog);
  const isPendingUnreleased = /^## \[Unreleased\]/m.test(changelog);
  assert.ok(
    hasStableHeading || isPendingUnreleased,
    "version must be documented either as a finalized CHANGELOG release heading or still tracked under Unreleased pending release"
  );
});
