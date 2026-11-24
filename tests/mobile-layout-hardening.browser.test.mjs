import { spawn } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import assert from "node:assert/strict";
import { hasPlaywright, playwrightRoot } from "./playwright-resolve.mjs";
import {
  runAuditMatrix,
  writeAuditReport,
  switchToView,
  dismissMobileOnboarding,
  setMobileLanguage,
  measureActiveViewLayout,
} from "./mobile-layout-audit.mjs";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const port = 5327;
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

async function mobilePage(browser) {
  const context = await browser.newContext({
    viewport: { width: 360, height: 800 },
    isMobile: true,
    hasTouch: true,
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();
  await page.goto(base, { waitUntil: "domcontentloaded" });
  await dismissMobileOnboarding(page);
  return { context, page };
}

test(
  "mobile layout audit — 7 views × 3 languages × 3 viewports",
  { skip: !hasPlaywright, timeout: 600_000 },
  async () => {
    const server = await startStaticServer();
    const { chromium } = await import(join(playwrightRoot, "index.mjs"));
    const browser = await chromium.launch({ headless: true });
    try {
      const { context, page } = await mobilePage(browser);
      await setMobileLanguage(page, "zh");
      await page.reload({ waitUntil: "domcontentloaded" });
      await dismissMobileOnboarding(page);
      await page.waitForSelector("#todayView.view.active", { timeout: 20000 });

      const audit = await runAuditMatrix(page, { screenshotOnFail: true });
      const reportPath = writeAuditReport({
        ...audit,
        at: new Date().toISOString(),
      });

      assert.equal(audit.caseCount, 63, `expected 63 cases, got ${audit.caseCount}`);
      const failedRows = audit.results.filter(r => r.failed);
      if (failedRows.length) {
        const sample = failedRows.slice(0, 5).map(r => `${r.id}: overflow=${r.overflowPx.toFixed(1)} issues=${r.issues.join(",")}`).join("\n");
        assert.fail(`${audit.failures} failing cases (max overflow ${audit.maxOverflow.toFixed(1)}px). Report: ${reportPath}\n${sample}`);
      }
      await context.close();
    } finally {
      await browser.close();
      server.kill("SIGTERM");
    }
  },
);

test(
  "mobile layout — German 360px at ~130% text scale",
  { skip: !hasPlaywright, timeout: 120_000 },
  async () => {
    const server = await startStaticServer();
    const { chromium } = await import(join(playwrightRoot, "index.mjs"));
    const browser = await chromium.launch({ headless: true });
    try {
      const { context, page } = await mobilePage(browser);
      await setMobileLanguage(page, "de");
      await page.reload({ waitUntil: "domcontentloaded" });
      await dismissMobileOnboarding(page);
      await page.addStyleTag({ content: "html { font-size: 130% !important; }" });
      await page.setViewportSize({ width: 360, height: 800 });
      for (const view of ["today", "review", "ledger", "habits"]) {
        await switchToView(page, view);
        const m = await measureActiveViewLayout(page);
        assert.ok(m.overflowPx <= 2, `${view} de 130% overflow ${m.overflowPx}px`);
        assert.ok(m.navTargets.every(n => n.ok), `${view} nav targets under 48px`);
      }
      await context.close();
    } finally {
      await browser.close();
      server.kill("SIGTERM");
    }
  },
);

test(
  "mobile layout — short height with dynamic viewport (360×520)",
  { skip: !hasPlaywright, timeout: 120_000 },
  async () => {
    const server = await startStaticServer();
    const { chromium } = await import(join(playwrightRoot, "index.mjs"));
    const browser = await chromium.launch({ headless: true });
    try {
      const { context, page } = await mobilePage(browser);
      await setMobileLanguage(page, "en");
      await page.reload({ waitUntil: "domcontentloaded" });
      await dismissMobileOnboarding(page);
      await page.setViewportSize({ width: 360, height: 520 });
      await switchToView(page, "today");
      const navBottom = await page.evaluate(() => {
        const nav = document.querySelector(".sidebar");
        const mc = document.querySelector(".main-content");
        if (!nav || !mc) return { ok: false };
        const nb = nav.getBoundingClientRect();
        const mb = mc.getBoundingClientRect();
        const pad = parseFloat(getComputedStyle(mc).paddingBottom || "0");
        return { ok: mb.bottom - pad >= nb.top - 2, pad, gap: nb.top - (mb.bottom - pad) };
      });
      assert.ok(navBottom.ok, `bottom nav may cover content (gap ${navBottom.gap})`);
      const m = await measureActiveViewLayout(page);
      assert.ok(m.overflowPx <= 2, `short viewport overflow ${m.overflowPx}px`);
      await context.close();
    } finally {
      await browser.close();
      server.kill("SIGTERM");
    }
  },
);

test(
  "mobile layout — German Review 360×800 manual acceptance snapshot",
  { skip: !hasPlaywright, timeout: 120_000 },
  async () => {
    const server = await startStaticServer();
    const { chromium } = await import(join(playwrightRoot, "index.mjs"));
    const browser = await chromium.launch({ headless: true });
    try {
      const { context, page } = await mobilePage(browser);
      await setMobileLanguage(page, "de");
      await page.reload({ waitUntil: "domcontentloaded" });
      await dismissMobileOnboarding(page);
      await page.setViewportSize({ width: 360, height: 800 });
      await switchToView(page, "review");
      await page.waitForSelector("#reviewHabitCompare .rv-table tbody tr", { timeout: 15000 });
      const check = await page.evaluate(() => {
        const table = document.querySelector("#reviewHabitCompare .rv-table");
        const cells = [...document.querySelectorAll("#reviewHabitCompare .rv-table tbody th, #reviewHabitCompare .rv-table tbody td")];
        let overlap = false;
        for (let i = 0; i < cells.length; i++) {
          for (let j = i + 1; j < cells.length; j++) {
            const a = cells[i].getBoundingClientRect();
            const b = cells[j].getBoundingClientRect();
            if (a.width < 1 || b.width < 1) continue;
            const intersect = !(a.right <= b.left || a.left >= b.right || a.bottom <= b.top || a.top >= b.bottom);
            if (intersect && a.top === b.top && a.left !== b.left) {
              const overlapX = Math.min(a.right, b.right) - Math.max(a.left, b.left);
              if (overlapX > 4) overlap = true;
            }
          }
        }
        const docW = document.documentElement.clientWidth;
        const tableRight = table?.getBoundingClientRect().right ?? 0;
        return {
          overlap,
          tableWithin: tableRight <= docW + 2,
          scrollW: document.documentElement.scrollWidth,
          clientW: docW,
        };
      });
      assert.ok(!check.overlap, "review table cells overlap");
      assert.ok(check.tableWithin, "review table extends past viewport");
      assert.ok(check.scrollW <= check.clientW + 2, `horizontal scroll ${check.scrollW - check.clientW}px`);
      await context.close();
    } finally {
      await browser.close();
      server.kill("SIGTERM");
    }
  },
);