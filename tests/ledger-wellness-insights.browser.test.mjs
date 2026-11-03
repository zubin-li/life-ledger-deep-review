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
  "Review scatter jump chips focus habit chart with spotlight",
  { skip: !hasPlaywright },
  async () => {
    const server = await startStaticServer();
    const { chromium } = await import(join(playwrightRoot, "index.mjs"));
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    try {
      await page.addInitScript(() => {
        localStorage.setItem("life-ledger-demo-workspace-dismissed", "1");
        localStorage.setItem("life-ledger-ledger-onboarding-dismissed", "1");
        localStorage.setItem("life-ledger-language", "zh");
      });
      await page.goto(base, { waitUntil: "networkidle" });
      await page.locator('.nav-item[data-view="review"]').click();
      await page.waitForSelector(".review-scatter-jump-chip[data-review-scatter-jump='review-scatter-habit']", {
        state: "attached",
        timeout: 8000,
      });
      await page.waitForSelector(".review-scatter-grid:not(.is-scatter-pending)", { timeout: 12000 });
      await page.evaluate(() => {
        document.querySelector('.review-scatter-jump-chip[data-review-scatter-jump="review-scatter-habit"]')?.click();
      });
      await page.waitForFunction(
        () => {
          const el = document.getElementById("review-scatter-habit");
          return el && (el.classList.contains("is-scatter-spotlight") || el.classList.contains("is-scatter-spotlight-static"));
        },
        { timeout: 5000 },
      );
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
