// Tap-every-control smoke for android-dist: on each tab (and inside Settings / sheets opened from it),
// tap each visible control once, record page errors / console errors / unhandled rejections and
// controls that produce no visible change. Output JSON to stdout. Bounded: <= 40 controls per screen.
import { chromium } from "playwright";
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { join, extname, resolve } from "node:path";
const root = resolve(process.env.ROOT || "android-dist");
const TYPES = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".svg": "image/svg+xml" };
const server = createServer(async (q, r) => { let p = decodeURIComponent(new URL(q.url, "http://x").pathname); if (p.endsWith("/")) p += "index.html"; try { const b = await readFile(join(root, p)); r.writeHead(200, { "content-type": TYPES[extname(p)] || "application/octet-stream" }); r.end(b); } catch { r.writeHead(404); r.end(); } }).listen(0);
const url = `http://127.0.0.1:${server.address().port}/index.html`;
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 412, height: 915 }, isMobile: true, hasTouch: true, locale: "zh-CN", acceptDownloads: true });
const page = await ctx.newPage();
let errs = [];
page.on("pageerror", e => errs.push("pageerror: " + e.message));
page.on("console", m => { if (m.type() === "error") errs.push("console: " + m.text()); });
page.on("dialog", d => d.dismiss().catch(() => {}));
page.on("filechooser", () => {});
await page.addInitScript(() => addEventListener("unhandledrejection", e => console.error("unhandledrejection: " + (e.reason?.message || e.reason))));
await page.goto(url); await page.waitForTimeout(4000);
for (const a of ["next", "sample"]) { const x = page.locator(`[data-w-action="${a}"]`).first(); if (await x.isVisible().catch(() => false)) { await x.tap({ force: true }); await page.waitForTimeout(900); } }
await page.waitForTimeout(1500);
const findings = []; const seen = new Set();
const SEL = "button:not([disabled]), [role=button], [role=tab], [role=switch], input[type=checkbox], select, a[href]";
async function tagVisible() {
  return page.evaluate(sel => {
    // Rendered controls anywhere on the current screen (below the fold too): not display:none, not inert/aria-hidden.
    const top = e => { const r = e.getBoundingClientRect(); if (r.width < 8 || r.height < 8 || e.closest("[inert], [aria-hidden=true], [hidden]")) return false; const cs = getComputedStyle(e); return cs.visibility !== "hidden" && cs.pointerEvents !== "none" && e.offsetParent !== null; };
    const els = [...document.querySelectorAll(sel)].filter(top);
    document.querySelectorAll("[data-smoke]").forEach(e => e.removeAttribute("data-smoke"));
    return els.map((e, i) => { e.setAttribute("data-smoke", i); return (e.getAttribute("aria-label") || e.textContent || e.id || e.className || e.tagName).trim().replace(/\s+/g, " ").slice(0, 40); });
  }, SEL);
}
const snap = () => page.evaluate(() => document.body.innerHTML.length + ":" + location.hash + ":" + document.querySelectorAll("[open], .is-open, [aria-expanded=true]").length + ":" + document.body.innerText.length);
async function backToTab(tab) {
  for (let i = 0; i < 3; i++) { await page.evaluate(() => window.LifeLedgerAndroidFace?.handleBack?.()); await page.keyboard.press("Escape").catch(() => {}); await page.waitForTimeout(150); }
  await page.locator(`[data-a-tab="${tab}"]`).first().tap({ force: true }).catch(() => {}); await page.waitForTimeout(400);
}
async function sweep(screen, tab, reopen, depth) {
  await reopen();
  const labels = await tagVisible();
  for (let i = 0; i < Math.min(labels.length, 40); i++) {
    const key = screen + "|" + labels[i];
    // Bottom tabs are covered by the perf gate; state-resetting actions (leave sample, delete, clear) would
    // change what every later tap sees, so they're exercised by unit tests instead.
    if (seen.has(key) || /^(今日|记账|时间轴|习惯)$/.test(labels[i]) || /结束观看|删除|清除|清空|重置|恢复备份/.test(labels[i])) continue;
    seen.add(key);
    await reopen(); const cur = await tagVisible(); const j = cur.indexOf(labels[i]);
    if (j < 0) { if (process.env.DEBUG) console.error("gone after reopen", screen, "|", labels[i], "| now:", cur.slice(0, 6).join(" / ")); continue; }
    const loc = page.locator(`[data-smoke="${j}"]`);
    await loc.scrollIntoViewIfNeeded({ timeout: 1000 }).catch(() => {});
    const hittable = await loc.evaluate(e => { const r = e.getBoundingClientRect(); const h = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); return !!h && (h === e || e.contains(h)); }).catch(() => false);
    if (process.env.DEBUG) console.error("try", screen, "|", labels[i], "| hittable", hittable);
    if (!hittable) continue; // covered by another layer at this scroll position: the user can't tap it either
    const sheetBefore = await page.evaluate(() => document.querySelectorAll(".a-sheet.is-open, .a-sheet[open], [role=dialog]:not([hidden]), .a-overlay.is-open, dialog[open]").length);
    errs = []; const before = await snap();
    await loc.tap({ force: true, timeout: 1500 }).catch(e => errs.push("tap: " + e.message.split("\n")[0]));
    await page.waitForTimeout(500);
    const after = await snap();
    if (errs.length || before === after) findings.push({ screen, control: labels[i], errors: [...new Set(errs)].slice(0, 2), noVisibleChange: before === after });
    if (depth < 1 && before !== after && !errs.length) {
      const opened = await page.evaluate(n => document.querySelectorAll(".a-sheet.is-open, .a-sheet[open], [role=dialog]:not([hidden]), .a-overlay.is-open, dialog[open]").length > n, sheetBefore);
      if (opened) { const lbl = labels[i]; await sweep(`${screen} > ${lbl}`, tab, async () => { await reopen(); const c2 = await tagVisible(); const k = c2.indexOf(lbl); if (k >= 0) { await page.locator(`[data-smoke="${k}"]`).tap({ force: true }).catch(() => {}); await page.waitForTimeout(500); } }, depth + 1); }
    }
  }
}
for (const tab of (process.env.TABS || "today,ledger,timeline,habits").split(",")) await sweep(tab, tab, () => backToTab(tab), 0);
console.log(JSON.stringify({ controlsTried: seen.size, findings }, null, 1));
await b.close(); server.close();
// No-visible-change is informational (an already-selected chip is fine); any error is a failure.
const broken = findings.filter(f => f.errors.length);
if (broken.length) { console.error(`SMOKE FAILED: ${broken.map(f => `${f.screen} > ${f.control}: ${f.errors[0]}`).join(" | ")}`); process.exit(1); }
