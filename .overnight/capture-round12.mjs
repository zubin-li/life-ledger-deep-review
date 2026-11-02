import { chromium, webkit } from "/Users/ashan/Documents/Codex/ll-web-cards/node_modules/playwright/index.mjs";
import { mkdir } from "node:fs/promises";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const outDir = join(here, "shots");
const SHELL_JS = readFileSync("/Users/ashan/Documents/Codex/ll-overnight/desktop/mac/shell.js", "utf8");
const SHELL_CSS = readFileSync("/Users/ashan/Documents/Codex/ll-overnight/desktop/mac/shell.css", "utf8");
const base = "http://127.0.0.1:5291/index.html?mode=local";

async function shot(browserType, name, opts) {
  const browser = await browserType.launch({ headless: true });
  const contextOpts = { viewport: opts.viewport };
  if (opts.macShell) {
    contextOpts.serviceWorkers = "block";
    contextOpts.deviceScaleFactor = 2;
  }
  const context = await browser.newContext(contextOpts);
  if (opts.macShell) {
    await context.addInitScript(({ js, css }) => {
      window.__TAURI__ = {
        core: { invoke: async () => null },
        event: { listen: async () => () => {} },
        window: { getCurrentWindow: () => ({ show: async () => {}, isFullscreen: async () => false }) },
        app: { getVersion: async () => "3.1.0" },
      };
      document.documentElement.dataset.desktop = "mac";
      const style = document.createElement("style");
      style.textContent = css;
      document.head.appendChild(style);
      const script = document.createElement("script");
      script.textContent = js;
      document.head.appendChild(script);
    }, { js: SHELL_JS, css: SHELL_CSS });
  }
  const page = await context.newPage();
  if (opts.lang) await page.addInitScript(l => localStorage.setItem("life-ledger-language", l), opts.lang);
  if (opts.theme) await page.addInitScript(t => localStorage.setItem("life-ledger-theme", t), opts.theme);
  await page.goto(base, { waitUntil: "networkidle" });
  if (opts.emptyWeekGoals) {
    await page.evaluate(() => {
      const key = Object.keys(localStorage).find(k => k === "life-ledger-v1" || k.startsWith("life-ledger-v1"));
      if (!key) return;
      let state;
      try { state = JSON.parse(localStorage.getItem(key)); } catch { return; }
      state.weeklyGoals = {};
      state.longTermGoals = [];
      localStorage.setItem(key, JSON.stringify(state));
    });
    await page.reload({ waitUntil: "networkidle" });
    await page.click('.nav-item[data-view="week"]');
    await page.waitForTimeout(600);
  }
  if (opts.emptyJournalMonth) {
    await page.evaluate(() => {
      const key = Object.keys(localStorage).find(k => k === "life-ledger-v1" || k.startsWith("life-ledger-v1"));
      if (!key) return;
      let state;
      try { state = JSON.parse(localStorage.getItem(key)); } catch { return; }
      state.logs = {};
      state.meta = state.meta || {};
      state.meta.demo = { active: false };
      localStorage.setItem(key, JSON.stringify(state));
    });
    await page.reload({ waitUntil: "networkidle" });
    await page.click('.nav-item[data-view="timeline"]');
    await page.click('[data-journal-mode="timeline"]');
    await page.waitForTimeout(600);
  }
  if (opts.view === "review") {
    await page.click('.nav-item[data-view="review"]');
    await page.waitForTimeout(800);
  }
  await page.waitForTimeout(400);
  await page.screenshot({ path: join(outDir, `${name}.png`), fullPage: opts.fullPage !== false });
  await browser.close();
}

await mkdir(outDir, { recursive: true });
await shot(webkit, "week-goals-empty-mac-shell-1440", {
  viewport: { width: 1440, height: 950 },
  theme: "light",
  lang: "zh",
  macShell: true,
  fullPage: false,
  emptyWeekGoals: true,
});
await shot(chromium, "journal-empty-zh-light-1440", {
  viewport: { width: 1440, height: 900 },
  theme: "light",
  lang: "zh",
  emptyJournalMonth: true,
});
await shot(chromium, "review-trend-draw-light-1440", {
  viewport: { width: 1440, height: 900 },
  theme: "light",
  view: "review",
});
console.log("round12 shots ok");
