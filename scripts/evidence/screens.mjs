import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { startStaticServer } from "./server.mjs";
import { applyFixture, FIXTURE_DATE } from "./fixture.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "../../");
const publicDir = path.join(rootDir, "public");
const evidenceBase = process.env.EVIDENCE_DIR || "docs/phase-3-5-1";
const outputDir = path.join(rootDir, evidenceBase, "screens");
const summaryPath = path.join(rootDir, evidenceBase, "screens-summary.json");

fs.mkdirSync(outputDir, { recursive: true });

const WIDTHS = [980, 1180, 1440, 1600];
const LANGUAGES = ["en", "de", "zh"];
const THEMES = ["light", "dark"];
const PRIMARY_VIEWS = ["today", "week", "journal", "focus"];
const SECONDARY_VIEWS = ["insights", "habits"];
const LOCALE_EXPECTATIONS = {
  en: { documentLanguage: "en", bodyLanguage: "en", today: "Today", week: "Week" },
  de: { documentLanguage: "de", bodyLanguage: "de", today: "Heute", week: "Woche" },
  zh: { documentLanguage: "zh-CN", bodyLanguage: "zh", today: "今日", week: "本周" },
};

function evidenceUrl(baseUrl, language) {
  const url = new URL("/index.html", baseUrl);
  url.searchParams.set("desktop", "tauri-local");
  url.searchParams.set("lang", language);
  return url.toString();
}

async function verifyLocale(page, language, theme, screenshot, summary) {
  const expected = LOCALE_EXPECTATIONS[language];
  if (!expected) throw new Error(`Unsupported evidence locale "${language}" for ${screenshot}`);

  const actual = await page.evaluate(() => {
    const readSentinel = selector => {
      const element = document.querySelector(selector);
      const rect = element?.getBoundingClientRect();
      const style = element ? getComputedStyle(element) : null;
      return {
        text: element?.textContent?.trim() || "",
        visible: Boolean(
          element &&
          rect?.width &&
          rect?.height &&
          style?.display !== "none" &&
          style?.visibility !== "hidden" &&
          style?.opacity !== "0"
        ),
      };
    };

    return {
      urlLanguage: new URL(location.href).searchParams.get("lang"),
      documentLanguage: document.documentElement.lang,
      bodyLanguage: document.body.dataset.language || "",
      today: readSentinel('.sidebar .nav-item[data-view="today"] .nav-label'),
      week: readSentinel('.sidebar .nav-item[data-view="week"] .nav-label'),
    };
  });

  const mismatches = [];
  if (actual.urlLanguage !== language) {
    mismatches.push(`URL lang expected "${language}", got "${actual.urlLanguage || "(missing)"}"`);
  }
  if (actual.documentLanguage !== expected.documentLanguage) {
    mismatches.push(`documentElement.lang expected "${expected.documentLanguage}", got "${actual.documentLanguage}"`);
  }
  if (actual.bodyLanguage !== expected.bodyLanguage) {
    mismatches.push(`body.dataset.language expected "${expected.bodyLanguage}", got "${actual.bodyLanguage}"`);
  }
  for (const name of ["today", "week"]) {
    if (!actual[name].visible) mismatches.push(`${name} nav sentinel is not visible`);
    if (actual[name].text !== expected[name]) {
      mismatches.push(`${name} nav sentinel expected "${expected[name]}", got "${actual[name].text}"`);
    }
  }

  const check = {
    screenshot,
    requested: language,
    theme,
    url: actual.urlLanguage,
    document: actual.documentLanguage,
    body: actual.bodyLanguage,
    sentinels: {
      today: actual.today.text,
      week: actual.week.text,
    },
  };
  if (mismatches.length) {
    summary.localeFailures.push({ ...check, mismatches });
    fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2), "utf8");
    throw new Error(`Locale verification failed before ${screenshot}: ${mismatches.join("; ")}`);
  }
  let aggregate = summary.localeChecks.find(item => item.requested === language && item.theme === theme);
  if (!aggregate) {
    aggregate = {
      requested: language,
      theme,
      url: actual.urlLanguage,
      document: actual.documentLanguage,
      body: actual.bodyLanguage,
      sentinels: {
        today: actual.today.text,
        week: actual.week.text,
      },
      capturesVerified: 0,
    };
    summary.localeChecks.push(aggregate);
  }
  aggregate.capturesVerified += 1;
}

