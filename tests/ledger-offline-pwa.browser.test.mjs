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
  "offline PWA serves ledger scripts and Money view renders",
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
        () => navigator.serviceWorker?.controller && typeof window.LifeLedgerLedger !== "undefined",
        { timeout: 60_000 },
      );
      await page.waitForFunction(
        async () => {
          const cache = await caches.open("life-ledger-pwa-2.1.0");
          const core = await cache.match(new URL("./ledger-core.js?v=2.1.0", location.href).href);
          const ui = await cache.match(new URL("./ledger-ui.js?v=2.1.0", location.href).href);
          return Boolean(core && ui);
        },
        { timeout: 60_000 },
      );

      await context.setOffline(true);
      await page.reload({ waitUntil: "domcontentloaded", timeout: 60_000 });
      await page.waitForFunction(() => typeof window.LifeLedgerLedger !== "undefined", { timeout: 45_000 });

      await page.locator('.nav-item[data-view="ledger"]').click();
      await page.waitForSelector("#ledgerView.view.active", { timeout: 30_000 });
      await page.waitForSelector("#ledgerQuickInput", { timeout: 30_000 });
      const hasRows = (await page.locator(".ledger-tx").count()) > 0;
      assert.equal(hasRows, true, "demo ledger transactions should render while offline");
    } finally {
      await context.close();
      await browser.close();
      server.kill("SIGTERM");
    }
  },
);
