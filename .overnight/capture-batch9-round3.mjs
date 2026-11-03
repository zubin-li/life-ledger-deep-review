import { chromium, webkit } from "/Users/ashan/Documents/Codex/ll-web-cards/node_modules/playwright/index.mjs";
import { readFileSync } from "node:fs";
import { mkdir } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawn, execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, "..");
const outDir = join(here, "shots");
const port = 5294;
const base = `http://127.0.0.1:${port}/index.html?mode=local`;
const demoBase = `${base}&local-preview=demo-showcase-v1`;
const SHELL_JS = readFileSync(join(repoRoot, "desktop/mac/shell.js"), "utf8");
const SHELL_CSS = readFileSync(join(repoRoot, "desktop/mac/shell.css"), "utf8");

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

function macInitScript() {
  return ({ js, css }) => {
    window.__TAURI__ = {
      core: { invoke: async () => null },
      event: { listen: async () => () => {} },
      window: {
        getCurrentWindow: () => ({
          show: async () => {},
          isFullscreen: async () => false,
        }),
      },
      app: { getVersion: async () => "3.1.0" },
    };
    new Function(js)();
    document.addEventListener("DOMContentLoaded", () => {
      const s = document.createElement("style");
      s.textContent = css;
      document.head.append(s);
    });
  };
}

async function prepContext(browser, opts = {}) {
  const context = await browser.newContext({
    viewport: opts.viewport || { width: 1440, height: 900 },
    deviceScaleFactor: opts.mac ? 2 : 1,
    colorScheme: opts.theme === "dark" ? "dark" : "light",
    isMobile: Boolean(opts.mobile),
    hasTouch: Boolean(opts.mobile),
  });
  if (opts.mac) {
    await context.addInitScript(macInitScript(), { js: SHELL_JS, css: SHELL_CSS });
  }
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

async function seedSmallBaselineIncrease(page) {
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
    const today = new Date();
    const y = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1);
    const pad = n => String(n).padStart(2, "0");
    const iso = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    const yesterday = iso(y);
    const todayIso = iso(today);
    ({ ledger } = L.addTransaction(ledger, {
      accountId: account,
      categoryId: expenseCat,
      amountMinor: -300,
      currency: "EUR",
      date: yesterday,
      note: "prev",
    }));
    ({ ledger } = L.addTransaction(ledger, {
      accountId: account,
      categoryId: expenseCat,
      amountMinor: -5000,
      currency: "EUR",
      date: todayIso,
      note: "today",
    }));
    state.ledger = ledger;
    localStorage.setItem(key, JSON.stringify(state));
  });
  await page.reload({ waitUntil: "domcontentloaded" });
}

async function gotoView(page, view) {
  await page.locator(`.nav-item[data-view="${view}"]`).first().click();
  await page.waitForTimeout(320);
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
    const zhCtx = await prepContext(chromiumBrowser, { lang: "zh" });
    const todayPage = await zhCtx.newPage();
    await seedSmallBaselineIncrease(todayPage);
    await todayPage.locator(".tw-card.tw-spending").scrollIntoViewIfNeeded();
    await todayPage.waitForSelector(".tw-spend-compare:not([hidden])", { timeout: 15000 });
    const compareText = await todayPage.locator(".tw-spend-compare").textContent();
    if (!/较昨日多/.test(compareText || "") || !/47/.test(compareText || "")) {
      throw new Error(`Expected amount caption with 47, got: ${compareText}`);
    }
    await todayPage.locator(".tw-card.tw-spending").screenshot({
      path: join(outDir, "b9r3-today-spend-amount-caption-zh-light-1440-chromium.png"),
    });
    await zhCtx.close();
    await chromiumBrowser.close();

    const wk = await webkit.launch({ headless: true });
    const macCtx = await prepContext(wk, { lang: "zh", mac: true });
    const macPage = await macCtx.newPage();
    await macPage.goto(demoBase, { waitUntil: "domcontentloaded" });
    await gotoView(macPage, "week");
    await macPage.locator("#weekInsightsGrid").scrollIntoViewIfNeeded();
    await macPage.waitForSelector("#weekSpendingHint:not([hidden])", { timeout: 15000 });
    const weekHint = await macPage.locator("#weekSpendingHint").textContent();
    if (/\+\d{4,}%/.test(weekHint || "")) {
      throw new Error(`week hint huge +%: ${weekHint}`);
    }
    await macPage.locator("#weekSpendingCard").screenshot({
      path: join(outDir, "b9r3-mac-week-spend-hint-zh-light-1440-webkit.png"),
    });

    await gotoView(macPage, "review");
    await macPage.locator("#reviewLedgerSummary").scrollIntoViewIfNeeded();
    await macPage.waitForSelector("#reviewLedgerSpendHint:not([hidden])", { timeout: 15000 });
    const reviewHint = await macPage.locator("#reviewLedgerSpendHint").textContent();
    if (/\+\d{4,}%/.test(reviewHint || "")) {
      throw new Error(`review hint huge +%: ${reviewHint}`);
    }
    await macPage.locator("#reviewLedgerSummary").screenshot({
      path: join(outDir, "b9r3-mac-review-spend-hint-zh-light-1440-webkit.png"),
    });
    await macCtx.close();
    await wk.close();
  } finally {
    server.kill("SIGTERM");
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
