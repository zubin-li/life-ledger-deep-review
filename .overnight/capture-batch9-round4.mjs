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
const port = 5294;
const demoBase = `http://127.0.0.1:${port}/index.html?mode=local&local-preview=demo-showcase-v1`;

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

async function shot(page, name) {
  await page.screenshot({ path: join(outDir, name), fullPage: false });
}

async function main() {
  await mkdir(outDir, { recursive: true });
  const server = spawn("python3", ["-m", "http.server", String(port), "--bind", "127.0.0.1"], {
    cwd: join(repoRoot, "public"),
    stdio: "ignore",
  });
  try {
    await waitForServer(demoBase.split("?")[0]);
    for (const [browserName, launcher] of [
      ["chromium", chromium],
      ["webkit", webkit],
    ]) {
      for (const theme of ["light", "dark"]) {
        for (const w of [
          { tag: "1440", width: 1440, height: 900, mobile: false },
          { tag: "390", width: 390, height: 844, mobile: true },
        ]) {
          const browser = await launcher.launch({ headless: true });
          const context = await browser.newContext({
            viewport: { width: w.width, height: w.height },
            colorScheme: theme,
            isMobile: w.mobile,
            hasTouch: w.mobile,
          });
          await context.addInitScript(() => {
            localStorage.setItem("life-ledger-language", "zh");
            localStorage.setItem("life-ledger-demo-dismissed-v1", "1");
            localStorage.setItem("life-ledger-ledger-onboarding-dismissed", "1");
          });
          if (theme === "dark") {
            await context.addInitScript(() => {
              document.documentElement.dataset.theme = "dark";
            });
          }
          const page = await context.newPage();
          await page.goto(demoBase, { waitUntil: "domcontentloaded" });
          await page.locator('.nav-item[data-view="week"]').click();
          await page.waitForSelector("#weekInsightsGrid:not(.week-insights--loading)", { timeout: 15000 });
          await page.locator("#previousWorkspaceWeek").click();
          await page.waitForTimeout(80);
          await page.locator("#weekInsightsGrid").scrollIntoViewIfNeeded();
          await page.waitForTimeout(120);
          await shot(
            page,
            `b9r4-week-insights-roll-zh-${theme}-${w.tag}-${browserName}.png`,
          );
          await context.close();
          await browser.close();
        }
      }
    }
  } finally {
    server.kill("SIGTERM");
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
