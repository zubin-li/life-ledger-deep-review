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
const base = `http://127.0.0.1:${port}/index.html?mode=local`;
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

async function emptyLedger(page) {
  await page.evaluate(() => {
    const key = Object.keys(localStorage).find(k => k === "life-ledger-v1" || k.startsWith("life-ledger-v1"));
    if (!key || !window.LifeLedgerLedger) return;
    let state;
    try {
      state = JSON.parse(localStorage.getItem(key));
    } catch {
      return;
    }
    state.ledger = window.LifeLedgerLedger.emptyLedger();
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

    const wk = await webkit.launch({ headless: true });
    const mobileCtx = await prepContext(wk, {
      lang: "zh",
      viewport: { width: 390, height: 844 },
    });
    const mobilePage = await mobileCtx.newPage();
    await mobilePage.goto(base, { waitUntil: "domcontentloaded" });
    await emptyLedger(mobilePage);
    await mobilePage.reload({ waitUntil: "domcontentloaded" });
    await mobilePage.click('.nav-item[data-view="ledger"]');
    await mobilePage.waitForSelector("#ledgerQuickInput", { timeout: 15000 });
    await mobilePage.fill("#ledgerQuickInput", "-12,50 午餐");
    await mobilePage.locator("#ledgerQuickForm button[type=submit]").click();
    await mobilePage.waitForSelector(".ledger-tx.is-enter", { timeout: 8000 });
    await mobilePage.waitForTimeout(350);
    await mobilePage.locator("#ledgerView").screenshot({
      path: join(outDir, "b11r2-ledger-quick-entry-zh-light-390-webkit.png"),
    });
    await mobileCtx.close();
    await wk.close();

    const cr = await chromium.launch({ headless: true });
    const deskCtx = await prepContext(cr, { lang: "de", theme: "dark" });
    const deskPage = await deskCtx.newPage();
    await deskPage.goto(base, { waitUntil: "domcontentloaded" });
    await deskPage.click('.nav-item[data-view="ledger"]');
    await deskPage.waitForTimeout(500);
    await deskPage.locator("#ledgerView").screenshot({
      path: join(outDir, "b11r2-ledger-demo-de-dark-1440-chromium.png"),
    });
    await deskCtx.close();
    await cr.close();

    console.log("capture batch11 round2 done");
  } finally {
    server.kill("SIGTERM");
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
