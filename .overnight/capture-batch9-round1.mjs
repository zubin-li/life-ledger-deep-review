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
const port = 5292;
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
  await context.addInitScript(
    ({ lang }) => {
      localStorage.setItem("life-ledger-demo-dismissed-v1", "1");
      localStorage.setItem("life-ledger-ledger-onboarding-dismissed", "1");
      if (lang) localStorage.setItem("life-ledger-language", lang);
    },
    { lang: opts.lang },
  );
  if (opts.theme) {
    await context.addInitScript(t => {
      document.documentElement.dataset.theme = t;
    }, opts.theme);
  }
  return context;
}

async function seedDecreaseLedger(page) {
  await page.goto(base, { waitUntil: "domcontentloaded" });
  await page.evaluate(() => {
    const L = window.LifeLedgerLedger;
    if (!L) return;
    const key = Object.keys(localStorage).find(k => k === "life-ledger-v1" || k.startsWith("life-ledger-v1"));
    if (!key) return;
    let state;
    try {
      state = JSON.parse(localStorage.getItem(key));
    } catch {
      return;
    }
    let ledger = L.normalize(null, { lang: "zh" });
    const account = ledger.accounts[0].id;
    const expenseCat = ledger.categories.find(c => c.kind === "expense").id;
    ({ ledger } = L.addTransaction(ledger, {
      accountId: account,
      categoryId: expenseCat,
      amountMinor: -10000,
      currency: "EUR",
      date: "2026-11-02",
      note: "prev",
    }));
    ({ ledger } = L.addTransaction(ledger, {
      accountId: account,
      categoryId: expenseCat,
      amountMinor: -1000,
      currency: "EUR",
      date: "2026-11-03",
      note: "today",
    }));
    state.ledger = ledger;
    localStorage.setItem(key, JSON.stringify(state));
  });
  await page.reload({ waitUntil: "domcontentloaded" });
}

async function main() {
  await mkdir(outDir, { recursive: true });
  const server = spawn("python3", ["-m", "http.server", String(port), "--bind", "127.0.0.1"], {
    cwd: join(repoRoot, "public"),
    stdio: "ignore",
  });
  try {
    await waitForServer(`${base.split("?")[0]}`);
    const chromiumBrowser = await chromium.launch({ headless: true });
    const ctx = await prepContext(chromiumBrowser, { lang: "zh" });
    const page = await ctx.newPage();
    await seedDecreaseLedger(page);
    await page.locator(".tw-card.tw-spending").scrollIntoViewIfNeeded();
    await page.waitForSelector(".tw-spend-compare:not([hidden])", { timeout: 15000 });
    const compareText = await page.locator(".tw-spend-compare").textContent();
    if (!/90/.test(compareText || "")) {
      throw new Error(`Expected −90% compare copy, got: ${compareText}`);
    }
    await page.waitForTimeout(400);
    await page.locator(".tw-card.tw-spending").screenshot({
      path: join(outDir, "b9r1-spend-decrease-baseline-zh-light-1440-chromium.png"),
    });

    const wk = await webkit.launch({ headless: true });
    const deCtx = await prepContext(wk, {
      lang: "de",
      theme: "dark",
      mobile: true,
      viewport: { width: 390, height: 844 },
    });
    const dePage = await deCtx.newPage();
    await seedDecreaseLedger(dePage);
    await dePage.locator(".tw-card.tw-spending").scrollIntoViewIfNeeded();
    await dePage.waitForSelector(".tw-spend-compare:not([hidden])", { timeout: 15000 });
    const deCompare = await dePage.locator(".tw-spend-compare").textContent();
    if (!/90/.test(deCompare || "")) {
      throw new Error(`Expected 90% in de compare, got: ${deCompare}`);
    }
    await dePage.waitForTimeout(400);
    await dePage.locator(".tw-card.tw-spending").screenshot({
      path: join(outDir, "b9r1-spend-decrease-baseline-de-dark-390-webkit.png"),
    });

    await wk.close();
    await chromiumBrowser.close();
    console.log("Saved b9r1-spend-decrease-baseline-*");
  } finally {
    server.kill("SIGTERM");
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
