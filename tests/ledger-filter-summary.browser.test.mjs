import { spawn } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import assert from "node:assert/strict";
import { hasPlaywright, playwrightRoot } from "./playwright-resolve.mjs";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const port = 5294;
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
  "Money day + category filters show subtotal and clear all",
  { skip: !hasPlaywright },
  async () => {
    const server = await startStaticServer();
    const { chromium } = await import(join(playwrightRoot, "index.mjs"));
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();
    try {
      await page.addInitScript(() => {
        localStorage.setItem("life-ledger-demo-workspace-dismissed", "1");
        localStorage.setItem("life-ledger-ledger-onboarding-dismissed", "1");
        localStorage.setItem("life-ledger-language", "en");
      });
      await page.goto(base, { waitUntil: "networkidle" });
      await page.locator('.nav-item[data-view="ledger"]').click();
      await page.waitForSelector(".ledger-heat-grid [data-ledger-day]", { timeout: 10000 });
      const hot = page.locator("[data-ledger-day].ledger-heat-1, [data-ledger-day].ledger-heat-2, [data-ledger-day].ledger-heat-3, [data-ledger-day].ledger-heat-4").first();
      await hot.click();
      await page.waitForSelector(".ledger-day-filter-chip", { timeout: 3000 });
      const seg = page.locator(".ledger-donut-segments .ledger-cat-seg").first();
      await seg.evaluate(el => {
        el.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
      });
      await page.waitForSelector(".ledger-category-filter-chip", { timeout: 3000 });
      const sum = page.locator(".ledger-list-filter-sum");
      const sumCount = await sum.count();
      if (sumCount === 0) {
        await page.waitForSelector(".ledger-list-empty--combo", { timeout: 3000 });
        await page.locator("#ledgerListEmptyClearAll").click();
      } else {
        await sum.waitFor({ timeout: 3000 });
        const copy = await sum.locator(".ledger-list-filter-sum-copy").textContent();
        assert.match(copy || "", /\d/);
        await page.locator("[data-ledger-clear-all-filters]").click();
      }
      await page.waitForSelector(".ledger-day-filter-chip", { state: "detached", timeout: 5000 });
      await page.waitForSelector(".ledger-category-filter-chip", { state: "detached", timeout: 5000 });
      const txs = await page.locator(".ledger-tx").count();
      assert.ok(txs > 0);
    } finally {
      await browser.close();
      server.kill("SIGTERM");
    }
  },
);
