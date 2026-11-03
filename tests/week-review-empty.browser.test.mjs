import { spawn } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import assert from "node:assert/strict";
import { hasPlaywright, playwrightRoot } from "./playwright-resolve.mjs";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const port = 5297;
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
  "Week workspace empty goals focus input via CTA",
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
      await page.evaluate(() => {
        const key = Object.keys(localStorage).find(k => k === "life-ledger-v1" || k.startsWith("life-ledger-v1"));
        if (!key) return;
        let state;
        try {
          state = JSON.parse(localStorage.getItem(key));
        } catch {
          return;
        }
        state.weeklyGoals = {};
        state.weeklyOutputs = {};
        localStorage.setItem(key, JSON.stringify(state));
      });
      await page.reload({ waitUntil: "domcontentloaded" });
      await page.click('.nav-item[data-view="week"]');
      await page.waitForSelector("#weekEmptyAddFirstGoal", { timeout: 15000 });
      await page.locator("#weekView .weekly-goals-empty .hairline-mount svg").waitFor({ state: "attached", timeout: 10000 });
      await page.locator("#weekEmptyAddFirstGoal").click();
      await page.waitForFunction(() => document.activeElement?.id === "weeklyGoalInput", null, { timeout: 5000 });
    } finally {
      await browser.close();
      server.kill("SIGTERM");
    }
  },
);

test(
  "Review reflection empty CTA focuses monthly textarea",
  { skip: !hasPlaywright },
  async () => {
    const server = await startStaticServer();
    const { webkit } = await import(join(playwrightRoot, "index.mjs"));
    const browser = await webkit.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    try {
      await page.addInitScript(() => {
        localStorage.setItem("life-ledger-language", "de");
      });
      await page.goto(base, { waitUntil: "domcontentloaded" });
      await page.evaluate(() => {
        const key = Object.keys(localStorage).find(k => k === "life-ledger-v1" || k.startsWith("life-ledger-v1"));
        if (!key) return;
        let state;
        try {
          state = JSON.parse(localStorage.getItem(key));
        } catch {
          return;
        }
        state.reviews = {};
        state.habits = [];
        localStorage.setItem(key, JSON.stringify(state));
      });
      await page.reload({ waitUntil: "domcontentloaded" });
      await page.click('.nav-item[data-view="review"]');
      await page.waitForSelector("#reviewReflectionEmptyWrite", { timeout: 15000 });
      await page.locator("#reviewReflectionEmptyWrite").click();
      await page.waitForFunction(() => document.activeElement?.id === "reviewText", null, { timeout: 5000 });
      assert.ok(await page.locator("#reviewReflectionEmptyHint .hairline-mount svg").count() > 0);
    } finally {
      await browser.close();
      server.kill("SIGTERM");
    }
  },
);
