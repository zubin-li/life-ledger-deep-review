import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const styles = readFileSync(new URL("../public/styles.css", import.meta.url), "utf8");
const launcherCss = readFileSync(new URL("../desktop/launcher.css", import.meta.url), "utf8");
const appJs = readFileSync(new URL("../public/app.js", import.meta.url), "utf8");

const TRANSITION_ALL = /transition\s*:\s*all\b/i;

test("no stylesheet ever uses the blunt transition: all shorthand", () => {
  assert.doesNotMatch(styles, TRANSITION_ALL);
  assert.doesNotMatch(launcherCss, TRANSITION_ALL);
});

test("shared motion duration tokens exist alongside the existing easing curves", () => {
  assert.match(styles, /--ease-enter: cubic-bezier\(0\.22, 1, 0\.36, 1\);/);
  assert.match(styles, /--ease-move: cubic-bezier\(0\.25, 1, 0\.5, 1\);/);
  assert.match(styles, /--duration-fast: 150ms;/);
  assert.match(styles, /--duration-base: 220ms;/);
  assert.match(styles, /--duration-slow: 300ms;/);
  assert.match(styles, /--duration-exit: 130ms;/);
  // Fast/base/slow must all land inside the mandated 150-300ms routine-motion window.
  for (const value of [150, 220, 300]) {
    assert.ok(value >= 150 && value <= 300, `${value}ms must stay within 150-300ms`);
  }
});

test("the primary view-change animation actually consumes the declared 300ms token, not a hardcoded mismatch", () => {
  assert.match(styles, /\.view\.active \{ display: block; animation: viewIn var\(--duration-slow\) var\(--ease-enter\) forwards; \}/);
  assert.doesNotMatch(styles, /animation:\s*viewIn\s+320ms/);
});

test("keyboard-initiated desktop shortcuts suppress motion via the motion-off escape hatch", () => {
  assert.match(styles, /html\.motion-off \.app-shell \{ transition: none; \}/);
  assert.match(styles, /html\.motion-off \.sidebar-toggle svg \{ transition: none; \}/);
  assert.match(styles, /html\.motion-off \.view\.active \{ animation: none; opacity: 1; transform: none; \}/);
  assert.match(styles, /html\.motion-off dialog\[open\] \{ animation: none; \}/);
  assert.match(appJs, /function withoutMotion\(run\) \{/);
  assert.match(appJs, /document\.documentElement\.classList\.add\("motion-off"\)/);
});

test("reduced motion is respected globally, independent of the motion-off shortcut hatch", () => {
  assert.match(
    styles,
    /\*, \*::before, \*::after \{\s*animation-duration: \.01ms !important;\s*animation-iteration-count: 1 !important;\s*transition-duration: \.01ms !important;/
  );
  assert.match(launcherCss, /@media \(prefers-reduced-motion: reduce\) \{/);
});

test("no keyframe or transition animates a layout-triggering property on the newly added selectors", () => {
  const start = styles.indexOf("/* Desktop shell (Tauri)");
  const end = styles.indexOf("@media (min-width: 761px) {", start);
  const addedBlock = styles.slice(start, end);
  assert.ok(addedBlock.length > 0);
  assert.doesNotMatch(addedBlock, /transition:\s*(width|height|top|left)\b/);
  assert.doesNotMatch(addedBlock, /animation:/);
});
