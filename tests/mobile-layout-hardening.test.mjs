import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const pages858 = readFileSync(new URL("../public/pages-858.css", import.meta.url), "utf8");
const v210 = readFileSync(new URL("../public/v210.css", import.meta.url), "utf8");
const html = readFileSync(new URL("../public/index.html", import.meta.url), "utf8");

test("Review table keeps semantic cells without flex on tbody th", () => {
  assert.doesNotMatch(pages858, /#reviewView \.rv-table tbody th \{ display: flex/);
  assert.doesNotMatch(pages858, /#reviewView \.rv-table td:nth-child\(3\) \{ display: flex/);
  assert.match(pages858, /#reviewView \.rv-table \{ table-layout: fixed/);
  assert.match(pages858, /#reviewView \.rv-table \.rv-spark-cell/);
});

test("mobile shell hardening uses clip not page-level scroll mask regressions", () => {
  assert.match(v210, /Mobile layout hardening/);
  assert.match(v210, /overflow-x: clip/);
  assert.match(v210, /min-height: 100dvh/);
  assert.match(v210, /pointer: coarse/);
});

test("viewport-fit cover is declared", () => {
  assert.match(html, /viewport-fit=cover/);
});

test("mobile nav labels allow two-line wrap", () => {
  assert.match(pages858, /-webkit-line-clamp: 2/);
  assert.match(pages858, /min-height: 48px/);
});