/**
 * Mac shell + Today ledger sheet screenshot (headless WebKit only).
 * Usage: node .overnight/capture-mac.mjs [--port 5293] [--prefix fb-r4-mac]
 */
import { readFileSync } from "node:fs";
import { mkdir } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";
import { webkit } from "/Users/ashan/Documents/Codex/ll-web-cards/node_modules/playwright/index.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, "..");
const outDir = join(here, "shots");
const shellJs = readFileSync(join(repoRoot, "desktop/mac/shell.js"), "utf8");
const shellCss = readFileSync(join(repoRoot, "desktop/mac/shell.css"), "utf8");

const args = process.argv.slice(2);
const portIdx = args.indexOf("--port");
const prefixIdx = args.indexOf("--prefix");
const port = Number(portIdx >= 0 ? args[portIdx + 1] : 5293);
const prefix = prefixIdx >= 0 ? args[prefixIdx + 1] : "fb-r4-mac";
const base = `http://127.0.0.1:${port}/index.html?mode=local&local-preview=demo-showcase-v1`;

await mkdir(outDir, { recursive: true });

const server = spawn("python3", ["-m", "http.server", String(port), "--bind", "127.0.0.1"], {
  cwd: join(repoRoot, "public"),
  stdio: "ignore",
});
await new Promise(r => setTimeout(r, 500));

const browser = await webkit.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 1440, height: 950 },
  deviceScaleFactor: 2,
  colorScheme: "light",
});
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
await context.addInitScript(() => {
  localStorage.setItem("life-ledger-language", "zh");
  localStorage.setItem("life-ledger-demo-dismissed-v1", "1");
});
const page = await context.newPage();
await page.goto(base, { waitUntil: "networkidle" });
await page.waitForSelector("#todayView.active");
await page.locator(".tw-spend-today").click();
await page.waitForSelector("#todayLedgerSheet.is-open");
await page.waitForTimeout(220);
const name = `${prefix}-today-sheet-zh-light-1440-webkit.png`;
await page.screenshot({ path: join(outDir, name), fullPage: false });
console.log("wrote", name);

await browser.close();
server.kill("SIGTERM");
