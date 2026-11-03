import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
require("../public/interaction.js");
const { flipDelta, captureFlip, navViewDirection, NAV_VIEW_ORDER, withViewTransition } = globalThis.LifeLedgerInteraction;

test("flipDelta returns invert translate for moved rects", () => {
  const prev = { x: 100, y: 200, width: 80, height: 24 };
  const next = { x: 100, y: 260, width: 80, height: 24 };
  const invert = flipDelta(prev, next);
  assert.equal(invert.x, 0);
  assert.equal(invert.y, -60);
});

test("captureFlip is exported and returns a function", () => {
  assert.equal(typeof captureFlip, "function");
  const noop = captureFlip(null, ".x");
  assert.equal(typeof noop, "function");
  noop();
});

test("ledger-ui wires captureFlip for day group expand", () => {
  const ledgerUi = fs.readFileSync(new URL("../public/ledger-ui.js", import.meta.url), "utf8");
  assert.match(ledgerUi, /captureFlip/);
  assert.match(ledgerUi, /ledger-tx-list--grouped/);
  assert.match(ledgerUi, /data-ledger-day-group/);
});

test("v210 styles ledger day FLIP play state", () => {
  const css = fs.readFileSync(new URL("../public/v210.css", import.meta.url), "utf8");
  assert.match(css, /\.ledger-day-group\.ll-flip-play/);
  assert.match(css, /ledgerDayRowsReveal/);
});

test("navViewDirection follows sidebar order including ledger", () => {
  assert.deepEqual(NAV_VIEW_ORDER, ["today", "week", "longrange", "timeline", "ledger", "review", "habits"]);
  assert.equal(navViewDirection("timeline", "ledger"), 1);
  assert.equal(navViewDirection("ledger", "timeline"), -1);
  assert.equal(navViewDirection("today", "today"), 0);
});

test("withViewTransition runs commit when API missing", () => {
  let n = 0;
  return withViewTransition(() => { n += 1; }, { from: "today", to: "week" }).then(() => {
    assert.equal(n, 1);
  });
});

test("switchToView uses withViewTransition when changing pages", () => {
  const app = fs.readFileSync(new URL("../public/app.js", import.meta.url), "utf8");
  assert.match(app, /LifeLedgerInteraction\?\.withViewTransition/);
  assert.match(app, /from: previous, to: view/);
});

test("v210 defines main view transition names", () => {
  const css = fs.readFileSync(new URL("../public/v210.css", import.meta.url), "utf8");
  assert.match(css, /html\.ll-view-transition \.view\.active[\s\S]*view-transition-name: ll-main-view/);
  assert.match(css, /ll-vt-in-forward/);
});
