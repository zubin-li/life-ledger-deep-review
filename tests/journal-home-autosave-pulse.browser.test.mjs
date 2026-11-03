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
  "Home journal autosave badge pulses after typing",
  { skip: !hasPlaywright },
  async () => {
    const server = await startStaticServer();
    const { webkit } = await import(join(playwrightRoot, "index.mjs"));
    const browser = await webkit.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    try {
      await page.addInitScript(() => {
        localStorage.setItem("life-ledger-language", "en");
        localStorage.setItem("life-ledger-demo-dismissed-v1", "1");
      });
      await page.goto(base, { waitUntil: "networkidle" });
      await page.waitForSelector("#homeDayNote");
      await page.fill("#homeDayNote", "Quiet overnight check-in.");
      await page.waitForFunction(
        () => document.querySelector("#homeJournalSave")?.classList.contains("is-saved"),
        null,
        { timeout: 5000 },
      );
    } finally {
      await browser.close();
      server.kill("SIGTERM");
    }
  },
);

test(
  "Today mood pick adds just-picked feedback",
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
      const moodBtn = page.locator('#quickMood button[data-mood="很好"]');
      await moodBtn.click();
      await page.waitForFunction(
        () => document.querySelector('#quickMood button[data-mood="很好"]')?.classList.contains("just-picked")
          || document.querySelector('#quickMood button[data-mood="很好"]')?.classList.contains("selected"),
        null,
        { timeout: 8000 },
      );
      const selected = await moodBtn.evaluate(el => el.classList.contains("selected"));
      assert.equal(selected, true);
    } finally {
      await browser.close();
      server.kill("SIGTERM");
    }
  },
);
