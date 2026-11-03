/**
 * Mac shell screenshots (headless WebKit).
 * Usage: node .overnight/capture-mac.mjs [--port 5295] [--prefix fb-r13-mac] [--only today-sheet,ledger-nav]
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
const onlyIdx = args.indexOf("--only");
const port = Number(portIdx >= 0 ? args[portIdx + 1] : 5295);
const prefix = prefixIdx >= 0 ? args[prefixIdx + 1] : "fb-r13-mac";
const only = onlyIdx >= 0 ? new Set(args[onlyIdx + 1].split(",")) : null;
const base = `http://127.0.0.1:${port}/index.html?mode=local&local-preview=demo-showcase-v1`;

const SHOTS = [
  { id: "today-sheet", view: "today", openSheet: true, w: 1440, h: 950, lang: "zh", theme: "light" },
  { id: "ledger-nav", view: "ledger", w: 1440, h: 950, lang: "zh", theme: "light" },
];

await mkdir(outDir, { recursive: true });

const server = spawn("python3", ["-m", "http.server", String(port), "--bind", "127.0.0.1"], {
  cwd: join(repoRoot, "public"),
  stdio: "ignore",
});
await new Promise(r => setTimeout(r, 500));

const browser = await webkit.launch({ headless: true });

try {
  for (const spec of SHOTS) {
    if (only && !only.has(spec.id)) continue;
    const context = await browser.newContext({
      viewport: { width: spec.w, height: spec.h },
      deviceScaleFactor: 2,
      colorScheme: spec.theme === "dark" ? "dark" : "light",
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
      localStorage.removeItem("life-ledger-nav-order");
    });
    if (spec.theme === "dark") {
      await context.addInitScript(() => { document.documentElement.dataset.theme = "dark"; });
    }
    const page = await context.newPage();
    await page.goto(base, { waitUntil: "networkidle" });
    if (spec.view !== "today") {
      await page.click(`.nav-item[data-view="${spec.view}"]`);
      await page.waitForSelector(`#${spec.view}View.active`);
      await page.waitForTimeout(450);
    } else {
      await page.waitForSelector("#todayView.active");
    }
    if (spec.openSheet) {
      await page.locator(".tw-spend-today").click();
      await page.waitForSelector("#todayLedgerSheet.is-open");
      await page.waitForTimeout(220);
    }
    const name = `${prefix}-${spec.id}-${spec.lang}-${spec.theme}-${spec.w}-webkit.png`;
    await page.screenshot({ path: join(outDir, name), fullPage: false });
    console.log("wrote", name);
    await context.close();
  }
} finally {
  await browser.close();
  server.kill("SIGTERM");
}
