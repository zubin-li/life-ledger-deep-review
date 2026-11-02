import { chromium, webkit } from "/Users/ashan/Documents/Codex/ll-web-cards/node_modules/playwright/index.mjs";
import { readFileSync } from "node:fs";
import { mkdir } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, "..");
const outDir = join(here, "shots");
const port = 5297;
const base = `http://127.0.0.1:${port}/index.html?mode=local`;
const shellJs = readFileSync(join(repoRoot, "desktop", "mac", "shell.js"), "utf8");
const shellCss = readFileSync(join(repoRoot, "desktop", "mac", "shell.css"), "utf8");

async function seedDemo(page) {
  await page.evaluate(() => {
    const key = Object.keys(localStorage).find(k => k === "life-ledger-v1" || k.startsWith("life-ledger-v1"));
    if (!key || !window.LifeLedgerLedger) return;
    let state;
    try { state = JSON.parse(localStorage.getItem(key)); } catch { return; }
    state.ledger = window.LifeLedgerLedger.buildDemoSample({
      now: new Date("2026-11-18T12:00:00"),
      lang: localStorage.getItem("life-ledger-language") || "zh",
      contentSeed: 42,
    });
    localStorage.setItem(key, JSON.stringify(state));
  });
}

async function shot(browser, name, opts = {}) {
  const context = await browser.newContext({
    viewport: opts.viewport || { width: 1440, height: 900 },
    deviceScaleFactor: opts.mac ? 2 : 1,
  });
  if (opts.mac) {
    await context.addInitScript(({ js, css }) => {
      window.__TAURI__ = {
        core: { invoke: async () => null },
        event: { listen: async () => () => {} },
        window: { getCurrentWindow: () => ({ show: async () => {}, isFullscreen: async () => false }) },
        app: { getVersion: async () => "3.1.0" },
      };
      new Function(js)();
      document.addEventListener("DOMContentLoaded", () => {
        const s = document.createElement("style");
        s.textContent = css;
        document.head.append(s);
      });
    }, { js: shellJs, css: shellCss });
  }
  if (opts.lang) await context.addInitScript(l => localStorage.setItem("life-ledger-language", l), opts.lang);
  if (opts.theme) await context.addInitScript(t => { document.documentElement.dataset.theme = t; }, opts.theme);
  const page = await context.newPage();
  await page.goto(base, { waitUntil: "networkidle" });
  if (opts.demo) await seedDemo(page);
  await page.reload({ waitUntil: "networkidle" });
  await page.click('.nav-item[data-view="ledger"]');
  await page.waitForSelector(".ledger-page");
  if (opts.openBudget) {
    await page.click(".ledger-budget-add");
    await page.waitForSelector(".ledger-budget-form header strong");
  } else {
    await page.locator(".ledger-budget-wrap").scrollIntoViewIfNeeded();
  }
  await page.screenshot({ path: join(outDir, name), fullPage: false });
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
    await shot(browser, `ledger-budget-popover-zh-mac-1440-${tag}.png`, {
      mac: true,
      lang: "zh",
      demo: true,
      openBudget: true,
    });
    await shot(browser, `ledger-budget-progress-mac-de-dark-1440-${tag}.png`, {
      mac: true,
      lang: "de",
      theme: "dark",
      demo: true,
    });
    await browser.close();
  }
} finally {
  server.kill();
}

console.log("round9 mac ledger budget shots done");
