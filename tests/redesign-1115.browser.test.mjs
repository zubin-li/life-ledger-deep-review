import { spawn } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import assert from "node:assert/strict";
import { hasPlaywright, playwrightRoot } from "./playwright-resolve.mjs";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const port = 5294;
const baseDemo = `http://127.0.0.1:${port}/index.html?mode=local&local-preview=demo-showcase-v1`;

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

const views = ["today", "week", "longrange", "timeline", "ledger", "review"];

test(
  "redesign 1115 — each main view header shows visible hairline art with demo data",
  { skip: !hasPlaywright },
  async () => {
    const server = await startStaticServer();
    const { chromium } = await import(join(playwrightRoot, "index.mjs"));
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    try {
      await page.addInitScript(() => {
        localStorage.setItem("life-ledger-language", "zh");
        localStorage.setItem("life-ledger-today-cards-onboarding-dismissed", "1");
      });
      await page.goto(baseDemo, { waitUntil: "networkidle" });
      for (const v of views) {
        await page.locator(`.nav-item[data-view="${v}"]`).click();
        await page.waitForSelector(`#${v}View.active`, { timeout: 10000 });
        await page.waitForTimeout(1400);
        const n = await page.evaluate(view => {
          const root = document.getElementById(`${view}View`);
          const vis = el => {
            const r = el.getBoundingClientRect();
            const s = getComputedStyle(el);
            return r.width > 4 && r.height > 4 && s.visibility !== "hidden" && s.display !== "none";
          };
          return [...root.querySelectorAll(".page-art [data-art] svg, .page-art .hairline-mount svg")].filter(vis).length;
        }, v);
        assert.ok(n >= 1, `${v} should have header art`);
      }
    } finally {
      await browser.close();
      server.kill("SIGTERM");
    }
  },
);

test(
  "redesign 1115 — Today spending card renders 7 week bars",
  { skip: !hasPlaywright },
  async () => {
    const server = await startStaticServer();
    const { chromium } = await import(join(playwrightRoot, "index.mjs"));
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    try {
      await page.goto(baseDemo, { waitUntil: "networkidle" });
      await page.evaluate(() => { localStorage.setItem("life-ledger-today-cards-onboarding-dismissed" + (window.LifeLedgerStorageSuffix || ""), "1"); document.getElementById("tcOnboardHint")?.remove(); document.documentElement.classList.remove("tc-onboard-open"); window.LifeLedgerTodayCards?.show?.("spending"); });
      await page.waitForSelector(".tw-spend-week-bars li", { timeout: 12000 });
      const count = await page.locator(".tw-spend-week-bars li").count();
      assert.equal(count, 7);
    } finally {
      await browser.close();
      server.kill("SIGTERM");
    }
  },
);

test(
  "redesign 1115 — long-range plan cards collapsed by default",
  { skip: !hasPlaywright },
  async () => {
    const server = await startStaticServer();
    const { chromium } = await import(join(playwrightRoot, "index.mjs"));
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    try {
      await page.goto(baseDemo, { waitUntil: "networkidle" });
      await page.locator('.nav-item[data-view="longrange"]').click();
      await page.waitForSelector(".horizon-goal", { timeout: 12000 });
      const state = await page.evaluate(() => [...document.querySelectorAll(".horizon-goal")].map(card => ({
        collapsed: card.classList.contains("horizon-goal--collapsed"),
        expandedHidden: card.querySelector(".horizon-goal-expanded")?.hidden !== false,
      })));
      assert.ok(state.length > 0);
      assert.ok(state.every(s => s.collapsed && s.expandedHidden));
    } finally {
      await browser.close();
      server.kill("SIGTERM");
    }
  },
);

test(
  "redesign 1115 — timeline feed cards use scroll reveal and respect reduced motion",
  { skip: !hasPlaywright },
  async () => {
    const server = await startStaticServer();
    const { chromium } = await import(join(playwrightRoot, "index.mjs"));
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    try {
      await page.goto(baseDemo, { waitUntil: "networkidle" });
      await page.locator('.nav-item[data-view="timeline"]').click();
      await page.waitForSelector(".journal-feed-entry.ll-scroll-reveal", { timeout: 12000 });
      const hasClass = await page.locator(".journal-feed-entry.ll-scroll-reveal").first().isVisible();
      assert.ok(hasClass);
      await page.evaluate(() => document.documentElement.classList.add("motion-reduced"));
      await page.evaluate(() => window.LifeLedgerViewHeaders?.observeScrollReveal?.(document.getElementById("journalFeed")));
      const allVisible = await page.evaluate(() => [...document.querySelectorAll("#journalFeed .ll-scroll-reveal")].every(el => el.classList.contains("is-visible")));
      assert.ok(allVisible);
    } finally {
      await browser.close();
      server.kill("SIGTERM");
    }
  },
);