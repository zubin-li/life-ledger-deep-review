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
  "Today demo shows habit and mood spend insight hints with review links",
  { skip: !hasPlaywright },
  async () => {
    const server = await startStaticServer();
    const { chromium, webkit } = await import(join(playwrightRoot, "index.mjs"));
    for (const [name, launcher] of [
      ["chromium", chromium],
      ["webkit", webkit],
    ]) {
      const browser = await launcher.launch({ headless: true });
      const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
      try {
        await page.addInitScript(() => {
          localStorage.removeItem("life-ledger-preview-demo-showcase-v1");
          localStorage.setItem("life-ledger-language", "zh");
          localStorage.setItem("life-ledger-demo-dismissed-v1", "1");
          localStorage.setItem("life-ledger-ledger-onboarding-dismissed", "1");
        });
        await page.goto(base, { waitUntil: "networkidle" });
        const habitHint = page.locator("#todayHabitSpendHint:not([hidden])");
        await habitHint.waitFor({ timeout: 12000 });
        const habitText = await habitHint.textContent();
        assert.match(habitText || "", /近 30 天/);
        assert.match(habitText || "", /复盘里看支出关联/);

        const moodHint = page.locator("#todayMoodSpendHint:not([hidden])");
        await moodHint.waitFor({ timeout: 12000 });
        const moodText = await moodHint.textContent();
        assert.match(moodText || "", /心情较好日/);
        assert.match(moodText || "", /复盘里看心情与支出/);

        await moodHint.locator(".today-insight-hint-link").click();
        await page.waitForSelector("#reviewView.view.active", { timeout: 8000 });
        await page.waitForSelector("#review-scatter-mood", { timeout: 8000 });

        await page.locator('.nav-item[data-view="today"]').click();
        await page.waitForSelector("#todayView.view.active", { timeout: 8000 });
        await habitHint.locator(".today-insight-hint-link").click();
        await page.waitForSelector("#reviewView.view.active", { timeout: 8000 });
        await page.waitForSelector("#review-scatter-habit", { timeout: 8000 });
      } finally {
        await browser.close();
      }
    }
    server.kill("SIGTERM");
  },
);
