import { spawn } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import assert from "node:assert/strict";
import { hasPlaywright, playwrightRoot } from "./playwright-resolve.mjs";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const port = 5295;
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
  "ledger onboarding dismisses and persists preference",
  { skip: !hasPlaywright },
  async () => {
    const server = await startStaticServer();
    const { webkit } = await import(join(playwrightRoot, "index.mjs"));
    const browser = await webkit.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    try {
      await page.addInitScript(() => localStorage.setItem("life-ledger-language", "de"));
      await page.goto(base, { waitUntil: "networkidle" });
      await page.evaluate(() => localStorage.removeItem("life-ledger-ledger-onboarding-dismissed"));
      await page.evaluate(() => {
        const key = Object.keys(localStorage).find(k => k === "life-ledger-v1" || k.startsWith("life-ledger-v1"));
        if (!key) return;
        let state;
        try {
          state = JSON.parse(localStorage.getItem(key));
        } catch {
          return;
        }
        delete state.ledger;
        localStorage.setItem(key, JSON.stringify(state));
      });
      await page.reload({ waitUntil: "networkidle" });
      await page.click('.nav-item[data-view="ledger"]');
      const onboarding = page.locator("[data-ledger-onboarding]");
      await onboarding.waitFor({ state: "visible", timeout: 8000 });
      const title = await onboarding.locator("strong").textContent();
      assert.match(title || "", /erste Buchung/i);
      await page.click("[data-ledger-hint-dismiss]");
      await onboarding.waitFor({ state: "hidden", timeout: 4000 });
      const stored = await page.evaluate(() => localStorage.getItem("life-ledger-ledger-onboarding-dismissed"));
      assert.equal(stored, "1");
      await page.reload({ waitUntil: "networkidle" });
      await page.click('.nav-item[data-view="ledger"]');
      await page.waitForSelector(".ledger-page");
      assert.equal(await page.locator("[data-ledger-onboarding]").count(), 0);
    } finally {
      await browser.close();
      server.kill("SIGTERM");
    }
  },
);
