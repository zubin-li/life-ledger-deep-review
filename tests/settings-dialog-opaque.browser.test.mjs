import { spawn } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import assert from "node:assert/strict";
import { hasPlaywright, playwrightRoot } from "./playwright-resolve.mjs";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const port = 5296;
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
  "Settings dialog surface is opaque when open (C1 audit)",
  { skip: !hasPlaywright },
  async () => {
    const server = await startStaticServer();
    const { webkit } = await import(join(playwrightRoot, "index.mjs"));
    const browser = await webkit.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    try {
      await page.addInitScript(() => {
        localStorage.setItem("life-ledger-language", "zh");
        localStorage.setItem("life-ledger-demo-workspace-dismissed", "1");
      });
      await page.goto(base, { waitUntil: "domcontentloaded" });
      await page.click("#settingsButton");
      await page.waitForFunction(() => document.getElementById("settingsDialog")?.open, null, { timeout: 8000 });
      const alpha = await page.evaluate(() => {
        const el = document.getElementById("settingsDialog");
        if (!el) return 0;
        const bg = getComputedStyle(el).backgroundColor;
        const m = bg.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
        if (!m) return 1;
        return m[4] === undefined ? 1 : Number(m[4]);
      });
      assert.ok(alpha >= 0.99, `settings dialog background alpha ${alpha} should be opaque`);
    } finally {
      await browser.close();
      server.kill("SIGTERM");
    }
  },
);
