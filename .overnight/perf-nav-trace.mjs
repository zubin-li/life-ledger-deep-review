/**
 * Record nav switch long tasks + layout shift proxy (owner feedback D3).
 * Usage: node .overnight/perf-nav-trace.mjs [--port 5298]
 */
import { chromium } from "/Users/ashan/Documents/Codex/ll-web-cards/node_modules/playwright/index.mjs";
import { writeFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, "..");
const portIdx = process.argv.indexOf("--port");
const port = Number(portIdx >= 0 ? process.argv[portIdx + 1] : 5298);
const outPath = join(here, "perf-nav-trace.json");

const server = spawn("python3", ["-m", "http.server", String(port), "--bind", "127.0.0.1"], {
  cwd: join(repoRoot, "public"),
  stdio: "ignore",
});
await new Promise(r => setTimeout(r, 400));

const base = `http://127.0.0.1:${port}/index.html?mode=local&local-preview=demo-showcase-v1`;
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage();

await page.goto(base, { waitUntil: "networkidle" });
await page.click('.nav-item[data-view="today"]');
await page.waitForSelector("#todayView.active");

const hops = ["week", "ledger", "review", "today"];
const samples = [];

for (const view of hops) {
  const trace = await page.evaluate(async ({ view }) => {
    const longTasks = [];
    let cls = 0;
    const obs = new PerformanceObserver(list => {
      for (const e of list.getEntries()) {
        if (e.entryType === "longtask") longTasks.push(e.duration);
        if (e.entryType === "layout-shift" && !e.hadRecentInput) cls += e.value;
      }
    });
    obs.observe({ entryTypes: ["longtask", "layout-shift"], buffered: true });
    const t0 = performance.now();
    document.querySelector(`.nav-item[data-view="${view}"]`)?.click();
    await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
    await new Promise(r => setTimeout(r, 520));
    const t1 = performance.now();
    obs.disconnect();
    return {
      view,
      ms: Math.round(t1 - t0),
      longTasks: longTasks.map(d => Math.round(d)),
      cls: Number(cls.toFixed(4)),
      active: document.querySelector(`#${view}View`)?.classList.contains("active") ?? false,
    };
  }, { view });
  samples.push(trace);
}

await browser.close();
server.kill("SIGTERM");

const summary = {
  capturedAt: new Date().toISOString(),
  port,
  samples,
  maxLongTaskMs: Math.max(0, ...samples.flatMap(s => s.longTasks)),
  maxCls: Math.max(0, ...samples.map(s => s.cls)),
};

await writeFile(outPath, `${JSON.stringify(summary, null, 2)}\n`, "utf8");
console.log(JSON.stringify(summary, null, 2));
