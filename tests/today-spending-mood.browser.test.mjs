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
  "Today spending card shows zh mood pill on demo day with spend",
  { skip: !hasPlaywright },
  async () => {
    const server = await startStaticServer();
    const { webkit } = await import(join(playwrightRoot, "index.mjs"));
    const browser = await webkit.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    try {
      await page.addInitScript(() => {
        localStorage.setItem("life-ledger-language", "zh");
        localStorage.setItem("life-ledger-demo-dismissed-v1", "1");
      });
      await page.goto(base, { waitUntil: "networkidle" });
      await page.waitForSelector(".tw-card.tw-spending .tw-spend-mood-pill:not([hidden])", { timeout: 12000 });
      const mood = await page.locator(".tw-spend-mood-pill").getAttribute("data-mood");
      assert.ok(mood === "很好" || mood === "平静" || mood === "低落", `unexpected mood ${mood}`);
      const label = await page.locator(".tw-spend-mood-pill").textContent();
      assert.match(label || "", /很好|平静|低落/);
      await page.locator(".tw-spend-mood-pill").click();
      await page.waitForSelector("#reviewView.view.active", { timeout: 8000 });
      await page.waitForSelector("#review-scatter-mood", { timeout: 8000 });
      const reviewActive = await page.evaluate(() => document.getElementById("reviewView")?.classList.contains("active"));
      assert.equal(reviewActive, true);
    } finally {
      await browser.close();
      server.kill("SIGTERM");
    }
  },
);
