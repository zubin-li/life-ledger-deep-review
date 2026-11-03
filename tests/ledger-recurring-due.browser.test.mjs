import { spawn } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import assert from "node:assert/strict";
import { hasPlaywright, playwrightRoot } from "./playwright-resolve.mjs";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const port = 5295;
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
  "ledger recurring due banner posts all pending for current month",
  { skip: !hasPlaywright },
  async () => {
    const server = await startStaticServer();
    const { chromium } = await import(join(playwrightRoot, "index.mjs"));
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    try {
      await page.addInitScript(() => {
        localStorage.setItem("life-ledger-language", "de");
        localStorage.setItem("life-ledger-ledger-onboarding-dismissed", "1");
      });
      await page.goto(base, { waitUntil: "networkidle" });
      await page.evaluate(() => {
        const key = Object.keys(localStorage).find(k => k === "life-ledger-v1" || k.startsWith("life-ledger-v1"));
        if (!key || !window.LifeLedgerLedger) return;
        let state;
        try {
          state = JSON.parse(localStorage.getItem(key));
        } catch {
          return;
        }
        const now = new Date("2026-11-18T12:00:00");
        state.ledger = window.LifeLedgerLedger.buildDemoSample({ now, lang: "de", contentSeed: 42 });
        localStorage.setItem(key, JSON.stringify(state));
      });
      await page.reload({ waitUntil: "networkidle" });
      await page.locator('.nav-item[data-view="ledger"]').first().click({ timeout: 8000 });
      await page.waitForSelector(".ledger-recurring-due", { timeout: 8000 });
      const copy = (await page.locator(".ledger-recurring-due-copy").textContent())?.trim() || "";
      assert.ok(copy.includes("Abonnement") || copy.includes("offen"), "demo subscription recurring should be pending");
      const before = await page.evaluate(() => {
        const key = Object.keys(localStorage).find(k => k === "life-ledger-v1" || k.startsWith("life-ledger-v1"));
        const state = JSON.parse(localStorage.getItem(key));
        return state.ledger.transactions.length;
      });
      await page.locator(".ledger-recurring-due-all").click();
      await page.waitForSelector(".ledger-recurring-due", { state: "detached", timeout: 8000 });
      const after = await page.evaluate(() => {
        const key = Object.keys(localStorage).find(k => k === "life-ledger-v1" || k.startsWith("life-ledger-v1"));
        const state = JSON.parse(localStorage.getItem(key));
        const withRecurring = state.ledger.transactions.filter(t => t.recurringId);
        return { total: state.ledger.transactions.length, tagged: withRecurring.length };
      });
      assert.ok(after.total > before, "post all should add transactions");
      assert.ok(after.tagged >= 1, "posted rows should carry recurringId");
    } finally {
      await browser.close();
      server.kill("SIGTERM");
    }
  },
);
