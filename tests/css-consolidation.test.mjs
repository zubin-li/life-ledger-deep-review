import { readFileSync, existsSync } from "node:fs";
import test from "node:test";
import assert from "node:assert/strict";

const index = readFileSync(new URL("../public/index.html", import.meta.url), "utf8");
const v210Links = [...index.matchAll(/href="\.\/v210\.css/g)];
const splitV21Links = [...index.matchAll(/href="\.\/v21[1-9][^"]*\.css/g)];

test("2.1 styles load from consolidated v210.css only", () => {
  assert.equal(v210Links.length, 1, "expected exactly one v210.css link");
  assert.equal(splitV21Links.length, 0, "v211+ split stylesheets should be removed from index.html");
});

test("legacy v211–v232 stylesheets are removed from public/", () => {
  for (const name of [
    "v211-polish.css",
    "v232-ledger-entry-feedback.css",
    "v231-review-ledger-retarget.css",
  ]) {
    assert.ok(!existsSync(new URL(`../public/${name}`, import.meta.url)), `${name} should be merged into v210.css`);
  }
});

test("v210.css is the last stylesheet in index.html", () => {
  const links = [...index.matchAll(/<link rel="stylesheet" href="\.\/([^"]+)"/g)].map(m => m[1]);
  assert.ok(links.length >= 2);
  assert.equal(links[links.length - 1], "v210.css?v=2.1.0");
  const polishIdx = links.indexOf("pages-polish.css?v=2.1.0");
  const v210Idx = links.indexOf("v210.css?v=2.1.0");
  assert.ok(polishIdx >= 0 && v210Idx > polishIdx, "pages-polish.css must load before v210.css");
});
