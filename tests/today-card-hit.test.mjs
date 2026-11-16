import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const index = readFileSync(new URL("../public/index.html", import.meta.url), "utf8");
const widgets = readFileSync(new URL("../public/today-widgets.js", import.meta.url), "utf8");
const app = readFileSync(new URL("../public/app.js", import.meta.url), "utf8");

const today = index.slice(index.indexOf('id="todayView"'), index.indexOf('id="weekView"'));

function nestedButton(html) {
  let depth = 0;
  for (const tag of html.matchAll(/<\/?button\b[^>]*>/gi)) {
    const raw = tag[0];
    if (raw.startsWith("</")) {
      depth = Math.max(0, depth - 1);
      continue;
    }
    if (depth > 0) return raw;
    if (!/\/>\s*$/.test(raw)) depth += 1;
  }
  return "";
}

function sliceBetween(html, startMark, endMark) {
  const start = html.indexOf(startMark);
  const end = endMark ? html.indexOf(endMark, start + startMark.length) : html.length;
  assert.ok(start >= 0, startMark);
  return html.slice(start, end < 0 ? html.length : end);
}

function hits(html) {
  return [...html.matchAll(/<button\b[^>]*class="[^"]*\btc-card-hit\b[^>]*>/gi)];
}

const shellSrc = widgets.slice(widgets.indexOf("function shell("), widgets.indexOf("function setHit("));
const hitLine = shellSrc.match(/const hit = [\s\S]*?;/)[0];
const renderHit = new Function("tappable", "id", "t", "escapeHtml", `${hitLine}\nreturn hit;`);
const titles = { weather: "Weather", rhythm: "Recent rhythm", focus: "Focus", spending: "Spending today" };
const t = id => titles[id] || id;
const escapeHtml = text => String(text).replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[char]));

test("actionable Today cards render one hit with a name and no nested buttons", () => {
  assert.equal(nestedButton(today), "", "Today view nests a button");

  const regions = {
    hero: sliceBetween(today, 'class="hero-card"', 'class="mood-card"'),
    mood: sliceBetween(today, 'class="mood-card"', 'class="section-heading habits-heading"'),
    foundations: sliceBetween(today, 'class="section-heading habits-heading"', 'class="daily-planning-grid"'),
  };
  assert.equal(hits(regions.hero).length, 0);
  for (const name of ["mood", "foundations"]) {
    const found = hits(regions[name]);
    assert.equal(found.length, 1, name);
    assert.match(found[0][0], /aria-label="[^"]+"/, name);
    assert.equal(nestedButton(regions[name]), "", name);
  }

  const callOf = id => {
    const start = widgets.indexOf(`${id}: shell(`);
    assert.ok(start > 0, id);
    let end = widgets.length;
    for (const mark of ["\n    rhythm:", "\n    heatmap:", "\n    wall:", "\n    freq:", "\n    photos:", "\n    focus:", "\n    spending:", "\n  };"]) {
      const at = widgets.indexOf(mark, start + 1);
      if (at > start && at < end) end = at;
    }
    return widgets.slice(start, end);
  };
  for (const id of ["weather", "rhythm", "focus", "spending"]) {
    const html = renderHit(true, id, t, escapeHtml);
    assert.equal((html.match(/tc-card-hit/g) || []).length, 1, id);
    assert.match(html, /aria-label="[^"]+"/, id);
    assert.match(callOf(id), /, true\),?\s*$/, id);
  }
  assert.equal(renderHit(false, "heatmap", t, escapeHtml), "");
  assert.equal(callOf("heatmap").includes(", true"), false);
  assert.equal(callOf("photos").includes(", true"), false);
  assert.equal(callOf("freq").includes(", true"), false);

  assert.match(app, /\$\("#moodCardHit"\)\?\.addEventListener\("click"/);
  assert.match(app, /\$\("#foundationsCardHit"\)\?\.addEventListener\("click"/);
  assert.match(widgets, /wireHit\(cards\.focus,/);
  assert.match(widgets, /setDailyToolPage\("focus"\)/);
  assert.doesNotMatch(widgets, /wireHit\(cards\.focus[\s\S]{0,180}handleFocusQuickPrimary/);
  assert.match(widgets, /wireHit\(cards\.spending, openTodayLedgerSheet\)/);
  assert.match(widgets, /openSettings\("weather"\)/);
  assert.match(widgets, /switchToView\("review"\)/);
  assert.doesNotMatch(index, /data-open-settings/);
  assert.doesNotMatch(widgets, /tw-set-city|tw-spend-add/);
});
