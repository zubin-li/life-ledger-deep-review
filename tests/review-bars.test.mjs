import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const code = fs.readFileSync(new URL("../public/review-bars.js", import.meta.url), "utf8");
const root = { document: { documentElement: { classList: { contains: () => false } } }, matchMedia: () => ({ matches: false }) };
vm.runInNewContext(code, { window: root, globalThis: root });
const RB = root.LifeLedgerReviewBars;

test("rollPanelTextValues rolls when stored value changes", () => {
  const dataset = {};
  const cells = [{ textContent: "72%" }, { textContent: "—" }];
  const scope = {
    get dataset() {
      return dataset;
    },
    querySelectorAll() {
      return cells;
    },
  };
  const rolled = [];
  const rollText = (el, next, prev) => rolled.push({ next, prev });
  RB.rollPanelTextValues(scope, "strong", "rvWd", rollText);
  assert.equal(rolled.length, 0);
  assert.equal(dataset["rvWd-0"], "72%");
  cells[0].textContent = "81%";
  RB.rollPanelTextValues(scope, "strong", "rvWd", rollText);
  assert.equal(rolled.length, 1);
  assert.deepEqual(rolled[0], { next: "81%", prev: "72%" });
});
