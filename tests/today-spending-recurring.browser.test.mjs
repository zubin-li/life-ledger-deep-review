import { spawn } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import assert from "node:assert/strict";
import { hasPlaywright, playwrightRoot } from "./playwright-resolve.mjs";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const port = 5274;
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
  "Today spending card shows recurring pending pill and opens Money banner",
  { skip: !hasPlaywright },
  async () => {
    const server = await startStaticServer();
    const { chromium } = await import(join(playwrightRoot, "index.mjs"));
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    try {
      await page.addInitScript(() => {
        localStorage.setItem("life-ledger-language", "zh");
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
        state.ledger = window.LifeLedgerLedger.buildDemoSample({ now, lang: "zh", contentSeed: 42 });
        localStorage.setItem(key, JSON.stringify(state));
      });
      await page.reload({ waitUntil: "networkidle" });
      const pill = page.locator(".tw-spend-recurring-pill");
      await pill.waitFor({ state: "visible", timeout: 8000 });
      const label = (await pill.textContent())?.trim() || "";
      assert.match(label, /固定待记|1 笔/);
      await pill.click();
      await page.waitForSelector(".ledger-recurring-due", { timeout: 8000 });
      await page.locator(".ledger-recurring-due-all").click();
      await page.waitForSelector(".ledger-recurring-due", { state: "detached", timeout: 8000 });
      await assert.doesNotReject(pill.waitFor({ state: "hidden", timeout: 8000 }));
    } finally {
      await browser.close();
      server.kill("SIGTERM");
    }
  },
);
