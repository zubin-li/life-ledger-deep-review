import { readFileSync } from "node:fs";
import test from "node:test";
import assert from "node:assert/strict";

test("review money panel uses scatter grid and insight stack markup", () => {
  const app = readFileSync(new URL("../public/app.js", import.meta.url), "utf8");
  assert.match(app, /class="review-scatter-grid is-retargeting"/);
  assert.match(app, /class="review-ledger-insights is-retargeting"/);
  assert.match(app, /class="review-ledger-insight-kicker"/);
  assert.match(app, /class="review-scatter-jump"/);
  assert.match(app, /id="review-scatter-mood"/);
  assert.match(app, /data-review-scatter-jump/);
  const css = readFileSync(new URL("../public/v210.css", import.meta.url), "utf8");
  assert.match(css, /grid-template-columns: repeat\(3/);
  assert.match(css, /max-width: 959px/);
  assert.match(css, /review-ledger-insight-kicker/);
  assert.match(css, /review-scatter-jump-chip/);
  assert.match(css, /scroll-margin-top/);
  assert.match(css, /review-scatter-jump-chip\.is-active/);
  assert.match(app, /bindReviewScatterJumpSpy/);
  assert.match(app, /IntersectionObserver/);
});
