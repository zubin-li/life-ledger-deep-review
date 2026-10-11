import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const css = readFileSync(new URL("../public/styles.css", import.meta.url), "utf8");

function stripComments(source) {
  return source.replace(/\/\*[\s\S]*?\*\//g, "");
}

function stripKeyframes(source) {
  let cssText = source;
  let cursor = 0;
  let out = "";
  while (cursor < cssText.length) {
    const at = cssText.indexOf("@keyframes", cursor);
    if (at < 0) {
      out += cssText.slice(cursor);
      break;
    }
    out += cssText.slice(cursor, at);
    const open = cssText.indexOf("{", at);
    let depth = 0;
    let index = open;
    for (; index < cssText.length; index += 1) {
      if (cssText[index] === "{") depth += 1;
      else if (cssText[index] === "}") {
        depth -= 1;
        if (depth === 0) {
          index += 1;
          break;
        }
      }
    }
    cursor = index;
  }
  return out;
}

function animatedRules(source) {
  const cssText = stripKeyframes(stripComments(source));
  const rules = [];
  const re = /([^{}]+)\{([^{}]*)\}/g;
  let match = re.exec(cssText);
  while (match) {
    const selector = match[1].trim();
    const body = match[2];
    const animation = body.match(/animation\s*:\s*([^;]+)/);
    if (animation && !/\bnone\b/.test(animation[1]) && !/motion-off|motion-reduced|prefers-reduced-motion/.test(selector)) {
      rules.push({ selector, animation: animation[1].trim(), important: /!important/.test(animation[1]) });
    }
    match = re.exec(cssText);
  }
  return rules;
}

test("every animated selector is neutralized by Motion Off and travel-free under Reduced", () => {
  const rules = animatedRules(css);
  assert.ok(rules.length >= 8, `expected animated selectors, found ${rules.length}`);
  for (const rule of rules) {
    assert.equal(rule.important, false, `${rule.selector} uses animation !important and can escape Motion Off`);
  }
  assert.match(css, /html\.motion-off \*,\s*html\.motion-off \*::before,\s*html\.motion-off \*::after \{ animation: none !important; transition: none !important; \}/);
  assert.match(css, /html\.motion-reduced \*,\s*html\.motion-reduced \*::before,\s*html\.motion-reduced \*::after \{ transition-property: opacity !important; animation: none !important; \}/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\) \{\s*\*, \*::before, \*::after \{ animation: none !important; transition-property: opacity !important; \}/);
  assert.doesNotMatch(css, /@keyframes focusComplete \{[^}]*filter:/);
  assert.match(css, /celebrateFade 600ms/);
  assert.doesNotMatch(css, /celebrateFade 1\.9s/);
});
