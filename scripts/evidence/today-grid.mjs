// Fictional-data product screenshots for the Web Today snap-to-grid (EN/ZH/DE, desktop light/dark + phone).
// Usage: node scripts/evidence/today-grid.mjs  → docs/today-widgets/grid/
import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { startStaticServer } from "./server.mjs";
import { applyFixture, FIXTURE_DATE } from "./fixture.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const out = path.join(root, "docs/today-widgets/grid");
fs.mkdirSync(out, { recursive: true });
const server = await startStaticServer(path.join(root, "public"));
const browser = await chromium.launch({ headless: true });
const shots = [];
try {
  for (const lang of ["en", "zh", "de"]) {
    for (const [name, width, theme, edit] of [["desktop-light", 1440, "light"], ["desktop-dark", 1440, "dark"], ["desktop-edit", 1440, "light", true], ["mobile", 390, "light"]]) {
      if (edit && lang !== "en") continue;
      const page = await browser.newPage({ viewport: { width, height: 1000 }, deviceScaleFactor: 2 }), errors = [];
      page.on("pageerror", e => errors.push(e.message));
      await applyFixture(page, { date: FIXTURE_DATE, language: lang });
      await page.addInitScript(t => localStorage.setItem("life-ledger-theme", t), theme);
      await page.route("https://api.open-meteo.com/**", r => r.abort());
      await page.goto(`${server.url}/index.html?lang=${lang}`);
      await page.waitForLoadState("networkidle");
      await page.evaluate(() => window.LifeLedgerTodayGrid?.reset());
      if (edit) await page.locator("#editLayoutToggle").click();
      await page.waitForTimeout(600);
      const height = await page.evaluate(() => { const v = document.querySelector("#todayView"); return Math.ceil(Math.max(v.scrollHeight + v.getBoundingClientRect().top, document.documentElement.scrollHeight)); });
      await page.setViewportSize({ width, height: Math.min(height + 24, 4000) });
      await page.waitForTimeout(300);
      const file = `today-${lang}-${name}.png`;
      await page.screenshot({ path: path.join(out, file) });
      shots.push({ file, width, theme, lang, edit: Boolean(edit), errors });
      await page.close();
    }
  }
} finally { await browser.close(); await server.close(); }
fs.writeFileSync(path.join(out, "summary.json"), JSON.stringify(shots, null, 2) + "\n");
console.log(shots.map(s => `${s.file} errors=${s.errors.length}`).join("\n"));
