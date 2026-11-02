import { readFileSync } from "node:fs";
import test from "node:test";
import assert from "node:assert/strict";

test("review money panel uses scatter grid and insight stack markup", () => {
  const app = readFileSync(new URL("../public/app.js", import.meta.url), "utf8");
  assert.match(app, /class="review-scatter-grid"/);
  assert.match(app, /class="review-ledger-insights"/);
  assert.match(app, /class="review-ledger-insight-kicker"/);
  const css = readFileSync(new URL("../public/v219-review-scatter-grid.css", import.meta.url), "utf8");
  assert.match(css, /grid-template-columns: repeat\(3/);
  const mobile = readFileSync(new URL("../public/v220-review-mobile.css", import.meta.url), "utf8");
  assert.match(mobile, /max-width: 959px/);
  assert.match(mobile, /review-ledger-insight-kicker/);
});
