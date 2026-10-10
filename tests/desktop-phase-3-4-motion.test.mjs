import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import vm from "node:vm";

const root = new URL("../", import.meta.url);
const read = path => readFileSync(new URL(path, root), "utf8");
const html = read("public/index.html");
const css = read("public/styles.css");
const app = read("public/app.js");
const launcherHtml = read("desktop/launcher.html");
const launcherCss = read("desktop/launcher.css");

function loadInteraction(motionClass = "") {
  const classList = {
    contains: name => name === motionClass,
    add() {},
    remove() {},
  };
  const context = {
    document: { documentElement: { classList } },
    matchMedia: () => ({ matches: false }),
    performance: { now: () => 0 },
    requestAnimationFrame: () => 0,
    cancelAnimationFrame: () => {},
    setTimeout: () => 0,
  };
  context.globalThis = context;
  context.window = context;
  vm.createContext(context);
  vm.runInContext(read("public/interaction.js"), context);
  return context.LifeLedgerInteraction;
}

const api = loadInteraction();

test("mapMotionPreference and applyMotionPreference map full, reduced, and off", () => {
  assert.equal(api.mapMotionPreference("full"), "");
  assert.equal(api.mapMotionPreference("reduced"), "motion-reduced");
  assert.equal(api.mapMotionPreference("off"), "motion-off");
  const doc = {
    documentElement: {
      classList: {
        classes: [],
        remove(...names) {
          this.classes = this.classes.filter(item => !names.includes(item));
        },
        add(...names) {
          names.forEach(name => {
            if (!this.classes.includes(name)) this.classes.push(name);
          });
        },
      },
    },
  };
  doc.documentElement.classList.remove = (...names) => {
    doc.documentElement.classList.classes = doc.documentElement.classList.classes.filter(item => !names.includes(item));
  };
  doc.documentElement.classList.add = (...names) => {
    names.forEach(name => {
      if (!doc.documentElement.classList.classes.includes(name)) doc.documentElement.classList.classes.push(name);
    });
  };
  assert.equal(api.applyMotionPreference(doc, "reduced"), "motion-reduced");
  assert.ok(doc.documentElement.classList.classes.includes("motion-reduced"));
  api.applyMotionPreference(doc, "off");
  assert.ok(doc.documentElement.classList.classes.includes("motion-off"));
  assert.equal(api.applyMotionPreference(doc, "full"), "");
});

test("motionTravelDisabled respects motion-off and motion-reduced classes", () => {
  assert.equal(loadInteraction("motion-off").motionTravelDisabled(), true);
  assert.equal(loadInteraction("motion-reduced").motionTravelDisabled(), true);
  assert.equal(loadInteraction("").motionTravelDisabled(), false);
});

test("slideIndicatorFrame stretches then settles on the target geometry", () => {
  const from = { x: 0, y: 4, width: 48, height: 28 };
  const to = { x: 120, y: 4, width: 72, height: 28 };
  const mid = api.slideIndicatorFrame(from, to, 0.45);
  assert.ok(mid.x > from.x && mid.x < to.x);
  assert.ok(mid.width > 0);
  const end = api.slideIndicatorFrame(from, to, 1);
  assert.deepEqual({ ...end }, to);
});

test("clampStepper snaps within bounds", () => {
  assert.equal(api.clampStepper(27, 5, 120, 5), 25);
  assert.equal(api.clampStepper(122, 5, 120, 5), 120);
  assert.equal(api.clampStepper(0, 1, 7, 1), 1);
  assert.equal(api.clampStepper(8, 1, 7, 1), 7);
});

test("submitStateStep walks idle → busy → done → idle and surfaces errors", () => {
  assert.equal(api.submitStateStep("idle", "start"), "busy");
  assert.equal(api.submitStateStep("busy", "success"), "done");
  assert.equal(api.submitStateStep("done", "reset"), "idle");
  assert.equal(api.submitStateStep("busy", "fail"), "error");
  assert.equal(api.submitStateStep("error", "start"), "busy");
  assert.equal(api.submitStateStep("done", "timeout"), "idle");
});

test("each hairline SVG is local, currentColor, layered, and script-free", () => {
  const dir = new URL("../public/assets/hairline/", import.meta.url);
  for (const name of readdirSync(dir).filter(file => file.endsWith(".svg"))) {
    const source = readFileSync(new URL(name, dir), "utf8");
    const result = api.hairlineSvgChecks(source);
    assert.equal(result.ok, true, `${name}: ${result.errors.join(",")}`);
    assert.doesNotMatch(source.replace('xmlns="http://www.w3.org/2000/svg"', ""), /https?:\/\//);
  }
});

test("phase 3.4 desktop shell wires motion, create menu, search, and hairline mounts", () => {
  assert.match(html, /id="motionSelect"/);
  assert.match(html, /id="toolbarCreateButton"/);
  assert.match(html, /id="toolbarCreateMenu"/);
  assert.match(html, /class="toolbar-search-collapsible"/);
  assert.match(html, /data-scroll-title-sentinel/);
  assert.match(html, /id="submitLiveRegion"/);
  assert.match(app, /const MOTION_KEY = "life-ledger-motion"/);
  assert.match(app, /applyMotionPreference\(/);
  assert.match(app, /openAnchoredPopover\(/);
  assert.match(app, /mountHairline\(/);
  assert.match(app, /function runSubmitButton\(/);
  assert.match(app, /mountFocusDurationStepper\(/);
  assert.match(css, /--ease-spring:/);
  assert.match(css, /html\.motion-reduced/);
  assert.match(css, /\.hairline-mount/);
  assert.match(launcherHtml, /hairline-mount/);
  assert.match(launcherCss, /\.hairline-illustration/);
});

test("habit completion motion uses a stronger desktop check duration", () => {
  assert.match(css, /--duration-habit-check: 180ms/);
});
