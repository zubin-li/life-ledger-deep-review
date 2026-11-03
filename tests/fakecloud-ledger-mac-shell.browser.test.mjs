import { readFileSync } from "node:fs";
import { spawn, execFile } from "node:child_process";
import { promisify } from "node:util";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import assert from "node:assert/strict";
import { hasPlaywright, playwrightRoot } from "./playwright-resolve.mjs";

const execFileAsync = promisify(execFile);
const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const port = 5297;
const base = `http://127.0.0.1:${port}/index.html?mode=cloudflare&local-preview=demo-showcase-v1`;
const SHELL_JS = readFileSync(join(repoRoot, "desktop/mac/shell.js"), "utf8");
const SHELL_CSS = readFileSync(join(repoRoot, "desktop/mac/shell.css"), "utf8");

async function waitForHttp(url, attempts = 120) {
  for (let i = 0; i < attempts; i += 1) {
    try {
      await execFileAsync("curl", ["-sf", "-o", "/dev/null", url]);
      return;
    } catch {
      await new Promise(r => setTimeout(r, 500));
    }
  }
  throw new Error(`Server did not respond: ${url}`);
}

function startFakecloud() {
  return spawn("bash", [join(repoRoot, ".overnight/fakecloud.sh"), String(port)], {
    cwd: repoRoot,
    stdio: "ignore",
    detached: true,
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
  "Mac shell fakecloud online demo opens Money with ledger rows",
  { skip: !hasPlaywright, timeout: 240_000 },
  async () => {
    const fakecloud = startFakecloud();
    try {
      await waitForHttp(base);
      const { webkit } = await import(join(playwrightRoot, "index.mjs"));
      const browser = await webkit.launch({ headless: true });
      const context = await browser.newContext({
        viewport: { width: 1440, height: 900 },
        deviceScaleFactor: 2,
      });
      await context.addInitScript(macShellInitScript(), { js: SHELL_JS, css: SHELL_CSS });
      await context.addInitScript(() => {
        localStorage.clear();
        localStorage.setItem("life-ledger-demo-workspace-dismissed", "1");
        localStorage.setItem("life-ledger-ledger-onboarding-dismissed", "1");
        localStorage.setItem("life-ledger-language", "de");
      });
      const page = await context.newPage();
      try {
        await page.goto(base, { waitUntil: "networkidle", timeout: 90_000 });
        await page.waitForSelector(".tc-grid", { timeout: 45_000 });
        await page.waitForFunction(() => document.querySelector("#saveMode")?.classList.contains("cloud"), {
          timeout: 90_000,
        });
        await page.waitForTimeout(2000);

        const hasMac = await page.evaluate(() => document.documentElement.classList.contains("ll-mac"));
        assert.equal(hasMac, true, "expected Mac shell class on html");

        await page.locator('.nav-item[data-view="ledger"]').click();
        await page.waitForSelector("#ledgerView.view.active", { timeout: 45_000 });
        await page.waitForSelector("#ledgerQuickInput", { timeout: 45_000 });
        const txCount = await page.locator(".ledger-tx").count();
        assert.ok(txCount > 3, `expected demo transactions in Mac online Money view, got ${txCount}`);

        const navLabel = await page.locator('.nav-item[data-view="ledger"]').textContent();
        assert.match(navLabel || "", /Finanzen|Geld|记账/i);

        await page.waitForSelector('[data-ledger-sum="expense"]', { timeout: 15_000 });
        const expense = await page.locator('[data-ledger-sum="expense"]').textContent();
        assert.ok(expense && expense.trim().length > 2, "month expense summary should render");
      } finally {
        await context.close();
        await browser.close();
      }
    } finally {
      try {
        process.kill(-fakecloud.pid, "SIGTERM");
      } catch {
        fakecloud.kill("SIGTERM");
      }
    }
  },
);
