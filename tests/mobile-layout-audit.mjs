/**
 * Reusable mobile layout audit helpers (Playwright page required).
 * Detects page overflow even when root uses overflow-x: clip.
 */

import { mkdirSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
export const MOBILE_VIEWS = ["today", "week", "longrange", "timeline", "ledger", "review", "habits"];
export const MOBILE_LANGS = ["zh", "en", "de"];
export const MOBILE_VIEWPORTS = [
  { width: 360, height: 800, label: "360x800" },
  { width: 390, height: 844, label: "390x844" },
  { width: 412, height: 915, label: "412x915" },
];

/** Named intentional internal horizontal scrollers (allowlisted). */
export const H_SCROLL_ALLOWLIST = [
  ".habit-carousel-viewport",
  ".daily-tool-viewport",
  ".tw-wall-thumbs",
  ".tw-freq-tabs",
  ".money-filters",
  ".insight-shots",
  "#weekHabitStrip",
  ".week-habit-scroll",
  ".review-scatter-jump",
];

export function auditReportDir() {
  const dir = join(repoRoot, "test-results", "mobile-layout-audit");
  mkdirSync(dir, { recursive: true });
  return dir;
}

export async function setMobileLanguage(page, lang) {
  await page.evaluate(language => {
    localStorage.setItem("life-ledger-language", language);
  }, lang);
}

export async function dismissMobileOnboarding(page) {
  await page.evaluate(() => {
    localStorage.setItem("life-ledger-demo-dismissed-v1", "1");
    localStorage.setItem("life-ledger-today-cards-onboarding-dismissed", "1");
    localStorage.setItem("life-ledger-today-cards-onboarding-dismissed-preview-demo-showcase-v1", "1");
    document.documentElement.classList.remove("tc-onboard-open");
    document.getElementById("tcOnboardHint")?.remove();
  });
}

export async function switchToView(page, view) {
  await page.locator(`.nav-item[data-view="${view}"]:visible`).click();
  await page.waitForSelector(`#${view}View.view.active`, { timeout: 20000 });
  await page.waitForTimeout(350);
}

/**
 * @returns {{ overflowPx: number, navTargets: Array<{view:string,w:number,h:number}>, titleActionOverlap: boolean, issues: string[] }}
 */
export async function measureActiveViewLayout(page) {
  return page.evaluate(allowSelectors => {
    const rectsIntersect = (a, b) =>
      !(a.right <= b.left || a.left >= b.right || a.bottom <= b.top || a.top >= b.bottom);
    const issues = [];
    const clipHosts = [document.documentElement, document.body, ...document.querySelectorAll(".app-shell, .workspace-pane, .content-split, .main-content")];
    const saved = clipHosts.map(el => ({ el, ox: el.style.overflowX, oy: el.style.overflowY }));
    clipHosts.forEach(el => {
      el.style.overflowX = "visible";
      el.style.overflowY = "visible";
    });

    const active = document.querySelector(".view.active");
    const shellW = document.documentElement.clientWidth;
    let overflowPx = 0;
    let overflowElement = "";

    const measureEl = active || document.body;
    const r = measureEl.getBoundingClientRect();
    const descendants = [...measureEl.querySelectorAll("*")].filter(el => {
      const st = getComputedStyle(el);
      if (st.display === "none" || st.visibility === "hidden") return false;
      if (el.closest("[hidden]")) return false;
      if (el.closest(".view:not(.active)")) return false;
      if (el.closest("dialog:not([open])")) return false;
      if (el.closest(".day-drawer:not(.open), .today-ledger-sheet:not(.open)")) return false;
      for (const sel of allowSelectors) {
        if (el.matches(sel) || el.closest(sel)) return false;
      }
      return true;
    });

    for (const el of descendants) {
      const box = el.getBoundingClientRect();
      if (box.width < 1 || box.height < 1) continue;
      const over = Math.max(0, box.right - shellW - 2, -box.left - 2);
      if (over > overflowPx) {
        overflowPx = over;
        overflowElement = el.id
          ? `#${el.id}`
          : `${el.tagName.toLowerCase()}${[...el.classList].slice(0, 4).map((name) => `.${name}`).join("")}`;
      }
    }

    const docOver = Math.max(0, document.documentElement.scrollWidth - shellW - 2);
    overflowPx = Math.max(overflowPx, docOver);

    saved.forEach(({ el, ox, oy }) => {
      el.style.overflowX = ox;
      el.style.overflowY = oy;
    });

    const title = document.querySelector("#viewTitle, .topbar h1");
    const actions = document.querySelector(".top-actions");
    let titleActionOverlap = false;
    if (title && actions) {
      const tr = title.getBoundingClientRect();
      const ar = actions.getBoundingClientRect();
      titleActionOverlap = rectsIntersect(tr, ar);
      if (titleActionOverlap) issues.push("title/action overlap");
    }

    const navTargets = [...document.querySelectorAll(".main-nav .nav-item:not([hidden])")].map(btn => {
      // layout size, not the transformed rect: the tap animation briefly scales the active tab to .97
      const b = { width: btn.offsetWidth, height: btn.offsetHeight };
      const ok = b.width >= 48 && b.height >= 48;
      if (!ok) issues.push(`nav ${btn.dataset.view} ${Math.round(b.width)}x${Math.round(b.height)}`);
      return { view: btn.dataset.view || "", w: b.width, h: b.height, ok };
    });

    const current = document.querySelector(".nav-item.active[aria-current='page']");
    if (!current) issues.push("missing aria-current on active nav");

    return { overflowPx, navTargets, titleActionOverlap, issues };
  }, H_SCROLL_ALLOWLIST);
}

export async function runAuditMatrix(page, { onCase, screenshotOnFail } = {}) {
  const results = [];
  let maxOverflow = 0;
  let failures = 0;

  for (const lang of MOBILE_LANGS) {
    await setMobileLanguage(page, lang);
    await page.reload({ waitUntil: "domcontentloaded" });
    await dismissMobileOnboarding(page);
    await page.waitForSelector("#todayView.view.active", { timeout: 20000 });

    for (const view of MOBILE_VIEWS) {
      await switchToView(page, view);
      for (const vp of MOBILE_VIEWPORTS) {
        await page.setViewportSize({ width: vp.width, height: vp.height });
        await page.waitForTimeout(200);
        const metrics = await measureActiveViewLayout(page);
        const id = `${lang}/${view}/${vp.label}`;
        const failed = metrics.overflowPx > 2 || metrics.titleActionOverlap || metrics.navTargets.some(n => !n.ok);
        if (metrics.overflowPx > maxOverflow) maxOverflow = metrics.overflowPx;
        if (failed) failures += 1;
        const row = { id, lang, view, viewport: vp.label, ...metrics, failed };
        results.push(row);
        if (failed && screenshotOnFail) {
          const dir = auditReportDir();
          const shot = join(dir, `${id.replace(/\//g, "_")}.png`);
          await page.screenshot({ path: shot, fullPage: true });
          row.screenshot = shot;
        }
        onCase?.(row);
      }
    }
  }
  return { results, caseCount: results.length, failures, maxOverflow };
}

export function writeAuditReport(payload) {
  const dir = auditReportDir();
  const path = join(dir, "report.json");
  writeFileSync(path, JSON.stringify(payload, null, 2));
  return path;
}