import { spawn } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import assert from "node:assert/strict";
import { hasPlaywright, playwrightRoot } from "./playwright-resolve.mjs";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const port = 5294;
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
  "Long-range workspace shows polished empty phase art and CTA",
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
        state.planning = { phases: [], currentPhaseId: "", note: "", updatedAt: 0 };
        state.longTermGoals = [];
        localStorage.setItem(key, JSON.stringify(state));
      });
      await page.reload({ waitUntil: "domcontentloaded" });
      await page.click('.nav-item[data-view="longrange"]');
      await page.waitForSelector("#horizonEmptyStartPhase", { timeout: 15000 });
      const phaseEmpty = page.locator("#longrangeView .horizon-phase-empty .hairline-mount svg");
      await phaseEmpty.waitFor({ state: "attached", timeout: 10000 });
      const quiet = page.locator("#longrangeView .horizon-quiet-empty .hairline-mount svg").first();
      await quiet.waitFor({ state: "attached", timeout: 10000 });
      const cta = page.locator("#horizonEmptyStartPhase");
      await cta.click();
      await page.waitForSelector("#horizonDialog[open]", { timeout: 8000 });
      assert.match(await page.locator("#horizonDialogTitle").innerText(), /阶段|Phase/i);
    } finally {
      await browser.close();
      server.kill("SIGTERM");
    }
  },
);

test(
  "Long-range empty art renders in WebKit",
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
        state.planning = { phases: [], currentPhaseId: "", note: "", updatedAt: 0 };
        state.longTermGoals = [];
        localStorage.setItem(key, JSON.stringify(state));
      });
      await page.reload({ waitUntil: "domcontentloaded" });
      await page.click('.nav-item[data-view="longrange"]');
      await page.waitForSelector("#longrangeView .horizon-phase-empty .hairline-mount svg", { timeout: 15000 });
    } finally {
      await browser.close();
      server.kill("SIGTERM");
    }
  },
);
