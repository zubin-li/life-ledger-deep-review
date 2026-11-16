import test from "node:test";
import assert from "node:assert/strict";
import { hasPlaywright, resolvePlaywrightRoot } from "./playwright-resolve.mjs";

test("playwright resolve prefers repo node_modules when present", () => {
  const root = resolvePlaywrightRoot();
  if (hasPlaywright) {
    assert.ok(root);
    assert.match(root, /playwright$/);
  } else {
    assert.equal(root, null);
  }
});
