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

async function prepContext(browser, opts = {}) {
  const context = await browser.newContext({
    viewport: opts.viewport || { width: 1440, height: 900 },
    colorScheme: opts.theme === "dark" ? "dark" : "light",
    isMobile: Boolean(opts.mobile),
    hasTouch: Boolean(opts.mobile),
  });
  await context.addInitScript(({ lang }) => {
    localStorage.setItem("life-ledger-demo-dismissed-v1", "1");
    localStorage.setItem("life-ledger-ledger-onboarding-dismissed", "1");
    if (lang) localStorage.setItem("life-ledger-language", lang);
  }, { lang: opts.lang });
  if (opts.theme) {
    await context.addInitScript(t => {
      document.documentElement.dataset.theme = t;
    }, opts.theme);
  }
  return context;
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
    state.focusSessions = [];
    state.logs = {};
    let ledger = L.normalize({}, { lang: localStorage.getItem("life-ledger-language") || "zh" });
    const expenseCat = ledger.categories.find(c => c.kind === "expense" && !c.archived);
    const account = ledger.accounts.find(a => !a.archived);
    if (!expenseCat || !account) return;
    ledger.transactions.push({
      id: "capture-scatter-empty",
      accountId: account.id,
      categoryId: expenseCat.id,
      amountMinor: -890,
      currency: ledger.settings.defaultCurrency || "EUR",
      date: today,
      note: "Capture QA",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    state.ledger = ledger;
    localStorage.setItem(key, JSON.stringify(state));
  });
}

async function main() {
  await mkdir(outDir, { recursive: true });
  const server = spawn("python3", ["-m", "http.server", String(port), "--bind", "127.0.0.1"], {
    cwd: join(repoRoot, "public"),
    stdio: "ignore",
  });
  try {
    await waitForServer(base.split("?")[0]);

    const cr = await chromium.launch({ headless: true });
    const deskCtx = await prepContext(cr, { lang: "zh" });
    const deskPage = await deskCtx.newPage();
    await deskPage.goto(base, { waitUntil: "domcontentloaded" });
    await seedScatterEmpty(deskPage);
    await deskPage.reload({ waitUntil: "domcontentloaded" });
    await deskPage.click('.nav-item[data-view="review"]');
    await deskPage.waitForSelector("#reviewScatterEmptyHint", { timeout: 15000 });
    await deskPage.waitForTimeout(600);
    await deskPage.locator("#reviewScatterEmptyHint").screenshot({
      path: join(outDir, "b11r5-review-scatter-empty-zh-light-1440-chromium.png"),
    });
    await deskCtx.close();
    await cr.close();

    const wk = await webkit.launch({ headless: true });
    const mobCtx = await prepContext(wk, {
      lang: "de",
      theme: "dark",
      mobile: true,
      viewport: { width: 390, height: 844 },
    });
    const mobPage = await mobCtx.newPage();
    await mobPage.goto(`${base}&local-preview=demo-showcase-v1`, { waitUntil: "domcontentloaded" });
    await mobPage.click('.nav-item[data-view="ledger"]');
    await mobPage.waitForSelector("#ledgerView.view.active", { timeout: 15000 });
    await mobPage.waitForSelector(".ledger-category-viz.is-ready, .ledger-donut", { timeout: 15000 });
    await mobPage.waitForTimeout(400);
    await mobPage.locator("#ledgerView .ledger-summary").screenshot({
      path: join(outDir, "b11r5-ledger-summary-de-dark-390-webkit.png"),
    });
    await mobCtx.close();
    await wk.close();
  } finally {
    server.kill("SIGTERM");
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
