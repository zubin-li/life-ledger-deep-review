// Android 1.0 quality gate (local, fast): runs android-dist in Chromium as a mid-range phone
// (412x915, touch, 4x CPU slowdown — Lighthouse mobile profile) and checks measured budgets.
// Real-WebView numbers come from the CI review pack; this gate is the fast fix→retest loop.
// Usage: npm run android:prepare && node scripts/android-perf-gate.mjs   (exit 1 = gate failed)
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { join, extname, resolve } from "node:path";
import { chromium } from "playwright";

const RUNS = Number(process.env.RUNS || 5);
const BUDGET = {
  hiddenNodes: 400,        // desktop DOM shipped but never shown (baseline 2697)
  bootLongTaskTotal: 250,  // ms of main-thread blocking during boot (baseline ~603)
  bootLongTaskMax: 100,    // single longest boot task (baseline ~210)
  // Tap budgets count only app-attributable main-thread work (RAIL: handle input in <50 ms).
  // Headless tap→paint is NOT used: a control page with one trivial button measures 128-240 ms
  // here (synthetic touch + SwiftShader raster), the same as the app, so it can't see app cost.
  // Real tap→paint comes from the emulator/WebView review pack.
  tapProcessingMax: 50,    // event handlers (Event Timing processingEnd - processingStart)
  tapMainThreadMax: 100,   // all main-thread work caused by one tap (CDP TaskDuration delta)
};
const root = resolve(process.env.ROOT || "android-dist");
const TYPES = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".svg": "image/svg+xml", ".woff2": "font/woff2" };
const server = createServer(async (req, res) => {
  let p = decodeURIComponent(new URL(req.url, "http://x").pathname);
  if (p.endsWith("/")) p += "index.html";
  try { const body = await readFile(join(root, p)); res.writeHead(200, { "content-type": TYPES[extname(p)] || "application/octet-stream" }); res.end(body); }
  catch { res.writeHead(404); res.end(); }
}).listen(0);
const base = `http://127.0.0.1:${server.address().port}/index.html`;
const median = a => { const s = [...a].sort((x, y) => x - y); return s[Math.floor(s.length / 2)]; };

async function run(browser, locale) {
  const ctx = await browser.newContext({ viewport: { width: 412, height: 915 }, isMobile: true, hasTouch: true, locale, timezoneId: "Europe/Berlin" });
  const page = await ctx.newPage();
  await (await ctx.newCDPSession(page)).send("Emulation.setCPUThrottlingRate", { rate: 4 });
  const errors = [];
  page.on("pageerror", e => errors.push(e.message));
  await page.addInitScript(() => {
    window.__lt = []; window.__ev = [];
    new PerformanceObserver(l => { for (const e of l.getEntries()) window.__lt.push(e.duration); }).observe({ type: "longtask", buffered: true });
    new PerformanceObserver(l => { for (const e of l.getEntries()) if (["pointerdown", "pointerup", "click"].includes(e.name)) window.__ev.push(e.duration); }).observe({ type: "event", durationThreshold: 16, buffered: true });
  });
  await page.goto(base);
  await page.waitForTimeout(6000); // boot + splash window
  const boot = await page.evaluate(() => ({
    lt: window.__lt.splice(0),
    hidden: [...document.querySelectorAll("body *")].filter(e => e.offsetParent === null && getComputedStyle(e).position !== "fixed").length,
    lang: document.documentElement.lang || "",
    text: document.body.innerText.slice(0, 2000),
  }));
  // enter the app the way a user does: dismiss splash, open the sample
  for (const action of ["next", "sample"]) {
    const b = page.locator(`[data-w-action="${action}"]`).first();
    if (await b.isVisible().catch(() => false)) { await b.tap({ force: true }).catch(() => {}); await page.waitForTimeout(900); }
  }
  await page.waitForTimeout(2500);
  await page.evaluate(() => { window.__lt.length = 0; window.__ev.length = 0; });
  const cdp = await ctx.newCDPSession(page);
  await cdp.send("Performance.enable");
  const busy = async () => (await cdp.send("Performance.getMetrics")).metrics.find(m => m.name === "TaskDuration").value * 1000;
  const tabs = await page.$$eval("[data-a-tab]", els => [...new Set(els.map(e => e.getAttribute("data-a-tab")))]);
  const proc = [], mainThread = [], notSwitched = [];
  for (const tab of [...tabs, ...tabs]) {
    const box = await page.locator(`[data-a-tab="${tab}"]`).first().boundingBox();
    const pt = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
    await page.evaluate(() => { window.__evp = []; window.__po?.disconnect(); window.__po = new PerformanceObserver(l => { for (const e of l.getEntries()) window.__evp.push(e.processingEnd - e.processingStart); }); window.__po.observe({ type: "event", durationThreshold: 16 }); });
    const t0 = await busy();
    await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [pt] }); // raw touch: no harness work on the page thread
    await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    await page.waitForTimeout(700);
    mainThread.push((await busy()) - t0);
    proc.push(Math.max(0, ...(await page.evaluate(() => window.__evp))));
    if (await page.locator(`[data-a-tab="${tab}"]`).first().getAttribute("aria-current") !== "page") notSwitched.push(tab);
  }
  await ctx.close();
  return { errors, boot, proc, mainThread, notSwitched };
}

const browser = await chromium.launch();
const runs = [];
for (let i = 0; i < RUNS; i++) runs.push(await run(browser, "zh-CN"));
const de = await run(browser, "de-DE");
await browser.close(); server.close();

const m = {
  hiddenNodes: median(runs.map(r => r.boot.hidden)),
  bootLongTaskTotal: Math.round(median(runs.map(r => r.boot.lt.reduce((a, b) => a + b, 0)))),
  bootLongTaskMax: Math.round(median(runs.map(r => Math.max(0, ...r.boot.lt)))),
  tapProcessingMax: Math.round(median(runs.map(r => Math.max(...r.proc)))),
  tapMainThreadMax: Math.round(median(runs.map(r => Math.max(...r.mainThread)))),
};
const checks = Object.keys(BUDGET).map(k => ({ check: k, value: m[k], budget: BUDGET[k], pass: m[k] <= BUDGET[k] }));
const zhText = runs[0].boot.text, deText = de.boot.text;
checks.push({ check: "zh phone → Chinese UI", pass: /[\u4e00-\u9fff]{4,}/.test(zhText) && !/Explore 3-month sample/.test(zhText) });
checks.push({ check: "de phone → German UI", pass: !/[\u4e00-\u9fff]/.test(deText) && /Beispiel|Heute|Starten|Willkommen/.test(deText) });
checks.push({ check: "every tab tap switches tab", pass: runs.every(r => r.notSwitched.length === 0), value: [...new Set(runs.flatMap(r => r.notSwitched))].join(",") });
const errs = [...new Set([...runs, de].flatMap(r => r.errors))];
checks.push({ check: "no page errors", pass: errs.length === 0, value: errs.slice(0, 3).join(" | ") });
console.table(checks);
console.log("worst tap main-thread ms per run:", JSON.stringify(runs.map(r => Math.round(Math.max(...r.mainThread)))));
const failed = checks.filter(c => !c.pass);
console.log(failed.length ? `GATE FAILED: ${failed.map(c => c.check).join(", ")}` : "GATE PASSED");
process.exit(failed.length ? 1 : 0);
