import { spawn } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import assert from "node:assert/strict";
import { hasPlaywright, playwrightRoot } from "./playwright-resolve.mjs";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const port = 5293;
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

async function seedDemoLedger(page) {
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
    state.ledger = window.LifeLedgerLedger.buildDemoSample({
      now,
      lang: localStorage.getItem("life-ledger-language") || "en",
      contentSeed: 42,
    });
    const habitIds = (state.habits || []).map(h => h.id);
    window.LifeLedgerLedger.alignDemoMoodWithSpend?.(state.logs, state.ledger, now);
    window.LifeLedgerLedger.alignDemoHabitCompletionWithSpend?.(state.logs, state.ledger, habitIds, now);
    state.focusSessions =
      window.LifeLedgerLedger.alignDemoFocusWithSpend?.(state.focusSessions, state.ledger, now) ??
      state.focusSessions;
    localStorage.setItem(key, JSON.stringify(state));
  });
}

test(
  "Review scatter jump chip gets is-jump-press on click",
  { skip: !hasPlaywright },
  async () => {
    const server = await startStaticServer();
    const { webkit } = await import(join(playwrightRoot, "index.mjs"));
    const browser = await webkit.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    try {
      await page.goto(base, { waitUntil: "networkidle" });
      await page.evaluate(() => {
        localStorage.setItem("life-ledger-language", "en");
        localStorage.setItem("life-ledger-demo-dismissed-v1", "1");
      });
      await seedDemoLedger(page);
      await page.reload({ waitUntil: "networkidle" });
      await page.locator('.nav-item[data-view="review"]').click();
      await page.waitForSelector(".review-scatter-jump-chip", { state: "visible" });
      const chip = page.locator('[data-review-scatter-jump="review-scatter-mood"]');
      await chip.click({ noWaitAfter: true });
      const pressed = await page.waitForFunction(
        () => document.querySelector(".review-scatter-jump-chip.is-jump-press"),
        { timeout: 2000 },
      );
      assert.ok(pressed, "mood jump chip should pulse before scroll");
    } finally {
      await browser.close();
      server.kill("SIGTERM");
    }
  },
);
