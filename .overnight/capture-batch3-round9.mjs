import { chromium, webkit } from "/Users/ashan/Documents/Codex/ll-web-cards/node_modules/playwright/index.mjs";
import { mkdir } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, "..");
const outDir = join(here, "shots");
const port = 5297;
const demoBase = `http://127.0.0.1:${port}/index.html?mode=local&local-preview=demo-showcase-v1`;
const localBase = `http://127.0.0.1:${port}/index.html?mode=local`;
const STORAGE_KEY = "life-ledger-v1";

async function shot(browser, name, opts = {}) {
  const context = await browser.newContext({
    viewport: opts.viewport || { width: 1440, height: 900 },
    deviceScaleFactor: opts.dpr || 1,
    colorScheme: opts.theme === "dark" ? "dark" : "light",
  });
  await context.addInitScript(
    ({ edition, lang, theme }) => {
      localStorage.setItem("life-ledger-local-edition", edition);
      localStorage.setItem("life-ledger-demo-workspace-dismissed", "1");
      if (lang) localStorage.setItem("life-ledger-language", lang);
    },
    { edition: "2026-10-sample-v6", lang: opts.lang },
  );
  if (opts.theme) await context.addInitScript(t => { document.documentElement.dataset.theme = t; }, opts.theme);
  const page = await context.newPage();
  if (opts.view === "review") {
    await page.goto(demoBase, { waitUntil: "networkidle" });
    await page.click('.nav-item[data-view="review"]');
    await page.waitForSelector(".review-ledger-stats.is-retargeting", { timeout: 20000 });
    await page.click('#reviewTitle [data-rv-month="-1"]');
    await page.waitForTimeout(700);
    await page.locator(".review-ledger-panel").screenshot({ path: join(outDir, name) });
    await context.close();
    return;
  }
  await page.goto(localBase, { waitUntil: "networkidle" });
  await page.evaluate(
    key => {
      const raw = localStorage.getItem(key);
      if (!raw) return;
      try {
        const state = JSON.parse(raw);
        if (state.ledger) {
          state.ledger.transactions = [];
          state.ledger.budgets = [];
          localStorage.setItem(key, JSON.stringify(state));
          location.reload();
        }
      } catch { /* ignore */ }
    },
    STORAGE_KEY,
  );
  await page.waitForLoadState("networkidle");
  await page.click('.nav-item[data-view="ledger"]');
  await page.waitForSelector(".ledger-onboarding.ll-empty-enter, .ledger-empty", { timeout: 20000 });
  await page.locator("#ledgerView .ledger-shell, #ledgerView").first().screenshot({ path: join(outDir, name) });
  await context.close();
}

await mkdir(outDir, { recursive: true });

const server = spawn("python3", ["-m", "http.server", String(port), "--bind", "127.0.0.1"], {
  cwd: join(repoRoot, "public"),
  stdio: "ignore",
});

await new Promise(r => setTimeout(r, 400));

try {
  for (const [browserType, tag] of [[chromium, "chromium"], [webkit, "webkit"]]) {
    const browser = await browserType.launch({ headless: true });
    await shot(browser, `b3r9-ledger-empty-de-light-390-${tag}.png`, {
      lang: "de",
      viewport: { width: 390, height: 844 },
    });
    await shot(browser, `b3r9-review-ledger-zh-dark-1440-${tag}.png`, {
      lang: "zh",
      theme: "dark",
      view: "review",
    });
    await browser.close();
  }
} finally {
  server.kill("SIGTERM");
}

console.log("batch3 round9 captures done");
