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
  "ledger row long-press opens edit popover on touch",
  { skip: !hasPlaywright },
  async () => {
    const server = await startStaticServer();
    const { webkit } = await import(join(playwrightRoot, "index.mjs"));
    const browser = await webkit.launch({ headless: true });
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      hasTouch: true,
      isMobile: true,
    });
    const page = await context.newPage();
    try {
      await page.addInitScript(() => {
        localStorage.setItem("life-ledger-language", "zh-CN");
        localStorage.setItem("life-ledger-demo-dismissed-v1", "1");
        localStorage.setItem("life-ledger-ledger-onboarding-dismissed", "1");
      });
      await page.goto(base, { waitUntil: "networkidle" });
      await page.click('.nav-item[data-view="ledger"]');
      await page.waitForSelector(".ledger-tx", { timeout: 15000 });
      const row = page.locator(".ledger-tx").first();
      const box = await row.boundingBox();
      assert.ok(box, "transaction row visible");
      const cx = box.x + box.width / 2;
      const cy = box.y + box.height / 2;
      await row.dispatchEvent("pointerdown", { pointerId: 9, pointerType: "touch", clientX: cx, clientY: cy, bubbles: true });
      await page.waitForTimeout(560);
      await row.dispatchEvent("pointerup", { pointerId: 9, pointerType: "touch", clientX: cx, clientY: cy, bubbles: true });
      await page.waitForSelector(".ledger-edit-popover", { timeout: 8000 });
    } finally {
      await context.close();
      await browser.close();
      server.kill("SIGTERM");
    }
  },
);
