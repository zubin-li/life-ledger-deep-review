import { spawn } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import assert from "node:assert/strict";
import { hasPlaywright, playwrightRoot } from "./playwright-resolve.mjs";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const port = 5294;
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
  "Money day + category filters show subtotal and clear all",
  { skip: !hasPlaywright },
  async () => {
    const server = await startStaticServer();
    const { chromium } = await import(join(playwrightRoot, "index.mjs"));
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();
    try {
      await page.addInitScript(() => {
        localStorage.setItem("life-ledger-demo-workspace-dismissed", "1");
        localStorage.setItem("life-ledger-ledger-onboarding-dismissed", "1");
        localStorage.setItem("life-ledger-language", "en");
      });
      await page.goto(base, { waitUntil: "networkidle" });
      await page.locator('.nav-item[data-view="ledger"]').click();
      await page.waitForFunction(() => !document.documentElement.classList.contains("ll-view-transition"));
      await page.waitForSelector("#moneyDaily canvas", { timeout: 10000 });
      const chart = page.locator("#moneyDaily canvas");
      await chart.evaluate(el => el.scrollIntoView({ block: "center" }));
      const box = await chart.boundingBox();
      assert.ok(box, "daily chart visible");
      let picked = false;
      for (const x of [0.35, 0.5, 0.7]) {
        await page.mouse.click(box.x + box.width * x, box.y + box.height * 0.45);
        if (await page.locator("[data-chip-clear=day]").count()) { picked = true; break; }
      }
      assert.equal(picked, true);
      await page.locator(".money-cat-row").first().click();
      await page.waitForSelector("[data-chip-clear=drill]", { timeout: 3000 });
      const head = await page.locator("#moneyListCard .module-title").textContent();
      assert.match(head || "", /\d/);
      await page.keyboard.press("Escape");
      await page.waitForSelector("[data-chip-clear=day]", { state: "detached", timeout: 5000 });
      await page.waitForSelector("[data-chip-clear=drill]", { state: "detached", timeout: 5000 });
      const txs = await page.locator(".money-tx").count();
      assert.ok(txs > 0);
    } finally {
      await browser.close();
      server.kill("SIGTERM");
    }
  },
);
