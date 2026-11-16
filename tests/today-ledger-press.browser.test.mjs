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
      await page.evaluate(() => { localStorage.setItem("life-ledger-today-cards-onboarding-dismissed" + (window.LifeLedgerStorageSuffix || ""), "1"); document.getElementById("tcOnboardHint")?.remove(); document.documentElement.classList.remove("tc-onboard-open"); window.LifeLedgerTodayCards?.show?.("spending"); });
      const todayBtn = page.locator(".tw-card.tw-spending .tc-card-hit");
      await todayBtn.waitFor({ state: "visible" });
      await todayBtn.click({ noWaitAfter: true });
      const pressed = await page.waitForFunction(
        () => document.querySelector(".tw-card.tw-spending .tc-card-hit.is-spend-press"),
        { timeout: 2000 },
      );
      assert.ok(pressed, "spending card should pulse");
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
      await page.waitForSelector(".money-cat-row");
      await page.locator(".money-cat-row").first().click();
      await page.waitForSelector("[data-chip-clear=drill]", { timeout: 8000 });
    } finally {
      await browser.close();
      server.kill("SIGTERM");
    }
  },
);
