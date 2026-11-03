import { spawn } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import assert from "node:assert/strict";
import { hasPlaywright, playwrightRoot } from "./playwright-resolve.mjs";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const port = 5291;
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
  "Completing all scored habits shows celebration and orbit pulse",
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
      for (let i = 0; i < 24; i += 1) {
        const remaining = page.locator("#todayHabits .habit-card:not(.completed):not(.future-locked)");
        if ((await remaining.count()) === 0) break;
        await remaining.first().click();
        await page.waitForTimeout(480);
      }
      await page.waitForFunction(
        () =>
          document.querySelector("#celebration.show")
          && document.querySelector("#progressOrbit.is-all-complete-orbit")
          && document.querySelector('[data-card="habits"].is-all-complete'),
        null,
        { timeout: 8000 },
      );
      const flags = await page.evaluate(() => ({
        celebration: document.querySelector("#celebration")?.classList.contains("show"),
        orbit: document.querySelector("#progressOrbit")?.classList.contains("is-all-complete-orbit"),
        card: document.querySelector('[data-card="habits"]')?.classList.contains("is-all-complete"),
      }));
      assert.equal(flags.celebration, true);
      assert.equal(flags.orbit, true);
      assert.equal(flags.card, true);
    } finally {
      await browser.close();
      server.kill("SIGTERM");
    }
  },
);
