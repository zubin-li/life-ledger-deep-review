import { spawn } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import assert from "node:assert/strict";
import { hasPlaywright, playwrightRoot } from "./playwright-resolve.mjs";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const port = 5278;
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
  "weekly journal month filter keeps feed visible without skeleton flash",
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
      });
      await page.goto(base, { waitUntil: "domcontentloaded" });
      await page.locator('.nav-item[data-view="timeline"]').click();
      await page.waitForSelector("#journalFeed.ll-paint-host--ready", { timeout: 15000 });
      const select = page.locator("#journalMonthFilter");
      const optionCount = await select.locator("option").count();
      if (optionCount < 2) return;
      await select.selectOption({ index: 1 });
      await page.waitForSelector("#journalFeed.ll-paint-host--ready", { timeout: 5000 });
      await select.selectOption({ index: optionCount > 2 ? 2 : 0 });
      await page.waitForSelector("#journalFeed.ll-paint-host--ready", { timeout: 5000 });
      const skeletonCount = await page.locator("#journalFeed .ll-skeleton--feed").count();
      assert.equal(skeletonCount, 0, "weekly feed should not inject feed skeleton on filter");
      const ready = await page.locator("#journalFeed.ll-paint-host--ready").count();
      assert.equal(ready, 1, "weekly feed should stay ready after month filter changes");
    } finally {
      await browser.close();
      server.kill("SIGTERM");
    }
  },
);

test(
  "daily journal month filter clears stale veil when photos finish",
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
      });
      await page.goto(base, { waitUntil: "domcontentloaded" });
      await page.locator('.nav-item[data-view="timeline"]').click();
      await page.locator('[data-journal-mode="timeline"]').click();
      await page.waitForSelector("#journalFeed.ll-paint-host--ready", { timeout: 15000 });
      const select = page.locator("#journalMonthFilter");
      const optionCount = await select.locator("option").count();
      if (optionCount < 2) return;
      await select.selectOption({ index: optionCount > 2 ? 2 : 1 });
      await page.waitForSelector("#journalFeed.ll-paint-host--ready", { timeout: 10000 });
      const stale = await page.locator("#journalFeed.ll-paint-host--stale").count();
      assert.equal(stale, 0, "stale class should clear after reload");
      const veil = await page.locator("#journalFeed .ll-stale-veil").count();
      assert.equal(veil, 0, "stale veil should be removed when ready");
    } finally {
      await browser.close();
      server.kill("SIGTERM");
    }
  },
);