async function captureLocalizedScreenshot(page, file, language, theme, summary) {
  await verifyLocale(page, language, theme, path.basename(file), summary);
  await page.screenshot({ path: file });
  summary.totalScreenshots += 1;
}

async function runScreenshots() {
  console.log("Starting static server for screenshot evidence...");
  const server = await startStaticServer(publicDir);
  console.log(`Server running at ${server.url}`);

  const browser = await chromium.launch({ headless: true });
  const summary = {
    generatedAt: new Date().toISOString(),
    totalScreenshots: 0,
    pageErrors: [],
    horizontalScrolls: [],
    localeChecks: [],
    localeFailures: [],
  };

  for (const lang of LANGUAGES) {
    for (const theme of THEMES) {
      for (const width of WIDTHS) {
        const context = await browser.newContext({
          viewport: { width, height: 900 },
        });
        const page = await context.newPage();

        page.on("pageerror", (err) => {
          console.error(`Page error on ${lang}/${theme}/${width}:`, err);
          summary.pageErrors.push({ lang, theme, width, error: String(err) });
        });

        await applyFixture(page, { date: FIXTURE_DATE, theme, motion: "full", language: lang });
        await page.goto(evidenceUrl(server.url, lang));
        await page.waitForLoadState("domcontentloaded");
        await page.waitForTimeout(200);

        // Check horizontal scroll
        const hasHScroll = await page.evaluate(
          () => document.documentElement.scrollWidth > document.documentElement.clientWidth
        );
        if (hasHScroll) {
          summary.horizontalScrolls.push({ lang, theme, width });
        }

        // Today view
        await page.evaluate(() => {
          document.querySelector(".sidebar .nav-item[data-view='today']")?.click();
        });
        await page.waitForTimeout(100);
        const todayFile = path.join(outputDir, `today-${width}-${lang}-${theme}.png`);
        await captureLocalizedScreenshot(page, todayFile, lang, theme, summary);

        // Week view
        await page.evaluate(() => {
          document.querySelector(".sidebar .nav-item[data-view='week']")?.click();
        });
        await page.waitForTimeout(100);
        const weekFile = path.join(outputDir, `week-${width}-${lang}-${theme}.png`);
        await captureLocalizedScreenshot(page, weekFile, lang, theme, summary);

        // Journal day page
        await page.evaluate(() => {
          document.querySelector(".sidebar .nav-item[data-view='timeline']")?.click();
        });
        await page.waitForTimeout(100);
        const journalFile = path.join(outputDir, `journal-${width}-${lang}-${theme}.png`);
        await captureLocalizedScreenshot(page, journalFile, lang, theme, summary);

        // Focus panel views
        await page.evaluate(() => {
          const chip = document.querySelector("#toolbarPrimaryAction");
          if (chip && document.querySelector("#focusPanel")?.hidden) chip.click();
        });
        await page.waitForTimeout(100);

        // Focus Idle / Panel
        const focusFile = path.join(outputDir, `focus-${width}-${lang}-${theme}.png`);
        await captureLocalizedScreenshot(page, focusFile, lang, theme, summary);

        // For 1440 width, capture Insights and Habits
        if (width === 1440) {
          await page.keyboard.press("Escape"); // Close focus panel

          // Insights
          await page.evaluate(() => {
            document.querySelector(".sidebar .nav-item[data-view='review']")?.click();
          });
          await page.waitForTimeout(100);
          const insightsFile = path.join(outputDir, `insights-${width}-${lang}-${theme}.png`);
          await captureLocalizedScreenshot(page, insightsFile, lang, theme, summary);

          // Habits
          await page.evaluate(() => {
            document.querySelector(".sidebar .nav-item[data-view='habits']")?.click();
          });
          await page.waitForTimeout(100);
          const habitsFile = path.join(outputDir, `habits-${width}-${lang}-${theme}.png`);
          await captureLocalizedScreenshot(page, habitsFile, lang, theme, summary);

          // Today Edit Mode
          await page.evaluate(() => {
            document.querySelector(".sidebar .nav-item[data-view='today']")?.click();
          });
          await page.waitForTimeout(100);
          await page.evaluate(() => {
            document.querySelector("#editLayoutToggle")?.click();
          });
          await page.waitForTimeout(120);
          const editFile = path.join(outputDir, `today-edit-${width}-${lang}-${theme}.png`);
          await captureLocalizedScreenshot(page, editFile, lang, theme, summary);
          try { fs.copyFileSync(editFile, path.join(rootDir, evidenceBase, path.basename(editFile))); } catch {}
          await page.evaluate(() => {
            document.querySelector("#editLayoutToggle")?.click();
          });
          await page.waitForTimeout(80);

          // Week Edit Mode
          await page.evaluate(() => {
            document.querySelector(".sidebar .nav-item[data-view='week']")?.click();
          });
          await page.waitForTimeout(100);
          await page.evaluate(() => {
            document.querySelector("#editLayoutToggle")?.click();
          });
          await page.waitForTimeout(120);
          const weekEditFile = path.join(outputDir, `week-edit-${width}-${lang}-${theme}.png`);
          await captureLocalizedScreenshot(page, weekEditFile, lang, theme, summary);
          try { fs.copyFileSync(weekEditFile, path.join(rootDir, evidenceBase, path.basename(weekEditFile))); } catch {}
          await page.evaluate(() => {
            document.querySelector("#editLayoutToggle")?.click();
          });
          await page.waitForTimeout(80);
        }

        await context.close();
      }
    }
  }

  // Dedicated pass: Empty state screenshots with createEmptyFictionalState (light + dark, en, 1440)
  for (const emptyTheme of ["light", "dark"]) {
    const emptyContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const emptyPage = await emptyContext.newPage();
    await applyFixture(emptyPage, { date: FIXTURE_DATE, theme: emptyTheme, motion: "full", language: "en", empty: true });
    await emptyPage.goto(evidenceUrl(server.url, "en"));
    await emptyPage.waitForLoadState("domcontentloaded");
    await emptyPage.waitForTimeout(200);

    // Today empty
    await emptyPage.evaluate(() => {
      document.querySelector(".sidebar .nav-item[data-view='today']")?.click();
    });
    await emptyPage.waitForTimeout(120);
    const todayEmptyFile = path.join(outputDir, `today-empty-1440-en-${emptyTheme}.png`);
    await captureLocalizedScreenshot(emptyPage, todayEmptyFile, "en", emptyTheme, summary);
    try { fs.copyFileSync(todayEmptyFile, path.join(rootDir, evidenceBase, path.basename(todayEmptyFile))); } catch {}

    // Week empty
    await emptyPage.evaluate(() => {
      document.querySelector(".sidebar .nav-item[data-view='week']")?.click();
    });
    await emptyPage.waitForTimeout(120);
    const weekEmptyFile = path.join(outputDir, `week-empty-1440-en-${emptyTheme}.png`);
    await captureLocalizedScreenshot(emptyPage, weekEmptyFile, "en", emptyTheme, summary);
    try { fs.copyFileSync(weekEmptyFile, path.join(rootDir, evidenceBase, path.basename(weekEmptyFile))); } catch {}

    await emptyContext.close();
  }

  fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2), "utf8");
  console.log(`Screenshots complete (${summary.totalScreenshots} captured). Summary saved to ${summaryPath}`);

  await browser.close();
  await server.close();
}

runScreenshots().catch((err) => {
  console.error("Fatal error in screenshot runner:", err);
  process.exit(1);
});
