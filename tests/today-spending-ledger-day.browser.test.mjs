import { spawn } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import assert from "node:assert/strict";
import { hasPlaywright, playwrightRoot } from "./playwright-resolve.mjs";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const port = 5293;
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
  "Today spending card opens Money with planning day filter",
  { skip: !hasPlaywright },
  async () => {
    const server = await startStaticServer();
    const { chromium } = await import(join(playwrightRoot, "index.mjs"));
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    try {
      await page.addInitScript(() => {
        localStorage.setItem("life-ledger-language", "zh");
        localStorage.setItem("life-ledger-demo-dismissed-v1", "1");
        localStorage.setItem("life-ledger-ledger-onboarding-dismissed", "1");
      });
      await page.goto(base, { waitUntil: "networkidle" });
      await page.waitForSelector(".tw-card.tw-spending .tw-spend-today");
      await page.locator(".tw-spend-open").click();
      await page.waitForSelector("#ledgerView.view.active", { timeout: 10000 });
      await page.waitForSelector("[data-ledger-clear-day]", { timeout: 8000 });
      const selectedHeat = await page.locator(".ledger-heat.is-selected").getAttribute("data-ledger-day");
      assert.ok(selectedHeat && /^\d{4}-\d{2}-\d{2}$/.test(selectedHeat), "expected heatmap day selection");
      await page.waitForSelector(".ledger-day-filter-chip", { timeout: 3000 });
    } finally {
      await browser.close();
      server.kill("SIGTERM");
    }
  },
);
