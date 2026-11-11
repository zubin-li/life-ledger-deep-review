import { chromium } from '/Users/ashan/Documents/Codex/ll-361-blank-fix/node_modules/playwright/index.mjs';
import path from 'node:path';
const repo = '/Users/ashan/Documents/Codex/ll-361-blank-fix';
const { startStaticServer } = await import(`${repo}/scripts/evidence/server.mjs`);
const { applyFixture, createFictionalState } = await import(`${repo}/scripts/evidence/fixture.mjs`);
const server = await startStaticServer(path.join(repo, 'public'));
const browser = await chromium.launch({ headless: true });
for (const lang of ['de','en','zh']) {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await applyFixture(page, { date: '2026-10-24', state: createFictionalState('2026-10-24'), theme: 'light', language: lang });
  await page.route('https://api.open-meteo.com/**', r => r.abort());
  await page.goto(`${server.url}/index.html?lang=${lang}`); await page.waitForLoadState('networkidle'); await page.waitForTimeout(500);
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await page.waitForTimeout(300);
  console.log(lang, JSON.stringify(await page.evaluate(() => {
    const fixed = [...document.querySelectorAll('body *')].filter(e => { const s = getComputedStyle(e), r = e.getBoundingClientRect(); return s.position === 'fixed' && s.display !== 'none' && s.visibility !== 'hidden' && r.height > 30 && r.height < 200 && r.bottom >= innerHeight - 40; });
    const nav = fixed[0]; const nr = nav?.getBoundingClientRect();
    const cards = [...document.querySelectorAll('#todayView > [data-module]')].filter(c => !c.hidden && c.offsetParent);
    const last = cards.at(-1).getBoundingClientRect();
    const trunc = nav ? [...nav.querySelectorAll('*')].filter(k => k.children.length === 0 && k.textContent.trim() && k.scrollWidth > k.clientWidth + 1).map(k => k.textContent.trim()) : [];
    return { nav: nav && (nav.id || nav.className), navTop: nr && nr.top|0, lastCardBottom: last.bottom|0, lastCard: cards.at(-1).dataset.module, truncatedNavLabels: trunc };
  })));
  await page.close();
}
await browser.close(); server.close?.();
