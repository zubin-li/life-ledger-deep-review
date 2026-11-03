import { spawn } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import assert from "node:assert/strict";
import { hasPlaywright, playwrightRoot } from "./playwright-resolve.mjs";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const port = 5297;
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
  "Money Escape clears day filter and income or expense split subtotal when mixed",
  { skip: !hasPlaywright },
  async () => {
    const server = await startStaticServer();
    const { webkit } = await import(join(playwrightRoot, "index.mjs"));
    const browser = await webkit.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    try {
      await page.addInitScript(() => {
        localStorage.setItem("life-ledger-demo-workspace-dismissed", "1");
        localStorage.setItem("life-ledger-ledger-onboarding-dismissed", "1");
        localStorage.setItem("life-ledger-language", "de");
      });
      await page.goto(base, { waitUntil: "networkidle" });
      await page.locator('.nav-item[data-view="ledger"]').click();
      await page.waitForSelector(".ledger-heat-grid [data-ledger-day]", { timeout: 15000 });
      const mixedDay = await page.evaluate(async () => {
        const cells = [...document.querySelectorAll("[data-ledger-day]")];
        for (const cell of cells) {
          cell.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
          await new Promise(r => requestAnimationFrame(r));
          const split = document.querySelector(".ledger-list-filter-sum-in");
          const chip = document.querySelector(".ledger-day-filter-chip");
          if (split && chip) return cell.getAttribute("data-ledger-day");
          const clear = document.querySelector("[data-ledger-clear-day]");
          clear?.click();
        }
        return null;
      });
      assert.ok(mixedDay, "expected a demo day with income and expense under day filter");
      await page.keyboard.press("Escape");
      await page.waitForSelector(".ledger-day-filter-chip", { state: "detached", timeout: 5000 });
      await page.waitForSelector(".ledger-list-filter-sum", { state: "detached", timeout: 5000 });
    } finally {
      await browser.close();
      server.kill("SIGTERM");
    }
  },
);
