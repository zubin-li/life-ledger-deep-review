import { spawn } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import assert from "node:assert/strict";
import { hasPlaywright, playwrightRoot } from "./playwright-resolve.mjs";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const port = 5295;
const base = `http://127.0.0.1:${port}/index.html?mode=local&local-preview=demo-showcase-v1`;

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

test(
  "local preview skips the service worker and Money still renders",
  { skip: !hasPlaywright, timeout: 120_000 },
  async () => {
    const server = await startStaticServer();
    const { chromium } = await import(join(playwrightRoot, "index.mjs"));
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await context.newPage();
    try {
      await page.addInitScript(() => {
        localStorage.setItem("life-ledger-demo-dismissed-v1", "1");
        localStorage.setItem("life-ledger-ledger-onboarding-dismissed", "1");
        localStorage.setItem("life-ledger-language", "de");
      });
      await page.goto(base, { waitUntil: "networkidle", timeout: 90_000 });
      await page.waitForFunction(
        async () => {
          if (typeof window.LifeLedgerLedger === "undefined") return false;
          const regs = await navigator.serviceWorker?.getRegistrations?.() || [];
          return regs.length === 0 && !navigator.serviceWorker?.controller;
        },
        null,
        { timeout: 20_000 },
      );
      await page.locator('.nav-item[data-view="ledger"]').click();
      await page.waitForSelector("#ledgerView.view.active", { timeout: 30_000 });
      await page.waitForSelector(".money-tx", { timeout: 30_000 });
      const hasRows = (await page.locator(".money-tx").count()) > 0;
      assert.equal(hasRows, true, "demo ledger transactions should render");
    } finally {
      await context.close();
      await browser.close();
      server.kill("SIGTERM");
    }
  },
);
