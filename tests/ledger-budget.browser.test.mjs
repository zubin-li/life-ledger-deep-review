import { spawn } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import assert from "node:assert/strict";
import { hasPlaywright, playwrightRoot } from "./playwright-resolve.mjs";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const port = 5297;
const base = `http://127.0.0.1:${port}/index.html?mode=local`;

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
  "ledger budget popover uses stored zh UI strings without preference-set flag",
  { skip: !hasPlaywright },
  async () => {
    const server = await startStaticServer();
    const { chromium } = await import(join(playwrightRoot, "index.mjs"));
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    try {
      await page.addInitScript(() => localStorage.setItem("life-ledger-language", "zh"));
      await page.goto(base, { waitUntil: "networkidle" });
      await page.evaluate(() => {
        const key = Object.keys(localStorage).find(k => k === "life-ledger-v1" || k.startsWith("life-ledger-v1"));
        if (!key || !window.LifeLedgerLedger) return;
        let state;
        try { state = JSON.parse(localStorage.getItem(key)); } catch { return; }
        state.ledger = window.LifeLedgerLedger.buildDemoSample({
          now: new Date("2026-11-18T12:00:00"),
          lang: "zh",
          contentSeed: 42,
        });
        localStorage.setItem(key, JSON.stringify(state));
      });
      await page.reload({ waitUntil: "networkidle" });
      await page.click('.nav-item[data-view="ledger"]');
      await page.waitForSelector(".ledger-budget-add");
      await page.click(".ledger-budget-add");
      await page.waitForSelector(".ledger-budget-form header strong");
      const title = await page.locator(".ledger-budget-form header strong").textContent();
      assert.equal(title?.trim(), "设置预算");
      const kicker = await page.locator(".ledger-header .kicker").textContent();
      assert.equal(kicker?.trim(), "记账");
    } finally {
      await browser.close();
      server.kill("SIGTERM");
    }
  },
);
