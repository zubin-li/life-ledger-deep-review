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
const port = 5292;
const base = `http://127.0.0.1:${port}/index.html?mode=local&local-preview=demo-showcase-v1`;
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
    colorScheme: opts.theme === "dark" ? "dark" : "light",
    isMobile: Boolean(opts.mobile),
    hasTouch: Boolean(opts.mobile),
    deviceScaleFactor: opts.mac ? 2 : 1,
  });
  if (opts.mac) {
    await context.addInitScript(macInitScript(), { js: SHELL_JS, css: SHELL_CSS });
  }
  await context.addInitScript(({ lang }) => {
    localStorage.setItem("life-ledger-demo-workspace-dismissed", "1");
    localStorage.setItem("life-ledger-ledger-onboarding-dismissed", "1");
    localStorage.setItem("life-ledger-today-cards-onboarding-dismissed", "1");
    if (lang) localStorage.setItem("life-ledger-language", lang);
  }, { lang: opts.lang });
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

async function main() {
  await mkdir(outDir, { recursive: true });
  const server = spawn("python3", ["-m", "http.server", String(port), "--bind", "127.0.0.1"], {
    cwd: join(repoRoot, "public"),
    stdio: "ignore",
  });
  try {
    await waitForServer(base.split("?")[0]);

    const cr = await chromium.launch({ headless: true });
    const zhCtx = await prepContext(cr, { lang: "zh" });
    const zhPage = await zhCtx.newPage();
    await zhPage.goto(base, { waitUntil: "domcontentloaded" });
    await zhPage.waitForSelector("#todayHabitSpendHint:not([hidden])", { timeout: 20000 });
    await zhPage.waitForSelector("#todayMoodSpendHint:not([hidden])", { timeout: 20000 });
    await zhPage.locator("#todayView").screenshot({
      path: join(outDir, "b11r10-release-today-zh-light-1440-chromium.png"),
      clip: { x: 0, y: 0, width: 1440, height: 620 },
    });
    await gotoView(zhPage, "ledger");
    await zhPage.waitForSelector("#ledgerView.view.active", { timeout: 15000 });
    await zhPage.waitForTimeout(450);
    await zhPage.locator("#ledgerView").screenshot({
      path: join(outDir, "b11r10-release-ledger-zh-light-1440-chromium.png"),
    });
    await gotoView(zhPage, "timeline");
    await zhPage.waitForSelector("#journalFeed.ll-paint-host--ready", { timeout: 60000 });
    await zhPage.waitForSelector(".journal-feed-spend-insight", { timeout: 20000 });
    await zhPage.locator(".journal-feed-heading").screenshot({
      path: join(outDir, "b11r10-release-journal-insight-zh-light-1440-chromium.png"),
    });
    await gotoView(zhPage, "review");
    await zhPage.locator("#review-scatter-habit").scrollIntoViewIfNeeded();
    await zhPage.waitForTimeout(400);
    await zhPage.locator(".review-ledger-insights").screenshot({
      path: join(outDir, "b11r10-release-review-scatter-zh-light-1440-chromium.png"),
    });
    await zhCtx.close();
    await cr.close();

    const wk = await webkit.launch({ headless: true });
    const deCtx = await prepContext(wk, {
      lang: "de",
      theme: "dark",
      mobile: true,
      viewport: { width: 390, height: 844 },
    });
    const dePage = await deCtx.newPage();
    await dePage.goto(base, { waitUntil: "domcontentloaded" });
    await gotoView(dePage, "week");
    await dePage.waitForSelector("#weekHabitSpendHint:not([hidden])", { timeout: 20000 });
    await dePage.locator(".week-page-header").screenshot({
      path: join(outDir, "b11r10-release-week-insight-de-dark-390-webkit.png"),
    });
    await gotoView(dePage, "ledger");
    await dePage.waitForTimeout(400);
    await dePage.locator("#ledgerView").screenshot({
      path: join(outDir, "b11r10-release-ledger-de-dark-390-webkit.png"),
    });
    await deCtx.close();

    const macCtx = await prepContext(wk, {
      lang: "en",
      theme: "light",
      mac: true,
      viewport: { width: 1440, height: 950 },
    });
    const macPage = await macCtx.newPage();
    await macPage.goto(base, { waitUntil: "domcontentloaded" });
    await gotoView(macPage, "ledger");
    await macPage.waitForSelector("#ledgerQuickForm", { timeout: 15000 });
    await macPage.waitForTimeout(350);
    await macPage.screenshot({
      path: join(outDir, "b11r10-release-ledger-mac-en-light-1440-webkit.png"),
      fullPage: false,
    });
    await macCtx.close();
    await wk.close();

    console.log("capture batch11 round10 done");
  } finally {
    server.kill("SIGTERM");
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
