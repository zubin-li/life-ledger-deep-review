import { spawn } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import assert from "node:assert/strict";
import { hasPlaywright, playwrightRoot } from "./playwright-resolve.mjs";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const port = 5290;
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
  "review habit score inspector renders when panel is open (wide desk layout)",
  { skip: !hasPlaywright },
  async () => {
    const server = await startStaticServer();
    const { chromium } = await import(join(playwrightRoot, "index.mjs"));
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    try {
      await page.addInitScript(() => {
        localStorage.setItem("life-ledger-language", "en");
        localStorage.setItem("life-ledger-demo-dismissed-v1", "1");
      });
      await page.goto(base, { waitUntil: "networkidle" });
      await page.click('.nav-item[data-view="review"]');
      await page.waitForSelector("#reviewView.active", { timeout: 15000 });
      await page.waitForSelector(".review-score-table[open]", { timeout: 8000 });
      const count = await page.locator("#inspectorReviewTable .inspector-stat-list--live article").count();
      assert.ok(count >= 1, `expected habit score rows, got ${count}`);
    } finally {
      await browser.close();
      server.kill("SIGTERM");
    }
  },
);

test(
  "review habit scores populate after expanding collapsed panel on narrow width",
  { skip: !hasPlaywright },
  async () => {
    const server = await startStaticServer();
    const { webkit } = await import(join(playwrightRoot, "index.mjs"));
    const browser = await webkit.launch({ headless: true });
    const page = await browser.newPage({
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true,
    });
    try {
      await page.addInitScript(() => {
        localStorage.setItem("life-ledger-language", "de");
        localStorage.setItem("life-ledger-demo-dismissed-v1", "1");
      });
      await page.goto(base, { waitUntil: "networkidle" });
      await page.click('.nav-item[data-view="review"]');
      await page.waitForSelector("#reviewView.active", { timeout: 15000 });
      const open = await page.locator(".review-score-table").evaluate(el => el.open);
      assert.equal(open, false);
      await page.locator("#reviewScoreSummary").click();
      await page.waitForFunction(
        () => document.querySelectorAll("#inspectorReviewTable .inspector-stat-list--live article").length >= 1,
        { timeout: 8000 },
      );
    } finally {
      await browser.close();
      server.kill("SIGTERM");
    }
  },
);
