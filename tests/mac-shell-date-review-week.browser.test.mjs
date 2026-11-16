import { readFileSync } from "node:fs";
import { spawn } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import assert from "node:assert/strict";
import { hasPlaywright, playwrightRoot } from "./playwright-resolve.mjs";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const port = 5283;
const base = `http://127.0.0.1:${port}/index.html?mode=local&local-preview=demo-showcase-v1`;
const SHELL_JS = readFileSync(join(repoRoot, "desktop/mac/shell.js"), "utf8");
const SHELL_CSS = readFileSync(join(repoRoot, "desktop/mac/shell.css"), "utf8");

function startStaticServer() {
  return new Promise((resolve, reject) => {
    const proc = spawn("python3", ["-m", "http.server", String(port), "--bind", "127.0.0.1"], {
      cwd: join(repoRoot, "public"),
      stdio: "ignore",
    });
    proc.on("error", reject);
    setTimeout(() => resolve(proc), 400);
  });
}

function macShellInitScript() {
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

test(
  "Mac shell date:prev/next steps Review month and Week range",
  { skip: !hasPlaywright, timeout: 120_000 },
  async () => {
    const server = await startStaticServer();
    const { webkit } = await import(join(playwrightRoot, "index.mjs"));
    const browser = await webkit.launch({ headless: true });
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    await context.addInitScript(macShellInitScript(), { js: SHELL_JS, css: SHELL_CSS });
    await context.addInitScript(() => {
      localStorage.setItem("life-ledger-demo-workspace-dismissed", "1");
      localStorage.setItem("life-ledger-ledger-onboarding-dismissed", "1");
    });
    const page = await context.newPage();
    try {
      await page.goto(base, { waitUntil: "domcontentloaded" });
      await page.waitForSelector(".tc-grid", { timeout: 45000 });
      assert.equal(await page.evaluate(() => document.documentElement.classList.contains("ll-mac")), true);

      await page.locator('.nav-item[data-view="review"]').click();
      await page.waitForSelector("#reviewView.view.active", { timeout: 15000 });
      const reviewBefore = await page.locator("#reviewTitle").textContent();
      await page.evaluate(() => window.LifeLedgerMac?.handle?.("date:prev"));
      await page.waitForFunction(
        prev => {
          const el = document.querySelector("#reviewTitle");
          return el && el.textContent !== prev;
        },
        reviewBefore,
        { timeout: 8000 },
      );
      const reviewMid = await page.locator("#reviewTitle").textContent();
      await page.evaluate(() => window.LifeLedgerMac?.handle?.("date:next"));
      await page.waitForFunction(
        prev => {
          const el = document.querySelector("#reviewTitle");
          return el && el.textContent !== prev;
        },
        reviewMid,
        { timeout: 8000 },
      );

      await page.locator('.nav-item[data-view="week"]').click();
      await page.waitForSelector("#weekView.view.active", { timeout: 15000 });
      const weekBefore = await page.locator("#weekPageTitle").textContent();
      await page.evaluate(() => window.LifeLedgerMac?.handle?.("date:prev"));
      await page.waitForFunction(
        prev => {
          const el = document.querySelector("#weekPageTitle");
          return el && el.textContent !== prev;
        },
        weekBefore,
        { timeout: 8000 },
      );
      const weekMid = await page.locator("#weekPageTitle").textContent();
      await page.evaluate(() => window.LifeLedgerMac?.handle?.("date:next"));
      await page.waitForFunction(
        prev => {
          const el = document.querySelector("#weekPageTitle");
          return el && el.textContent !== prev;
        },
        weekMid,
        { timeout: 8000 },
      );
    } finally {
      await context.close();
      await browser.close();
      server.kill("SIGTERM");
    }
  },
);
