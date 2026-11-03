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
  "Review spending stat opens Money at review month without day filter",
  { skip: !hasPlaywright },
  async () => {
    const server = await startStaticServer();
    const { webkit } = await import(join(playwrightRoot, "index.mjs"));
    const browser = await webkit.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    try {
      await page.addInitScript(() => {
        localStorage.setItem("life-ledger-language", "zh");
        localStorage.setItem("life-ledger-demo-dismissed-v1", "1");
        localStorage.setItem("life-ledger-ledger-onboarding-dismissed", "1");
      });
      await page.goto(base, { waitUntil: "networkidle" });
      await page.locator('.nav-item[data-view="review"]').click();
      await page.waitForSelector("#reviewLedgerSummary .review-ledger-stat-btn");
      await page.locator("#reviewLedgerSummary .review-ledger-stat-btn").first().click();
      await page.waitForSelector("#ledgerView.view.active", { timeout: 10000 });
      await page.waitForSelector(".ledger-day-filter-chip", { state: "detached", timeout: 3000 }).catch(() => {});
      const dayChip = await page.locator(".ledger-day-filter-chip").count();
      assert.equal(dayChip, 0, "expected no day filter when opening from review month stats");
      const selectedHeat = await page.locator(".ledger-heat.is-selected").count();
      assert.equal(selectedHeat, 0, "expected no heatmap day selection");
    } finally {
      await browser.close();
      server.kill("SIGTERM");
    }
  },
);
