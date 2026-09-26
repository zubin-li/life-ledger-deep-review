import test from "node:test";
import assert from "node:assert/strict";
import { validateCloudUrl } from "../desktop/url-validation.js";

test("accepts https and localhost http", () => {
  assert.equal(validateCloudUrl("https://example.com").ok, true);
  assert.equal(validateCloudUrl("http://localhost:8787").ok, true);
  assert.equal(validateCloudUrl("http://127.0.0.1:3000/path").ok, true);
});

test("rejects invalid cloud urls", () => {
  assert.equal(validateCloudUrl("http://example.com").ok, false);
  assert.equal(validateCloudUrl("javascript:alert(1)").ok, false);
  assert.equal(validateCloudUrl("data:text/plain,hi").ok, false);
  assert.equal(validateCloudUrl("https://user:pass@example.com").ok, false);
  assert.equal(validateCloudUrl("not a url").ok, false);
});
