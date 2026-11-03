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
  "Today spending amount and open-ledger buttons pulse on click",
  { skip: !hasPlaywright },
  async () => {
    const server = await startStaticServer();
    const { chromium } = await import(join(playwrightRoot, "index.mjs"));
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    try {
      await page.goto(base, { waitUntil: "networkidle" });
      await page.evaluate(() => {
        localStorage.setItem("life-ledger-language", "zh");
        localStorage.setItem("life-ledger-demo-dismissed-v1", "1");
        localStorage.setItem("life-ledger-ledger-onboarding-dismissed", "1");
      });
      await page.locator('.nav-item[data-view="today"]').click();
      const todayBtn = page.locator("button.tw-spend-today");
      await todayBtn.waitFor({ state: "visible" });
      await todayBtn.click({ noWaitAfter: true });
      const pressed = await page.waitForFunction(
        () => document.querySelector("button.tw-spend-today.is-spend-press"),
        { timeout: 2000 },
      );
      assert.ok(pressed, "tw-spend-today should pulse");
    } finally {
      await browser.close();
      server.kill("SIGTERM");
    }
  },
);

test(
  "Ledger chart mode and heatmap day get press classes",
  { skip: !hasPlaywright },
  async () => {
    const server = await startStaticServer();
    const { webkit } = await import(join(playwrightRoot, "index.mjs"));
    const browser = await webkit.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    try {
      await page.goto(base, { waitUntil: "networkidle" });
      await page.evaluate(() => {
        localStorage.setItem("life-ledger-language", "en");
        localStorage.setItem("life-ledger-demo-dismissed-v1", "1");
        localStorage.setItem("life-ledger-ledger-onboarding-dismissed", "1");
      });
      await page.locator('.nav-item[data-view="ledger"]').click();
      await page.waitForSelector(".ledger-daily-strip [data-ledger-day]");
      const heat = page.locator(".ledger-daily-strip [data-ledger-day]").first();
      await heat.click({ noWaitAfter: true });
      const heatPressed = await page.waitForFunction(
        () => document.querySelector("button.ledger-heat.is-heat-press"),
        { timeout: 2000 },
      );
      assert.ok(heatPressed, "heatmap day should pulse");
    } finally {
      await browser.close();
      server.kill("SIGTERM");
    }
  },
);
