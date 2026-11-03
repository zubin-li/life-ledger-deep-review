import { chromium, webkit } from "/Users/ashan/Documents/Codex/ll-web-cards/node_modules/playwright/index.mjs";
import { mkdir } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawn, execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, "..");
const outDir = join(here, "shots");
const port = 5293;
const base = `http://127.0.0.1:${port}/index.html?mode=local`;

async function waitForServer(url, attempts = 40) {
  for (let i = 0; i < attempts; i += 1) {
    try {
      await execFileAsync("curl", ["-sf", "-o", "/dev/null", url]);
      return;
    } catch {
      await new Promise(r => setTimeout(r, 100));
    }
  }
  throw new Error(`HTTP server did not respond at ${url}`);
}

async function clearHorizon(page) {
  await page.evaluate(() => {
    const key = Object.keys(localStorage).find(k => k === "life-ledger-v1" || k.startsWith("life-ledger-v1"));
    if (!key) return;
    let state;
    try {
      state = JSON.parse(localStorage.getItem(key));
    } catch {
      return;
    }
    state.planning = { phases: [], currentPhaseId: "", note: "", updatedAt: 0 };
    state.longTermGoals = [];
    localStorage.setItem(key, JSON.stringify(state));
  });
}

async function shot(page, name) {
  await page.locator("#longrangeView").screenshot({ path: join(outDir, name) });
}

async function main() {
  await mkdir(outDir, { recursive: true });
  const server = spawn("python3", ["-m", "http.server", String(port), "--bind", "127.0.0.1"], {
    cwd: join(repoRoot, "public"),
    stdio: "ignore",
  });
  try {
    await waitForServer(`${base.split("?")[0]}`);
    const combos = [
      { lang: "zh", theme: "light", engine: chromium, slug: "chromium" },
      { lang: "zh", theme: "dark", engine: chromium, slug: "chromium" },
      { lang: "de", theme: "light", engine: webkit, slug: "webkit", w: 390 },
      { lang: "de", theme: "dark", engine: webkit, slug: "webkit", w: 390 },
    ];
    for (const c of combos) {
      const browser = await c.engine.launch({ headless: true });
      const ctx = await browser.newContext({
        viewport: { width: c.w || 1440, height: c.w ? 844 : 900 },
        colorScheme: c.theme === "dark" ? "dark" : "light",
      });
      await ctx.addInitScript(lang => {
        localStorage.setItem("life-ledger-language", lang);
        localStorage.setItem("life-ledger-demo-dismissed-v1", "1");
      }, c.lang);
      if (c.theme === "dark") {
        await ctx.addInitScript(() => {
          document.documentElement.dataset.theme = "dark";
        });
      }
      const page = await ctx.newPage();
      await page.goto(base, { waitUntil: "domcontentloaded" });
      await clearHorizon(page);
      await page.reload({ waitUntil: "domcontentloaded" });
      await page.click('.nav-item[data-view="longrange"]');
      await page.waitForSelector("#horizonEmptyStartPhase", { timeout: 15000 });
      await page.waitForSelector("#longrangeView .hairline-mount svg", { timeout: 10000 });
      await page.waitForTimeout(400);
      await shot(page, `b10r2-longrange-empty-${c.lang}-${c.theme}-${c.w || 1440}-${c.slug}.png`);
      await browser.close();
    }
  } finally {
    server.kill("SIGTERM");
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
