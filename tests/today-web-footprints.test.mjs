// Web Today contract (2026-10-18): snap-to-grid cards, order + size only.
// 4 columns >=1280, 2 columns 761-1279, 1 column on phones. Default order:
// greeting, mood, weather / foundations, day plan / reflection, month (mood only).
// No card content leaking out of its frame or onto a neighbour.
import test from 'node:test';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { startStaticServer } from '../scripts/evidence/server.mjs';
import { applyFixture, FIXTURE_DATE } from '../scripts/evidence/fixture.mjs';

const publicDir = new URL('../public', import.meta.url).pathname;
const DEFAULT_ORDER = ['summary', 'mood', 'weather', 'habits', 'dayplan', 'reflection', 'calendar'];

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
      const cols = await page.evaluate(() => getComputedStyle(document.querySelector('#todayView')).gridTemplateColumns.split(' ').length);
      assert.equal(cols, width >= 1280 ? 4 : width > 760 ? 2 : 1, `${width}: grid columns`);
      if (width >= 1280) {
        assert.ok(Math.abs(by.summary.y - by.mood.y) < 2 && Math.abs(by.mood.y - by.weather.y) < 2, `${width}: greeting, mood and weather share the first row`);
        assert.ok(Math.abs(by.habits.y - by.dayplan.y) < 2 && Math.abs(by.habits.w - by.dayplan.w) < 2, `${width}: foundations and day plan sit side by side`);
        assert.ok(Math.abs(by.reflection.y - by.calendar.y) < 2 && Math.abs(by.calendar.w - by.dayplan.w) < 2, `${width}: month card is day-plan sized, beside reflection`);
      }
      assert.equal(await page.locator('#todayView [data-module="calendar"] #todayMonthViewSwitch').isVisible(), false, `${width}: month card is mood only`);
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
        assert.equal(await page.locator('#todayView .widget-size-btn:visible').count(), 0, `${width}: no S/M/L buttons`);
        assert.equal(await page.locator('#todayView > [data-tg]:not([hidden]) .tg-remove').count(), DEFAULT_ORDER.length - 1, `${width}: every card except foundations can be removed`);
        assert.equal(await page.locator('#todayView > [data-tg]:not([hidden]) .tg-sizes').count(), 3, `${width}: weather, foundations and month offer sizes`);
        await page.locator('#editLayoutToggle').click();
      }
      assert.deepEqual(errors, [], `${width}: no runtime errors`);
      await page.close();
    }
  } finally { await browser.close(); await server.close(); }
});

test('Web Today grid: stores order + size only; resize, remove, undo, Escape and reset act on that list', async () => {
  const server = await startStaticServer(publicDir), browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } }), errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await applyFixture(page, { date: FIXTURE_DATE, language: 'en' });
    await page.route('https://api.open-meteo.com/**', route => route.abort());
    await page.goto(`${server.url}/index.html?lang=en`);
    await page.waitForLoadState('networkidle');
    const list = () => page.evaluate(() => window.LifeLedgerTodayGrid.get().map(c => c.join(':')).join(' '));
    const stored = () => page.evaluate(() => JSON.parse(localStorage.getItem('life-ledger-today-cards-v1')));
    const def = await list();
    await page.locator('#editLayoutToggle').click();
    await page.locator('#todayView [data-module="habits"] .tg-sizes [data-size="h8"]').click();
    await page.locator('#todayView [data-module="weather"] .tg-remove').click();
    assert.deepEqual(await stored(), [['summary', 'std'], ['mood', 'std'], ['habits', 'h8'], ['dayplan', 'std'], ['reflection', 'std'], ['calendar', 'cs']], 'only [type, size] pairs are saved');
    assert.equal(await page.evaluate(() => habitsPerPage()), 8, 'large foundations card pages by 8');
    await page.locator('#undoLayoutButton').click();
    await page.locator('#undoLayoutButton').click();
    assert.equal(await list(), def, 'undo walks back size and removal');
    await page.locator('#todayView [data-module="mood"] .tg-remove').click();
    await page.keyboard.press('Escape');
    assert.equal(await list(), def, 'Escape cancels the edit session');
    await page.locator('#editLayoutToggle').click();
    await page.locator('#todayView [data-module="calendar"] .tg-sizes [data-size="cl"]').click();
    page.once('dialog', dialog => dialog.accept());
    await page.locator('#resetLayoutButton').click();
    assert.equal(await list(), def, 'reset restores the default cards');
    assert.deepEqual(errors, [], 'no runtime errors');
  } finally { await browser.close(); await server.close(); }
});
