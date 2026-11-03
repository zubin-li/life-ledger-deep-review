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
const port = 5293;
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
    await page.locator(".tw-card.tw-spending").scrollIntoViewIfNeeded();
    await page.waitForSelector(".tw-card.tw-spending .tw-spend-today", { timeout: 12000 });
    await page.waitForTimeout(300);
    await page.screenshot({ path: join(outDir, "b8r3-today-spending-topcat-zh-light-1440-chromium.png") });

    const emptyCtx = await prepContext(chromiumBrowser, {
      lang: "zh",
      mobile: true,
      viewport: { width: 390, height: 844 },
    });
    const emptyPage = await emptyCtx.newPage();
    await emptyPage.goto(`http://127.0.0.1:${port}/index.html?mode=local`, { waitUntil: "networkidle" });
    await emptyPage.evaluate(() => {
      const key = Object.keys(localStorage).find(k => k.startsWith("life-ledger-v1") || k === "life-ledger-v1");
      if (!key) return;
      let state;
      try {
        state = JSON.parse(localStorage.getItem(key));
      } catch {
        return;
      }
      delete state.ledger;
      localStorage.setItem(key, JSON.stringify(state));
    });
    await emptyPage.reload({ waitUntil: "networkidle" });
    await gotoView(emptyPage, "today");
    await emptyPage.locator(".tw-card.tw-spending").scrollIntoViewIfNeeded();
    await emptyPage.waitForSelector(".tw-spend-hint:not([hidden])", { timeout: 10000 });
    await emptyPage.screenshot({ path: join(outDir, "b8r3-today-spending-empty-zh-light-390-chromium.png") });
    await emptyCtx.close();
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
    await gotoView(mpage, "today");
    await mpage.locator(".tw-card.tw-spending").scrollIntoViewIfNeeded();
    await mpage.waitForTimeout(400);
    await mpage.screenshot({ path: join(outDir, "b8r3-today-spending-de-dark-390-webkit.png") });
    await mctx.close();
    await wk.close();
    await chromiumBrowser.close();
    console.log("Saved b8r3-* to .overnight/shots/");
  } finally {
    server.kill("SIGTERM");
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
