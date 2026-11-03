import { spawn } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import assert from "node:assert/strict";
import { hasPlaywright, playwrightRoot } from "./playwright-resolve.mjs";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const port = 5293;
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
  "ledger desktop shortcuts: N quick entry and arrows change month title",
  { skip: !hasPlaywright },
  async () => {
    const server = await startStaticServer();
    const { chromium } = await import(join(playwrightRoot, "index.mjs"));
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    try {
      await page.addInitScript(() => {
        localStorage.setItem("life-ledger-language", "de");
        localStorage.setItem("life-ledger-demo-dismissed-v1", "1");
        localStorage.setItem("life-ledger-ledger-onboarding-dismissed", "1");
      });
      await page.goto(base, { waitUntil: "networkidle" });
      await page.click('.nav-item[data-view="ledger"]');
      await page.waitForSelector("#ledgerView.active", { timeout: 15000 });
      const titleBefore = await page.locator(".ledger-header h2").textContent();
      await page.keyboard.press("ArrowLeft");
      await page.waitForFunction(
        (prev) => {
          const el = document.querySelector(".ledger-header h2");
          return el && el.textContent !== prev;
        },
        titleBefore,
        { timeout: 8000 },
      );
      await page.keyboard.press("/");
      await page.waitForFunction(() => document.activeElement?.id === "ledgerFilter");
      await page.evaluate(() => document.activeElement?.blur?.());
      await page.keyboard.press("n");
      await page.waitForFunction(() => document.activeElement?.id === "ledgerQuickInput");
    } finally {
      await browser.close();
      server.kill("SIGTERM");
    }
  },
);
