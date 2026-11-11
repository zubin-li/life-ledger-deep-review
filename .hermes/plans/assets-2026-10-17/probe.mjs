// Read-only probe: render CURRENT code with the same fixture as the approved weather-gallery reference.
import { chromium } from '/Users/ashan/Documents/Codex/ll-361-blank-fix/node_modules/playwright/index.mjs';
import path from 'node:path';
import fs from 'node:fs';
const repo = '/Users/ashan/Documents/Codex/ll-361-blank-fix';
const { startStaticServer } = await import(`${repo}/scripts/evidence/server.mjs`);
const { applyFixture, createFictionalState } = await import(`${repo}/scripts/evidence/fixture.mjs`);
const out = '/Users/ashan/.hermes/cache/scratch/ll-probe/shots';
fs.mkdirSync(out, { recursive: true });
const date = '2026-10-24', state = createFictionalState(date);
for (let i = 1; i <= 24; i++) state.logs[`2026-10-${String(i).padStart(2, '0')}`] = { completed: state.habits.slice(0, i % 5).map(h => h.id), mood: '很好', note: '' };
const temps = [11,10,9,9,9,10,11,12,14,16,18,20,21,22,21,20,19,18,17,16,15,14,13,12];
const forecast = { current: { time: `${date}T10:30`, temperature_2m: 18, weather_code: 1 }, timezone: 'Europe/Berlin', hourly: { time: Array.from({ length: 48 }, (_, i) => new Date(Date.UTC(2026, 9, 24, i)).toISOString().slice(0, 16)), temperature_2m: Array.from({ length: 48 }, (_, i) => temps[i % 24]), precipitation_probability: Array(48).fill(5), precipitation: Array(48).fill(0), snowfall: Array(48).fill(0), weather_code: Array(48).fill(1) } };
const positions = { summary:['large',0,0], mood:['small',8,0], focus:['small',8,1], weather:['large',0,2], heatmap:['small',8,2], context:['small',8,3], habits:['medium',0,4], reflection:['small',8,4], photos:['medium',0,5], calendar:['large',0,6] };
const server = await startStaticServer(path.join(repo, 'public'));
const browser = await chromium.launch({ headless: true });
const runs = [
  ['desktop', 'tauri-local', 1440, true], ['web', '', 1440, true], ['web-default', '', 1440, false],
  ['web', '', 1180, true], ['web', '', 800, true], ['web', '', 390, true],
];
const report = [];
try {
  for (const [name, route, width, force] of runs) {
    const page = await browser.newPage({ viewport: { width, height: 1000 } });
    const errors = []; page.on('pageerror', e => errors.push(e.message));
    await applyFixture(page, { date, state, theme: 'light', language: 'en' });
    await page.addInitScript(() => localStorage.setItem('life-ledger-weather-city', JSON.stringify({ name: 'Berlin', latitude: 52.52, longitude: 13.41 })));
    await page.route('https://api.open-meteo.com/**', r => r.fulfill({ json: forecast }));
    await page.goto(`${server.url}/index.html?${route ? `desktop=${route}&` : ''}lang=en`);
    await page.waitForLoadState('networkidle');
    if (force) await page.evaluate(p => { const e = window.LifeLedgerLayoutEngine, l = e.getLayout(); for (const w of l.widgets) { const q = p[w.type]; w.hidden = !q; if (q) Object.assign(w, { size: q[0], x: q[1], y: q[2], settings: { ...w.settings, shape: 'wide' } }); } e.setLayout(l); }, positions);
    await page.waitForTimeout(1200);
    const geo = await page.evaluate(() => [...document.querySelectorAll('[data-module]')].filter(c => c.offsetParent).map(c => {
      const r = c.getBoundingClientRect();
      const overflow = [...c.querySelectorAll('*')].some(k => { const q = k.getBoundingClientRect(); return q.width > 0 && (q.right > r.right + 2 || q.bottom > r.bottom + 2 || q.left < r.left - 2); });
      return { m: c.dataset.module, x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height), overflow };
    }));
    const file = `${name}-${width}.png`;
    await page.screenshot({ path: path.join(out, file), fullPage: true });
    report.push({ file, errors, geo });
    await page.close();
  }
} finally { await browser.close(); server.close?.(); }
fs.writeFileSync(path.join(out, 'report.json'), JSON.stringify(report, null, 1));
for (const r of report) console.log(r.file, 'errors:', r.errors.length, '\n  ', r.geo.map(g => `${g.m}${g.w}x${g.h}@${g.x},${g.y}${g.overflow ? '!OVF' : ''}`).join('  '));
