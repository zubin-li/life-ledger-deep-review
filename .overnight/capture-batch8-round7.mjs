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
const port = 5297;
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
    await page.goto(base, { waitUntil: "domcontentloaded" });
    await page.locator(".tw-card.tw-spending").scrollIntoViewIfNeeded();
    await page.waitForSelector(".tw-spend-compare:not([hidden])", { timeout: 15000 });
    await page.waitForTimeout(500);
    await page.locator(".tw-card.tw-spending").screenshot({
      path: join(outDir, "b8r7-today-spend-yesterday-zh-light-1440-chromium.png"),
    });

    const wk = await webkit.launch({ headless: true });
    const enCtx = await prepContext(wk, {
      lang: "en",
      theme: "light",
      mobile: true,
      viewport: { width: 390, height: 844 },
    });
    const enPage = await enCtx.newPage();
    await enPage.goto(base, { waitUntil: "domcontentloaded" });
    await enPage.locator(".tw-card.tw-spending").scrollIntoViewIfNeeded();
    await enPage.waitForSelector(".tw-spend-compare:not([hidden])", { timeout: 15000 });
    await enPage.waitForTimeout(400);
    await enPage.locator(".tw-card.tw-spending").screenshot({
      path: join(outDir, "b8r7-today-spend-yesterday-en-light-390-webkit.png"),
    });

    await enCtx.close();
    await wk.close();
    await ctx.close();
    await chromiumBrowser.close();
  } finally {
    server.kill("SIGTERM");
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
