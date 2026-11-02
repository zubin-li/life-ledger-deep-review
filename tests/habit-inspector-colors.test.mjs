import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const app = readFileSync(new URL("../public/app.js", import.meta.url), "utf8");

function extractFunctionSource(source, signature) {
  const start = source.indexOf(signature);
  assert.ok(start >= 0, `missing ${signature}`);
  const bodyStart = source.indexOf("{", start);
  let depth = 0;
  for (let i = bodyStart; i < source.length; i++) {
    if (source[i] === "{") depth++;
    else if (source[i] === "}") {
      depth--;
      if (depth === 0) return source.slice(start, i + 1);
    }
  }
  throw new Error(`unterminated function: ${signature}`);
}

function readColorsCatalog(source) {
  return Object.fromEntries([...source.matchAll(/(\w+): \{ solid: "(#[0-9a-fA-F]{6})"/g)].map(match => [match[1], { solid: match[2] }]));
}

function harness() {
  const context = {
    colors: readColorsCatalog(app),
    Event,
    tr: key => key,
    escapeHtml: value => value,
    events: [],
    row: { innerHTML: "" },
    input: {
      value: "sage",
      dispatchEvent(event) {
        context.events.push(event.type);
      },
    },
    $: selector => {
      if (selector === "#inspectorColorSwatches") return context.row;
      if (selector === '#habitInspectorForm input[name="color"]') return context.input;
      return null;
    },
    $$: (selector, root) => {
      if (selector !== ".color-swatch") return [];
      const nodes = [...root.innerHTML.matchAll(/data-color="([^"]+)"/g)].map(match => ({
        dataset: { color: match[1] },
        classList: {
          contains() { return false; },
          add() {},
          remove() {},
        },
        addEventListener(event, handler) {
          if (event === "click") this.clickHandler = handler;
        },
      }));
      root._swatches = nodes;
      return nodes;
    },
  };
  const renderSource = extractFunctionSource(app, "function renderInspectorColorSwatches()");
  const inspectorSolidSource = extractFunctionSource(app, "function inspectorSolidColor(value)");
  vm.createContext(context);
  vm.runInContext(`${inspectorSolidSource}\n${renderSource}`, context);
  return context;
}

test("habit inspector swatches render literal catalog colors with important priority", () => {
  const context = harness();
  vm.runInContext("renderInspectorColorSwatches()", context);
  const solids = Object.values(context.colors).map(entry => entry.solid.toLowerCase());
  for (const solid of solids) {
    assert.match(context.row.innerHTML, new RegExp(`background-color:${solid} !important`, "i"));
  }
  assert.equal(new Set(solids).size, solids.length);
  assert.doesNotMatch(context.row.innerHTML, /--swatch:/);
});

test("habit inspector swatch click updates hidden input and emits input/change", () => {
  const context = harness();
  vm.runInContext(`
    renderInspectorColorSwatches();
    row._swatches.find(node => node.dataset.color === "coral").clickHandler();
  `, context);
  assert.equal(context.input.value, "coral");
  assert.deepEqual(context.events, ["input", "change"]);
});

test("icon and colour pickers are not wrapped in <label> (a label forwards every click to its first button)", () => {
  const html = readFileSync(new URL("../public/index.html", import.meta.url), "utf8");
  const wrapped = [...html.matchAll(/<label\b[^>]*class="[^"]*(?:icon|color)-picker-field/g)];
  assert.equal(wrapped.length, 0, "a picker inside <label> makes WebKit re-click the first swatch/icon after every choice");
  assert.equal([...html.matchAll(/role="group"[^>]*class="[^"]*(?:icon|color)-picker-field/g)].length, 4);
});

test("open pickers are opaque and lifted above the following form sections", () => {
  const css = readFileSync(new URL("../public/v202.css", import.meta.url), "utf8") + readFileSync(new URL("../public/styles.css", import.meta.url), "utf8");
  assert.match(css, /:is\(\.icon-picker-popover, \.color-picker-popover\) \{ background: #fff; \}/);
  assert.match(css, /\.habit-inspector-group:has\(\.icon-picker-popover:not\(\[hidden\]\)\)/);
});
