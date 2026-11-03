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
  "Sidebar nav and ledger category chips get press classes on click",
  { skip: !hasPlaywright },
  async () => {
    const server = await startStaticServer();
    const { chromium, webkit } = await import(join(playwrightRoot, "index.mjs"));
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    try {
      await page.goto(base, { waitUntil: "networkidle" });
      await page.evaluate(() => {
        localStorage.setItem("life-ledger-language", "en");
        localStorage.setItem("life-ledger-demo-dismissed-v1", "1");
        localStorage.setItem("life-ledger-ledger-onboarding-dismissed", "1");
      });
      const weekNav = page.locator('.nav-item[data-view="week"]');
      await weekNav.click({ noWaitAfter: true });
      const navPressed = await page.waitForFunction(
        () => document.querySelector('.nav-item[data-view="week"].is-nav-press'),
        { timeout: 2000 },
      );
      assert.ok(navPressed, "week nav should pulse on switch");

      await page.locator('.nav-item[data-view="ledger"]').click();
      await page.waitForSelector(".ledger-chip", { state: "visible" });
      const chip = page.locator(".ledger-chip").first();
      await chip.click({ noWaitAfter: true });
      const chipPressed = await page.waitForFunction(
        () => document.querySelector("button.ledger-chip.is-chip-press"),
        { timeout: 2000 },
      );
      assert.ok(chipPressed, "category chip should pulse on tap");
    } finally {
      await browser.close();
      server.kill("SIGTERM");
    }
  },
);

test(
  "Ledger category chip press on WebKit mobile width",
  { skip: !hasPlaywright },
  async () => {
    const server = await startStaticServer();
    const { webkit } = await import(join(playwrightRoot, "index.mjs"));
    const browser = await webkit.launch({ headless: true });
    const page = await browser.newPage({
      viewport: { width: 390, height: 844 },
      hasTouch: true,
      isMobile: true,
    });
    try {
      await page.goto(base, { waitUntil: "networkidle" });
      await page.evaluate(() => {
        localStorage.setItem("life-ledger-language", "de");
        localStorage.setItem("life-ledger-demo-dismissed-v1", "1");
        localStorage.setItem("life-ledger-ledger-onboarding-dismissed", "1");
      });
      await page.locator('.nav-item[data-view="ledger"]').click();
      await page.waitForSelector(".ledger-chip", { state: "visible" });
      const chip = page.locator(".ledger-chip").first();
      await chip.click({ noWaitAfter: true });
      const chipPressed = await page.waitForFunction(
        () => document.querySelector("button.ledger-chip.is-chip-press"),
        { timeout: 2000 },
      );
      assert.ok(chipPressed, "de mobile chip press");
    } finally {
      await browser.close();
      server.kill("SIGTERM");
    }
  },
);
