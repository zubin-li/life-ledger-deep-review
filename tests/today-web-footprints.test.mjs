// Web Today contract (2026-10-17): the original 3.5 page rhythm built from
// removable widgets — hero + mood, full-width foundations carousel, daily
// calendar + reflection side by side, then the month in view. No S/M/L, and no
// card content leaking out of its frame or onto a neighbour.
import test from 'node:test';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { startStaticServer } from '../scripts/evidence/server.mjs';
import { applyFixture, FIXTURE_DATE } from '../scripts/evidence/fixture.mjs';

const publicDir = new URL('../public', import.meta.url).pathname;
const DEFAULT_ORDER = ['summary', 'mood', 'habits', 'dayplan', 'reflection', 'calendar'];

test('Web Today: classic sections as widgets, no S/M/L, no overflow or overlap at 1440/1180/800/390', async () => {
  const server = await startStaticServer(publicDir), browser = await chromium.launch({ headless: true });
  try {
    for (const width of [1440, 1180, 800, 390]) {
      const page = await browser.newPage({ viewport: { width, height: 1000 } }), errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await applyFixture(page, { date: FIXTURE_DATE, language: 'de' });
      await page.route('https://api.open-meteo.com/**', route => route.abort());
      await page.goto(`${server.url}/index.html?lang=de`);
      await page.waitForLoadState('networkidle');
      const cards = await page.evaluate(() => [...document.querySelectorAll('#todayView > [data-module]')].filter(c => !c.hidden && c.offsetParent).map(c => {
        const r = c.getBoundingClientRect();
        return { m: c.dataset.module, x: r.x, y: r.y, w: Math.round(r.width), h: Math.round(r.height), sx: c.scrollWidth - c.clientWidth };
      }));
      assert.deepEqual(cards.map(c => c.m), DEFAULT_ORDER, `${width}: classic sections in order`);
      const by = Object.fromEntries(cards.map(c => [c.m, c]));
      if (width >= 1180) {
        assert.ok(Math.abs(by.summary.y - by.mood.y) < 2 && by.summary.w > by.mood.w * 1.8, `${width}: hero and mood share the first row`);
        assert.ok(Math.abs(by.habits.w - (by.summary.w + by.mood.w)) < 24, `${width}: foundations span the full row`);
        assert.ok(Math.abs(by.dayplan.y - by.reflection.y) < 2 && Math.abs(by.dayplan.w - by.reflection.w) < 2, `${width}: day plan and reflection sit side by side`);
        assert.ok(Math.abs(by.calendar.w - by.habits.w) < 2 && by.calendar.y > by.reflection.y, `${width}: the month in view closes the page`);
      }
      assert.ok(await page.locator('#todayHabits .habit-card').count() > 0, `${width}: foundations render habit cards`);
      assert.equal(await page.locator('#dayRoll .day-roll-item').count(), 5, `${width}: five-day roll`);
      assert.equal(await page.locator('#todayMonthGrid .calendar-day').count(), 42, `${width}: six-week month`);
      for (const a of cards) {
        assert.ok(a.sx <= 2, `${width}: ${a.m} has no horizontal overflow (${a.sx}px)`);
        for (const b of cards) if (a !== b) assert.ok(a.x + a.w <= b.x + 1 || b.x + b.w <= a.x + 1 || a.y + a.h <= b.y + 1 || b.y + b.h <= a.y + 1, `${width}: ${a.m} does not overlap ${b.m}`);
      }
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), true, `${width}: page has no horizontal scroll`);
      if (width >= 800) {
        await page.locator('#editLayoutToggle').click();
        assert.equal(await page.locator('#todayView .widget-size-btn').count(), 0, `${width}: edit mode offers no S/M/L buttons`);
        assert.equal(await page.locator('#todayView > [data-module]:not([hidden]) > .widget-remove').count(), DEFAULT_ORDER.length - 1, `${width}: every section except foundations can be removed`);
        await page.locator('#editLayoutToggle').click();
      }
      assert.deepEqual(errors, [], `${width}: no runtime errors`);
      await page.close();
    }
  } finally { await browser.close(); await server.close(); }
});
