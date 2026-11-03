import { chromium, webkit } from "/Users/ashan/Documents/Codex/ll-web-cards/node_modules/playwright/index.mjs";
import { mkdir } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawn, execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, "..");
const outDir = join(here, "shots");
const port = 5295;
const base = `http://127.0.0.1:${port}/index.html?mode=local`;

async function waitForServer(url, attempts = 40) {
  for (let i = 0; i < attempts; i += 1) {
    try {
      await execFileAsync("curl", ["-sf", "-o", "/dev/null", url]);
      return;
    } catch {
      await new Promise(r => setTimeout(r, 100));
    }
  }
  throw new Error(`HTTP server did not respond at ${url}`);
}

async function seedScatterEmpty(page) {
  await page.evaluate(() => {
    const key = Object.keys(localStorage).find(k => k === "life-ledger-v1" || k.startsWith("life-ledger-v1"));
    if (!key || !window.LifeLedgerLedger) return;
    let state;
    try {
      state = JSON.parse(localStorage.getItem(key));
    } catch {
      return;
    }
    const L = window.LifeLedgerLedger;
    const today = new Date().toISOString().slice(0, 10);
    state.meta = { ...(state.meta || {}), demo: { active: false } };
    state.habits = [];
    state.logs = {};
    let ledger = L.normalize({}, { lang: localStorage.getItem("life-ledger-language") || "zh" });
    const expenseCat = ledger.categories.find(c => c.kind === "expense" && !c.archived);
    const account = ledger.accounts.find(a => !a.archived);
    if (!expenseCat || !account) return;
    ledger.transactions.push({
      id: "b12r3-shot-tx",
      accountId: account.id,
      categoryId: expenseCat.id,
      amountMinor: -890,
      currency: ledger.settings.defaultCurrency || "EUR",
      date: today,
      note: "Wellness empty shot",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    state.ledger = ledger;
    localStorage.setItem(key, JSON.stringify(state));
  });
}

async function shot(browser, name, opts) {
  const context = await browser.newContext({
    viewport: opts.viewport || { width: 1440, height: 900 },
    colorScheme: opts.theme === "dark" ? "dark" : "light",
    isMobile: Boolean(opts.mobile),
    hasTouch: Boolean(opts.mobile),
  });
  await context.addInitScript(({ lang, theme }) => {
    localStorage.setItem("life-ledger-demo-workspace-dismissed", "1");
    localStorage.setItem("life-ledger-ledger-onboarding-dismissed", "1");
    localStorage.setItem("life-ledger-demo-dismissed-v1", "1");
    if (lang) localStorage.setItem("life-ledger-language", lang);
    if (theme) document.documentElement.dataset.theme = theme;
  }, { lang: opts.lang, theme: opts.theme });
  const page = await context.newPage();
  await page.goto(base, { waitUntil: "domcontentloaded" });
  await seedScatterEmpty(page);
  await page.reload({ waitUntil: "networkidle" });
  await page.locator('.nav-item[data-view="ledger"]').click();
  await page.waitForSelector("#ledgerWellnessEmptyHint", { timeout: 15000 });
  const el = page.locator(".ledger-wellness-insights");
  await el.scrollIntoViewIfNeeded();
  await page.waitForTimeout(400);
  await el.screenshot({ path: join(outDir, name) });
  await context.close();
}

const server = spawn("python3", ["-m", "http.server", String(port), "--bind", "127.0.0.1"], {
  cwd: join(repoRoot, "public"),
  stdio: "ignore",
});

try {
  await mkdir(outDir, { recursive: true });
  await waitForServer(base);
  const chromiumBrowser = await chromium.launch({ headless: true });
  const webkitBrowser = await webkit.launch({ headless: true });
  await shot(chromiumBrowser, "b12r3-ledger-wellness-empty-zh-light-1440-chromium.png", { lang: "zh", theme: "light" });
  await shot(webkitBrowser, "b12r3-ledger-wellness-empty-de-dark-390-webkit.png", {
    lang: "de",
    theme: "dark",
    mobile: true,
    viewport: { width: 390, height: 844 },
  });
  await chromiumBrowser.close();
  await webkitBrowser.close();
  console.log("saved b12r3 ledger wellness empty shots");
} finally {
  server.kill("SIGTERM");
}
