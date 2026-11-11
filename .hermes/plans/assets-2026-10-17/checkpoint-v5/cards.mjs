// Screenshot individual Today cards (default web layout) for close inspection.
import { chromium } from '/Users/ashan/Documents/Codex/ll-361-blank-fix/node_modules/playwright/index.mjs';
import path from 'node:path';
import fs from 'node:fs';
const repo = '/Users/ashan/Documents/Codex/ll-361-blank-fix';
const { startStaticServer } = await import(`${repo}/scripts/evidence/server.mjs`);
const { applyFixture, createFictionalState } = await import(`${repo}/scripts/evidence/fixture.mjs`);
const out = process.argv[2], lang = process.argv[3] || 'en', theme = process.argv[4] || 'light', width = Number(process.argv[5] || 1440);
const mods = (process.argv[6] || 'heatmap,context,reflection,photos').split(','), edit = process.argv[7] === 'edit';
fs.mkdirSync(out, { recursive: true });
const date = '2026-10-24', state = createFictionalState(date);
for (let i = 1; i <= 24; i++) state.logs[`2026-10-${String(i).padStart(2, '0')}`] = { completed: state.habits.slice(0, i % 5).map(h => h.id), mood: '很好', note: '' };
state.logs[date] = { ...state.logs[date], completed: state.habits.slice(0, 1).map(h => h.id) };
const server = await startStaticServer(path.join(repo, 'public'));
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({ viewport: { width, height: width < 600 ? 900 : 2100 } });
  await applyFixture(page, { date, state, theme, language: lang });
  await page.route('https://api.open-meteo.com/**', r => r.abort());
  await page.goto(`${server.url}/index.html?lang=${lang}`);
  await page.waitForLoadState('networkidle'); if (edit) await page.locator('#editLayoutToggle').click(); await page.waitForTimeout(800);
  for (const m of mods) {
    const card = page.locator(`#todayView [data-module="${m}"]`);
    await card.screenshot({ path: path.join(out, `${m}-${lang}-${theme}-${width}${edit?'-edit':''}.png`) });
    const info = await card.evaluate(c => ({ html: c.innerText.replace(/\s+/g, ' ').slice(0, 300), shape: c.dataset.widgetShape, size: c.dataset.widgetSize }));
    console.log(m, JSON.stringify(info));
  }
} finally { await browser.close(); server.close?.(); }
