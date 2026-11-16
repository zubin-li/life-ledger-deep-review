import { spawn } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import assert from "node:assert/strict";
import { hasPlaywright, playwrightRoot } from "./playwright-resolve.mjs";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const port = 5289;
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
  "Today demo opens Review scatters for mood and habit spending",
  { skip: !hasPlaywright },
  async () => {
    const server = await startStaticServer();
    const { chromium } = await import(join(playwrightRoot, "index.mjs"));
    const browser = await chromium.launch({ headless: true });
    try {
      const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
      await page.addInitScript(() => {
        localStorage.removeItem("life-ledger-preview-demo-showcase-v1");
        localStorage.setItem("life-ledger-language", "zh");
        localStorage.setItem("life-ledger-demo-dismissed-v1", "1");
        localStorage.setItem("life-ledger-ledger-onboarding-dismissed", "1");
      });
      await page.goto(base, { waitUntil: "domcontentloaded" });
      await page.locator('.nav-item[data-view="review"]').click();
      await page.waitForSelector("#reviewView.view.active", { timeout: 8000 });
      await page.waitForSelector("#review-scatter-mood", { timeout: 8000 });
      await page.waitForSelector("#review-scatter-habit", { timeout: 8000 });
      const hints = await page.locator("#todayHabitSpendHint, #todayMoodSpendHint").count();
      assert.equal(hints, 0);
    } finally {
      await browser.close();
      server.kill("SIGTERM");
    }
  },
);
