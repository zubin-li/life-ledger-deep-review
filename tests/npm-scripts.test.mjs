import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

test("npm test excludes Playwright browser suites", () => {
  const pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));
  assert.match(pkg.scripts.test, /!\(\*\.browser\)/);
  assert.match(pkg.scripts["test:browser"], /\.browser\.test\.mjs/);
});
