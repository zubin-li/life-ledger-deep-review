import { readFileSync } from "node:fs";
import { spawn } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import assert from "node:assert/strict";
import { hasPlaywright, playwrightRoot } from "./playwright-resolve.mjs";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const port = 5318;
const localBase = `http://127.0.0.1:${port}/index.html?mode=local`;
const cloudBase = `http://127.0.0.1:${port}/index.html?mode=cloudflare`;
const SHELL_JS = readFileSync(join(repoRoot, "desktop/mac/shell.js"), "utf8");

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
  "Insights nav is cloud-only; the Mac shell opens it there and ignores it locally",
  { skip: !hasPlaywright },
  async () => {
    const server = await startStaticServer();
    const { webkit } = await import(join(playwrightRoot, "index.mjs"));
    const browser = await webkit.launch({ headless: true });
    const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    await context.addInitScript(js => { new Function(js)(); }, SHELL_JS);
    await context.addInitScript(() => {
      localStorage.setItem("life-ledger-language", "zh");
      localStorage.setItem("life-ledger-demo-dismissed-v1", "1");
    });
    const page = await context.newPage();
    try {
      await page.goto(localBase, { waitUntil: "domcontentloaded" });
      await page.waitForSelector("#todayView.view.active", { timeout: 15000 });
      assert.equal(await page.locator('.nav-item[data-view="insights"]').isVisible(), false);
      await page.evaluate(() => window.LifeLedgerMac.handle("view:insights"));
      assert.equal(await page.locator("#insightsView.view.active").count(), 0);
      assert.equal(await page.locator("#todayView.view.active").count(), 1);

      await page.goto(cloudBase, { waitUntil: "domcontentloaded" });
      await page.waitForSelector('.nav-item[data-view="insights"]', { state: "visible", timeout: 15000 });
      await page.evaluate(() => window.LifeLedgerMac.handle("view:insights"));
      await page.waitForSelector("#insightsView.view.active", { timeout: 15000 });
      await page.waitForSelector("#insightsWorkspace .insights-empty", { timeout: 15000 });
      const title = await page.locator("#insightsPageTitle").textContent();
      assert.match(title || "", /洞见/);
      await page.waitForSelector("#insightsWorkspace .ll-art svg", { timeout: 15000 });
      assert.equal(await page.locator('.nav-item[data-view="insights"].active').count(), 1);
    } finally {
      await browser.close();
      server.kill("SIGTERM");
    }
  },
);
