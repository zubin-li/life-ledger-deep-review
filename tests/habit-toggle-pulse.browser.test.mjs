import { spawn } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import assert from "node:assert/strict";
import { hasPlaywright, playwrightRoot } from "./playwright-resolve.mjs";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const port = 5296;
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
  "Today habit complete adds just-checked pulse",
  { skip: !hasPlaywright },
  async () => {
    const server = await startStaticServer();
    const { webkit } = await import(join(playwrightRoot, "index.mjs"));
    const browser = await webkit.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    try {
      await page.addInitScript(() => {
        localStorage.setItem("life-ledger-language", "en");
        localStorage.setItem("life-ledger-demo-dismissed-v1", "1");
      });
      await page.goto(base, { waitUntil: "networkidle" });
      const card = page.locator("#todayHabits .habit-card:not(.completed)").first();
      await card.waitFor({ state: "visible", timeout: 8000 });
      await card.click();
      await page.waitForFunction(
        () => {
          const c = document.querySelector("#todayHabits .habit-card.just-checked, #todayHabits .habit-card.completed");
          return Boolean(c);
        },
        null,
        { timeout: 3000 },
      );
      const bumped = await page.evaluate(() => document.querySelector("#progressOrbit")?.classList.contains("is-progress-bump"));
      assert.equal(bumped, true);
    } finally {
      await browser.close();
      server.kill("SIGTERM");
    }
  },
);

test(
  "Week goal toggle adds just-toggled feedback",
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
      await page.locator('.nav-item[data-view="week"]').click();
      await page.waitForSelector("#weekView.active");
      const goal = page.locator(".weekly-goal:not(.done) .weekly-goal-check").first();
      if (await goal.count() === 0) {
        await page.locator("#weeklyGoalInput").fill("Overnight pulse check");
        await page.keyboard.press("Enter");
        await page.waitForSelector(".weekly-goal:not(.done)");
      }
      await page.locator(".weekly-goal:not(.done) .weekly-goal-check").first().click();
      await page.waitForFunction(
        () => document.querySelector(".weekly-goal.just-toggled") || document.querySelector(".weekly-goal.done"),
        null,
        { timeout: 3000 },
      );
    } finally {
      await browser.close();
      server.kill("SIGTERM");
    }
  },
);
