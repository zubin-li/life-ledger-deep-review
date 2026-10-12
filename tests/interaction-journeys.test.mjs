import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const html = readFileSync(new URL("../public/index.html", import.meta.url), "utf8");
const css = readFileSync(new URL("../public/styles.css", import.meta.url), "utf8");
const app = readFileSync(new URL("../public/app.js", import.meta.url), "utf8");
const photos = readFileSync(new URL("../public/photo-memories.js", import.meta.url), "utf8");

test("keyboard and click journeys exist for navigation, habits, photos, and settings", () => {
  assert.match(app, /DESKTOP_SHORTCUT_VIEWS\[Number\(event\.key\) - 1\]/);
  assert.match(app, /function toggleHabit/);
  assert.match(app, /function openSettings/);
  assert.match(app, /function showToast/);
  assert.match(app, /onUndo/);
  assert.match(html, /id="todayJournal"/);
  assert.match(html, /id="weekPlanLede"/);
  assert.match(html, /data-timeline-filter="photos"/);
  assert.match(html, /id="habitStreakCalendar"/);
  assert.match(html, /id="photoLightbox"/);
  assert.match(html, /data-photo-drop/);
  assert.match(photos, /addEventListener\("keydown"/);
  assert.match(photos, /addEventListener\("drop"/);
  assert.match(photos, /data-photo-action="replace"/);
  assert.match(photos, /data-photo-caption/);
  assert.match(app, /timelineFilter/);
  assert.match(app, /renderHabitStreakCalendar/);
  assert.match(app, /\$\("#mediaBackupOption"\)\.hidden = !photoMemories/);
});

test("motion tokens stay short and reduced motion removes photo movement", () => {
  assert.match(css, /--motion-button: 140ms;/);
  assert.match(css, /--motion-popover: 160ms;/);
  assert.match(css, /--motion-panel: 240ms;/);
  assert.match(css, /--ease-enter: cubic-bezier\(0\.22, 1, 0\.36, 1\)/);
  assert.match(css, /--ease-move: cubic-bezier\(0\.25, 1, 0\.5, 1\)/);
  assert.doesNotMatch(css, /transition:\s*all/);
  assert.match(css, /@keyframes photoIn \{ from \{ opacity: 0; \} to \{ opacity: 1; \} \}/);
  assert.match(css, /prefers-reduced-motion: reduce\)[\s\S]*\.photo-thumb/);
});
