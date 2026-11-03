import { spawn } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import assert from "node:assert/strict";
import { hasPlaywright, playwrightRoot } from "./playwright-resolve.mjs";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const port = 5285;
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
  "Today card edit done plays saved pulse on bar and edit toggle",
  { skip: !hasPlaywright },
  async () => {
    const server = await startStaticServer();
    const { chromium } = await import(join(playwrightRoot, "index.mjs"));
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    try {
      await page.addInitScript(() => {
        localStorage.setItem("life-ledger-language", "zh");
        localStorage.setItem("life-ledger-today-cards-onboarding-dismissed", "1");
        localStorage.setItem("life-ledger-demo-dismissed-v1", "1");
      });
      await page.goto(base, { waitUntil: "domcontentloaded" });
      await page.click('.nav-item[data-view="today"]');
      await page.waitForSelector("#tcEditToggle", { timeout: 15000 });
      await page.locator("#tcEditToggle").click();
      await page.waitForSelector("#todayView.tc-editing", { timeout: 5000 });
      await page.locator(".tc-bar .tc-done").click();
      await page.waitForFunction(
        () => {
          const bar = document.querySelector(".tc-bar");
          const toggle = document.getElementById("tcEditToggle");
          return bar?.classList.contains("is-saved") && toggle?.classList.contains("tc-edit-saved-flash");
        },
        null,
        { timeout: 3000 },
      );
      await page.waitForFunction(() => !document.getElementById("todayView")?.classList.contains("tc-editing"), null, {
        timeout: 5000,
      });
    } finally {
      await browser.close();
      server.kill("SIGTERM");
    }
  },
);
