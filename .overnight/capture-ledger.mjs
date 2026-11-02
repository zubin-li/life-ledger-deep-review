import { chromium, webkit } from "/Users/ashan/Documents/Codex/ll-web-cards/node_modules/playwright/index.mjs";
import { mkdir } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const outDir = join(here, "shots");

const base = "http://127.0.0.1:5291/index.html?mode=local";

async function shot(browserType, name, opts) {
  const browser = await browserType.launch({ headless: true });
  const page = await browser.newPage({ viewport: opts.viewport });
  await page.goto(base, { waitUntil: "networkidle" });
  if (opts.lang) {
    await page.evaluate(l => {
      localStorage.setItem("life-ledger-language", l);
      location.reload();
    }, opts.lang);
    await page.waitForLoadState("networkidle");
  }
  if (opts.theme) {
    await page.evaluate(t => {
      localStorage.setItem("life-ledger-theme", t);
      document.documentElement.dataset.theme = t;
    }, opts.theme);
  }
  await page.click('.nav-item[data-view="ledger"]');
  await page.waitForTimeout(400);
  await page.screenshot({ path: join(outDir, `${name}.png`), fullPage: opts.fullPage !== false });
  await browser.close();
}

await mkdir(outDir, { recursive: true });
await shot(chromium, "ledger-chromium-light-1440", { viewport: { width: 1440, height: 900 }, theme: "light" });
await shot(webkit, "ledger-webkit-dark-de-390", { viewport: { width: 390, height: 844 }, theme: "dark", lang: "de" });
console.log("screenshots saved");
