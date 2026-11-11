// Real-runtime check of Web Today with the DEFAULT layout (no forced positions).
// Usage: node probe-v2.mjs <outDir> [lang] [theme]
import { chromium } from '/Users/ashan/Documents/Codex/ll-361-blank-fix/node_modules/playwright/index.mjs';
import path from 'node:path';
import fs from 'node:fs';
const repo = '/Users/ashan/Documents/Codex/ll-361-blank-fix';
const { startStaticServer } = await import(`${repo}/scripts/evidence/server.mjs`);
const { applyFixture, createFictionalState } = await import(`${repo}/scripts/evidence/fixture.mjs`);
const out = process.argv[2], langs = (process.argv[3] || 'en').split(','), themes = (process.argv[4] || 'light').split(',');
const widths = (process.env.WIDTHS || '1440,1180,800,390').split(',').map(Number);
fs.mkdirSync(out, { recursive: true });
const date = '2026-10-24', state = createFictionalState(date);
for (let i = 1; i <= 24; i++) state.logs[`2026-10-${String(i).padStart(2, '0')}`] = { completed: state.habits.slice(0, i % 5).map(h => h.id), mood: '很好', note: '' };
state.logs[date] = { ...state.logs[date], completed: state.habits.slice(0, 1).map(h => h.id) }; // realistic: habits still open
const temps = [11,10,9,9,9,10,11,12,14,16,18,20,21,22,21,20,19,18,17,16,15,14,13,12];
const forecast = { current: { time: `${date}T10:30`, temperature_2m: 18, weather_code: 1 }, timezone: 'Europe/Berlin', hourly: { time: Array.from({ length: 48 }, (_, i) => new Date(Date.UTC(2026, 9, 24, i)).toISOString().slice(0, 16)), temperature_2m: Array.from({ length: 48 }, (_, i) => temps[i % 24]), precipitation_probability: Array(48).fill(5), precipitation: Array(48).fill(0), snowfall: Array(48).fill(0), weather_code: Array(48).fill(1) } };
const server = await startStaticServer(path.join(repo, 'public'));
const browser = await chromium.launch({ headless: true });
const report = [];
try {
  for (const lang of langs) for (const theme of themes) for (const width of widths) for (const edit of [false, true]) {
    if (edit && process.env.NOEDIT) continue;
    const page = await browser.newPage({ viewport: { width, height: width < 600 ? 900 : 2100 } });
    const errors = []; page.on('pageerror', e => errors.push(e.message)); page.on('console', m => m.type() === 'error' && errors.push(m.text()));
    await applyFixture(page, { date, state, theme, language: lang });
    await page.addInitScript(() => localStorage.setItem('life-ledger-weather-city', JSON.stringify({ name: 'Berlin', latitude: 52.52, longitude: 13.41 })));
    await page.route('https://api.open-meteo.com/**', r => r.fulfill({ json: forecast }));
    await page.goto(`${server.url}/index.html?lang=${lang}`);
    await page.waitForLoadState('networkidle');
    await page.evaluate(async () => { await document.fonts.ready; });
    if (edit) { await page.locator('#editLayoutToggle').click(); }
    await page.waitForTimeout(900);
    const geo = await page.evaluate(() => {
      const cards = [...document.querySelectorAll('#todayView [data-module]')].filter(c => !c.hidden && c.offsetParent);
      const rects = cards.map(c => c.getBoundingClientRect());
      return cards.map((c, i) => {
        const r = rects[i];
        const leaks = [...c.querySelectorAll('*')].filter(k => {
          if (!k.offsetParent && getComputedStyle(k).position !== 'fixed') return false;
          const q = k.getBoundingClientRect(); if (q.width < 1 || q.height < 1) return false;
          const st = getComputedStyle(k); if (st.visibility === 'hidden' || st.opacity === '0') return false;
          return q.right > r.right + 1 || q.bottom > r.bottom + 1 || q.left < r.left - 1 || q.top < r.top - 1;
        }).filter(k => { // ignore descendants clipped by an overflow ancestor inside the card
          for (let a = k.parentElement; a && a !== c.parentElement; a = a.parentElement) { const o = getComputedStyle(a); if (/(hidden|auto|scroll|clip)/.test(o.overflow + o.overflowX + o.overflowY)) { const ar = a.getBoundingClientRect(); const q = k.getBoundingClientRect(); if (ar.right <= r.right + 1 && ar.bottom <= r.bottom + 1 && ar.left >= r.left - 1) return false; } }
          return true;
        }).map(k => (k.id || k.className || k.tagName).toString().slice(0, 40));
        const overlaps = rects.map((o, j) => j !== i && !(r.right <= o.left + 1 || o.right <= r.left + 1 || r.bottom <= o.top + 1 || o.bottom <= r.top + 1) ? cards[j].dataset.module : null).filter(Boolean);
        const clipped = [...c.querySelectorAll('h2,h3,p,span,strong,button,label')].filter(k => k.offsetParent && k.scrollWidth > k.clientWidth + 1 && getComputedStyle(k).textOverflow !== 'ellipsis' && /hidden|clip/.test(getComputedStyle(k).overflowX)).map(k => (k.id || k.className || k.tagName).toString().slice(0, 30));
        return { m: c.dataset.module, x: Math.round(r.x), y: Math.round(r.y + scrollY), w: Math.round(r.width), h: Math.round(r.height), leaks: [...new Set(leaks)].slice(0, 4), overlaps, clipped: clipped.slice(0, 3) };
      });
    });
    const docOverflowX = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1);
    const file = `${lang}-${theme}-${width}${edit ? '-edit' : ''}.png`;
    await page.screenshot({ path: path.join(out, file), fullPage: true });
    report.push({ file, errors, docOverflowX, geo });
    await page.close();
  }
} finally { await browser.close(); server.close?.(); }
fs.writeFileSync(path.join(out, 'report.json'), JSON.stringify(report, null, 1));
let bad = 0;
for (const r of report) {
  const issues = r.geo.filter(g => g.leaks.length || g.overlaps.length || g.clipped.length);
  bad += issues.length + r.errors.length + (r.docOverflowX ? 1 : 0);
  console.log(r.file, `err:${r.errors.length}`, r.docOverflowX ? 'DOC-OVERFLOW-X' : '', issues.length ? '' : 'clean');
  for (const g of issues) console.log('   ', g.m, `${g.w}x${g.h}`, g.leaks.length ? 'leak:' + g.leaks.join('|') : '', g.overlaps.length ? 'overlap:' + g.overlaps : '', g.clipped.length ? 'clip:' + g.clipped : '');
  if (r.errors.length) console.log('    errors:', r.errors.slice(0, 2).join(' / ').slice(0, 200));
}
console.log('TOTAL ISSUES', bad);
