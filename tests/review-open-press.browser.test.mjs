import { spawn } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import assert from "node:assert/strict";
import { hasPlaywright, playwrightRoot } from "./playwright-resolve.mjs";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const port = 5292;
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
  "Review Open Money header button gets is-stat-press on click",
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
      await page.locator('.nav-item[data-view="review"]').click();
      await page.waitForSelector("button[data-open-ledger]");
      const btn = page.locator("button[data-open-ledger]");
      await btn.click({ noWaitAfter: true });
      const pressed = await page.waitForFunction(
        () => document.querySelector("button[data-open-ledger].is-stat-press"),
        { timeout: 2000 },
      );
      assert.ok(pressed, "header Open Money should pulse before navigation");
    } finally {
      await browser.close();
      server.kill("SIGTERM");
    }
  },
);
