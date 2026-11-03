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
const base = `http://127.0.0.1:${port}/index.html?mode=local&local-preview=demo-showcase-v1`;

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

async function gotoView(page, view) {
  await page.locator(`.nav-item[data-view="${view}"]`).first().click();
  await page.waitForTimeout(320);
}

async function seedWeeklyPartial(page) {
  await page.waitForFunction(() => window.LifeLedgerLedger);
  await page.evaluate(() => {
    const key = "life-ledger-preview-demo-showcase-v1";
    const raw = localStorage.getItem(key);
    if (!raw) return;
    const state = JSON.parse(raw);
    const L = window.LifeLedgerLedger;
    let ledger = L.normalize(state.ledger, { lang: "zh" });
    const account = ledger.accounts[0]?.id;
    const cat = ledger.categories.find(c => c.kind === "expense")?.id;
    if (!account || !cat) return;
    ledger.recurring = (ledger.recurring || []).filter(r => r?.cadence !== "weekly");
    ledger.recurring.push({
      id: "demo-weekly-yoga",
      label: "瑜伽课",
      accountId: account,
      categoryId: cat,
      amountMinor: -1500,
      currency: "EUR",
      cadence: "weekly",
      weekday: 1,
      note: "Yoga",
    });
    const posted = L.applyRecurringTemplate(ledger, "demo-weekly-yoga", { lang: "zh", today: "2026-11-03" });
    if (posted) ledger = posted.ledger;
    state.ledger = ledger;
    localStorage.setItem(key, JSON.stringify(state));
  });
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForTimeout(500);
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
    await page.goto(base, { waitUntil: "networkidle" });
    await gotoView(page, "today");
    await seedWeeklyPartial(page);
    await gotoView(page, "today");
    await page.locator(".tw-card.tw-spending").scrollIntoViewIfNeeded();
    await page.waitForSelector(".tw-spend-recurring-pill:not([hidden])", { timeout: 12000 });
    const pill = await page.locator(".tw-spend-recurring-pill").textContent();
    if (!pill || !/笔固定待记/.test(pill) || pill.includes("1 笔")) {
      console.warn("Expected multi-occurrence pill, got:", pill);
    }
    await page.screenshot({ path: join(outDir, "b8r2-today-recurring-count-zh-light-1440-chromium.png") });
    await gotoView(page, "ledger");
    await page.waitForSelector(".ledger-recurring-due", { timeout: 12000 });
    await page.locator(".ledger-recurring-due").scrollIntoViewIfNeeded();
    await page.waitForTimeout(200);
    await page.screenshot({ path: join(outDir, "b8r2-ledger-recurring-count-zh-light-1440-chromium.png") });
    await ctx.close();

    const wk = await webkit.launch({ headless: true });
    const mctx = await prepContext(wk, {
      lang: "de",
      theme: "dark",
      mobile: true,
      viewport: { width: 390, height: 844 },
    });
    const mpage = await mctx.newPage();
    await mpage.goto(base, { waitUntil: "networkidle" });
    await gotoView(mpage, "ledger");
    await mpage.waitForSelector(".ledger-recurring-due", { timeout: 15000 });
    await mpage.screenshot({ path: join(outDir, "b8r2-ledger-recurring-de-dark-390-webkit.png") });
    await mctx.close();
    await wk.close();
    await chromiumBrowser.close();
    console.log("Saved b8r2-* to .overnight/shots/");
  } finally {
    server.kill("SIGTERM");
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
