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
  "Money heatmap day tap filters transaction list",
  { skip: !hasPlaywright },
  async () => {
    const server = await startStaticServer();
    const { webkit } = await import(join(playwrightRoot, "index.mjs"));
    const browser = await webkit.launch({ headless: true });
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      hasTouch: true,
    });
    const page = await context.newPage();
    try {
      await page.addInitScript(() => {
        localStorage.setItem("life-ledger-demo-workspace-dismissed", "1");
        localStorage.setItem("life-ledger-ledger-onboarding-dismissed", "1");
        localStorage.setItem("life-ledger-language", "de");
      });
      await page.goto(base, { waitUntil: "networkidle" });
      await page.locator('.nav-item[data-view="ledger"]').click();
      await page.waitForSelector(".ledger-daily-strip [data-ledger-day], .ledger-heat-grid [data-ledger-day]", { timeout: 10000 });
      const hot = page.locator("[data-ledger-day].ledger-heat-1, [data-ledger-day].ledger-heat-2, [data-ledger-day].ledger-heat-3, [data-ledger-day].ledger-heat-4").first();
      await hot.scrollIntoViewIfNeeded();
      await hot.click({ force: true });
      await page.waitForSelector(".ledger-day-filter-chip", { timeout: 3000 });
      const after = await page.locator(".ledger-tx").count();
      assert.ok(after >= 1);
      await page.locator("[data-ledger-clear-day]").click();
      await page.waitForSelector(".ledger-day-filter-chip", { state: "detached", timeout: 3000 });
    } finally {
      await browser.close();
      server.kill("SIGTERM");
    }
  },
);
