import { spawn } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import assert from "node:assert/strict";
import { hasPlaywright, playwrightRoot } from "./playwright-resolve.mjs";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const port = 5291;
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
  "Money legacy block keeps wellness scatters and Review habit deep link",
  { skip: !hasPlaywright },
  async () => {
    const server = await startStaticServer();
    const { chromium } = await import(join(playwrightRoot, "index.mjs"));
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    try {
      await page.addInitScript(() => {
        localStorage.setItem("life-ledger-demo-workspace-dismissed", "1");
        localStorage.setItem("life-ledger-ledger-onboarding-dismissed", "1");
        localStorage.setItem("life-ledger-language", "zh");
      });
      await page.goto(base, { waitUntil: "networkidle" });
      await page.locator('.nav-item[data-view="ledger"]').click();
      await page.waitForTimeout(400);
      const legacy = page.locator(".ledger-legacy-viz");
      await legacy.waitFor({ state: "attached", timeout: 8000 });
      const section = legacy.locator(".ledger-wellness-insights");
      await assert.ok(await section.count() === 1);
      await assert.ok(await section.locator(".review-mood-scatter, .review-habit-scatter").count() >= 1);
      await page.evaluate(() => {
        document.querySelector('.ledger-legacy-viz [data-ledger-review-scatter="review-scatter-habit"]')?.click();
      });
      await page.waitForTimeout(500);
      await assert.ok(await page.locator('.nav-item[data-view="review"].active').count() === 1);
      const habitScatter = page.locator("#review-scatter-habit");
      await assert.doesNotReject(() => habitScatter.waitFor({ state: "visible", timeout: 5000 }));
      await assert.ok(await habitScatter.evaluate(el => el.classList.contains("is-scatter-spotlight") || el.classList.contains("is-scatter-spotlight-static")));
    } finally {
      await browser.close();
      server.kill("SIGTERM");
    }
  },
);

test(
  "Review page wellness scatter dots show tooltip on focus",
  { skip: !hasPlaywright },
  async () => {
    const server = await startStaticServer();
    const { chromium } = await import(join(playwrightRoot, "index.mjs"));
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    try {
      await page.addInitScript(() => {
        localStorage.setItem("life-ledger-demo-workspace-dismissed", "1");
        localStorage.setItem("life-ledger-ledger-onboarding-dismissed", "1");
        localStorage.setItem("life-ledger-language", "en");
      });
      await page.goto(base, { waitUntil: "networkidle" });
      await page.locator('.nav-item[data-view="review"]').click();
      await page.waitForSelector("#reviewLedgerSummary .review-scatter-dot-hit", { timeout: 8000 });
      const dot = page.locator("#reviewLedgerSummary .review-scatter-dot-hit").first();
      await dot.focus();
      const tip = page.locator("#reviewLedgerSummary .review-scatter-tip");
      await page.waitForSelector("#reviewLedgerSummary .review-scatter-tip:not([hidden])", { timeout: 5000 });
      await assert.ok((await tip.locator("strong").textContent())?.length > 0);
    } finally {
      await browser.close();
      server.kill("SIGTERM");
    }
  },
);
